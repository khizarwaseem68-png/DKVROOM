import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, apiResponse, apiError } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// ============================================================
// GET /api/dealer/stats — Dealer dashboard stats (dealer-only)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 30, keyPrefix: 'dealer-stats' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check — dealer only
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)
    if (!requireRole(user, ['dealer'])) return apiError('Forbidden: dealer access required', 403)
    if (!user.dealer) return apiError('Dealer profile not found', 404)

    const dealerId = user.dealer.id

    // Run all queries in parallel for performance
    const [
      totalListings,
      activeListings,
      pendingListings,
      totalBookings,
      activeBookings,
      completedBookings,
      totalRevenue,
      monthlyRevenue,
      totalViews,
      totalEnquiries,
      bookingStatusBreakdown,
      carTypeBreakdown,
      recentBookings,
      topCars,
    ] = await Promise.all([
      // Total listings (including inactive)
      db.car.count({
        where: { dealerId },
      }),

      // Active listings
      db.car.count({
        where: { dealerId, active: true, status: { in: ['approved', 'available'] } },
      }),

      // Pending approval listings
      db.car.count({
        where: { dealerId, status: 'pending', active: true },
      }),

      // Total bookings (all time)
      db.booking.count({
        where: { dealerId },
      }),

      // Active bookings (pending, confirmed, active)
      db.booking.count({
        where: {
          dealerId,
          status: { in: ['pending', 'payment_pending', 'payment_uploaded', 'confirmed', 'active'] },
        },
      }),

      // Completed bookings
      db.booking.count({
        where: { dealerId, status: 'completed' },
      }),

      // Total revenue from completed bookings
      db.payment.aggregate({
        where: {
          dealerId,
          status: 'verified',
          paymentType: 'booking',
        },
        _sum: { dealerPayout: true },
      }),

      // Monthly revenue (current month)
      db.payment.aggregate({
        where: {
          dealerId,
          status: 'verified',
          paymentType: 'booking',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { dealerPayout: true },
      }),

      // Total views across all cars
      db.car.aggregate({
        where: { dealerId, active: true },
        _sum: { views: true },
      }),

      // Total enquiries across all cars
      db.car.aggregate({
        where: { dealerId, active: true },
        _sum: { enquiries: true },
      }),

      // Booking status breakdown
      db.booking.groupBy({
        by: ['status'],
        where: { dealerId },
        _count: { status: true },
      }),

      // Car type breakdown
      db.car.groupBy({
        by: ['type'],
        where: { dealerId, active: true },
        _count: { type: true },
      }),

      // Recent 5 bookings
      db.booking.findMany({
        where: { dealerId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          car: {
            select: { brand: true, model: true, year: true, photos: true },
          },
          user: {
            select: { name: true, avatar: true },
          },
        },
      }),

      // Top 5 cars by views
      db.car.findMany({
        where: { dealerId, active: true },
        take: 5,
        orderBy: { views: 'desc' },
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          type: true,
          price: true,
          views: true,
          enquiries: true,
          photos: true,
          status: true,
          _count: {
            select: { bookings: true },
          },
        },
      }),
    ])

    // Format status breakdown
    const bookingStatusMap = bookingStatusBreakdown.reduce((acc: any, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {})

    // Format car type breakdown
    const carTypeMap = carTypeBreakdown.reduce((acc: any, item) => {
      acc[item.type] = item._count.type
      return acc
    }, {})

    // Calculate average rating from reviews (if any)
    const ratingInfo = await db.review.aggregate({
      where: {
        car: { dealerId },
      },
      _avg: { rating: true },
      _count: true,
    })

    // Build comprehensive stats object
    const stats = {
      // Listing stats
      listings: {
        total: totalListings,
        active: activeListings,
        pending: pendingListings,
        byType: carTypeMap,
      },

      // Booking stats
      bookings: {
        total: totalBookings,
        active: activeBookings,
        completed: completedBookings,
        byStatus: bookingStatusMap,
      },

      // Revenue stats
      revenue: {
        total: totalRevenue._sum.dealerPayout || 0,
        monthly: monthlyRevenue._sum.dealerPayout || 0,
      },

      // Engagement stats
      engagement: {
        totalViews: totalViews._sum.views || 0,
        totalEnquiries: totalEnquiries._sum.enquiries || 0,
        averageRating: ratingInfo._avg.rating
          ? Math.round(ratingInfo._avg.rating * 10) / 10
          : 0,
        totalReviews: ratingInfo._count,
      },

      // Dealer profile info
      profile: {
        companyName: user.dealer.companyName,
        verified: user.dealer.verified,
        subscriptionTier: user.dealer.subscriptionTier,
        subscriptionExpiry: user.dealer.subscriptionExpiry,
        rating: user.dealer.rating,
        totalSales: user.dealer.totalSales,
      },

      // Recent activity
      recentBookings,
      topCars,
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'dealer_stats_viewed',
        resource: 'dealer',
        resourceId: dealerId,
        severity: 'info',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return apiResponse({ success: true, data: stats })
  } catch (error) {
    console.error('[DEALER_STATS_ERROR]', error)
    return apiError('Failed to fetch dealer stats', 500)
  }
}
