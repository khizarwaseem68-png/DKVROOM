import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, apiError, apiResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/admin/stats - Admin dashboard stats (admin only)
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['admin'])) {
    return apiError('Admin access required', 403)
  }

  // Total counts
  const [
    totalUsers,
    totalDealers,
    totalCars,
    totalBookings,
    totalPayments,
    totalLoanApplications,
    totalContinueLoanEnquiries,
    totalAuctionBids,
    totalWorkshopAppointments,
    totalInsuranceEnquiries,
    totalReviews,
  ] = await Promise.all([
    db.user.count(),
    db.dealer.count(),
    db.car.count(),
    db.booking.count(),
    db.payment.count(),
    db.loanApplication.count(),
    db.continueLoanEnquiry.count(),
    db.auctionBid.count(),
    db.workshopAppointment.count(),
    db.insuranceEnquiry.count(),
    db.review.count(),
  ])

  // User breakdown by role
  const [customerCount, dealerUserCount, adminCount] = await Promise.all([
    db.user.count({ where: { role: 'customer' } }),
    db.user.count({ where: { role: 'dealer' } }),
    db.user.count({ where: { role: 'admin' } }),
  ])

  // Dealer verification status
  const [verifiedDealers, pendingDealers, rejectedDealers] = await Promise.all([
    db.dealer.count({ where: { verified: true } }),
    db.dealer.count({ where: { verified: false, rejectedAt: null } }),
    db.dealer.count({ where: { rejectedAt: { not: null } } }),
  ])

  // Car breakdown by type
  const [rentCars, saleCars, auctionCars, continueLoanCars] = await Promise.all([
    db.car.count({ where: { type: 'rent' } }),
    db.car.count({ where: { type: 'sale' } }),
    db.car.count({ where: { type: 'auction' } }),
    db.car.count({ where: { type: 'continueLoan' } }),
  ])

  // Car status breakdown
  const [pendingCars, approvedCars, rejectedCars] = await Promise.all([
    db.car.count({ where: { status: 'pending' } }),
    db.car.count({ where: { status: 'approved' } }),
    db.car.count({ where: { status: 'rejected' } }),
  ])

  // Payment breakdown by status
  const [pendingPayments, uploadedPayments, verifiedPayments, rejectedPayments] = await Promise.all([
    db.payment.count({ where: { status: 'pending' } }),
    db.payment.count({ where: { status: 'uploaded' } }),
    db.payment.count({ where: { status: 'verified' } }),
    db.payment.count({ where: { status: 'rejected' } }),
  ])

  // Revenue calculations
  const verifiedPaymentsData = await db.payment.findMany({
    where: { status: 'verified' },
    select: { amount: true, platformFee: true, dealerPayout: true }
  })

  const totalRevenue = verifiedPaymentsData.reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPlatformFees = verifiedPaymentsData.reduce((sum, p) => sum + (p.platformFee || 0), 0)
  const totalDealerPayouts = verifiedPaymentsData.reduce((sum, p) => sum + (p.dealerPayout || 0), 0)

  // Revenue by payment type
  const revenueByType = await db.payment.groupBy({
    by: ['paymentType'],
    where: { status: 'verified' },
    _sum: { amount: true, platformFee: true },
  })

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [recentUsers, recentBookings, recentPayments, recentCars] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.payment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.car.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ])

  const recentRevenue = await db.payment.aggregate({
    where: { status: 'verified', verifiedAt: { gte: thirtyDaysAgo } },
    _sum: { amount: true, platformFee: true },
  })

  // Recent audit logs
  const recentActivity = await db.auditLog.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } }
    }
  })

  // Booking status breakdown
  const bookingStatusBreakdown = await db.booking.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  // Loan status breakdown
  const loanStatusBreakdown = await db.loanApplication.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  return apiResponse({
    success: true,
    data: {
      totals: {
        users: totalUsers,
        dealers: totalDealers,
        cars: totalCars,
        bookings: totalBookings,
        payments: totalPayments,
        loanApplications: totalLoanApplications,
        continueLoanEnquiries: totalContinueLoanEnquiries,
        auctionBids: totalAuctionBids,
        workshopAppointments: totalWorkshopAppointments,
        insuranceEnquiries: totalInsuranceEnquiries,
        reviews: totalReviews,
      },
      userBreakdown: {
        customers: customerCount,
        dealers: dealerUserCount,
        admins: adminCount,
      },
      dealerVerification: {
        verified: verifiedDealers,
        pending: pendingDealers,
        rejected: rejectedDealers,
      },
      carBreakdown: {
        byType: { rent: rentCars, sale: saleCars, auction: auctionCars, continueLoan: continueLoanCars },
        byStatus: { pending: pendingCars, approved: approvedCars, rejected: rejectedCars },
      },
      paymentBreakdown: {
        byStatus: {
          pending: pendingPayments,
          uploaded: uploadedPayments,
          verified: verifiedPayments,
          rejected: rejectedPayments,
        }
      },
      revenue: {
        total: totalRevenue,
        platformFees: totalPlatformFees,
        dealerPayouts: totalDealerPayouts,
        byType: revenueByType.map(r => ({
          type: r.paymentType,
          amount: r._sum.amount || 0,
          platformFee: r._sum.platformFee || 0,
        })),
      },
      recentActivity30Days: {
        newUsers: recentUsers,
        newBookings: recentBookings,
        newPayments: recentPayments,
        newCars: recentCars,
        revenue: recentRevenue._sum.amount || 0,
        platformFees: recentRevenue._sum.platformFee || 0,
      },
      bookingStatusBreakdown: bookingStatusBreakdown.map(b => ({
        status: b.status,
        count: b._count.status,
      })),
      loanStatusBreakdown: loanStatusBreakdown.map(l => ({
        status: l.status,
        count: l._count.status,
      })),
      recentAuditLogs: recentActivity,
    }
  })
}
