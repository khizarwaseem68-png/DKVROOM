import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, apiError, apiResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

function countGrouped<T extends { _count: unknown }>(rows: T[], key: string): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = (row as Record<string, unknown>)[key]
    const count = row._count as Record<string, unknown>
    if (typeof value === 'string') {
      acc[value] = typeof count[key] === 'number' ? count[key] : 0
    }
    return acc
  }, {})
}

function sumCounts(values: Record<string, number>): number {
  return Object.values(values).reduce((sum, count) => sum + count, 0)
}

// GET /api/admin/stats - Admin dashboard stats (admin only)
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['admin'])) {
    return apiError('Admin access required', 403)
  }

  const summaryOnly = request.nextUrl.searchParams.get('summary') === 'true'

  if (summaryOnly) {
    const [
      userRoleBreakdown,
      dealerVerifiedBreakdown,
      rejectedDealers,
      carStatusBreakdown,
      paymentStatusBreakdown,
      totalLoanApplications,
      verifiedPaymentRevenue,
    ] = await Promise.all([
      db.user.groupBy({ by: ['role'], _count: { role: true } }),
      db.dealer.groupBy({ by: ['verified'], _count: { verified: true } }),
      db.dealer.count({ where: { rejectedAt: { not: null } } }),
      db.car.groupBy({ by: ['status'], _count: { status: true } }),
      db.payment.groupBy({ by: ['status'], _count: { status: true } }),
      db.loanApplication.count(),
      db.payment.aggregate({
        where: { status: 'verified' },
        _sum: { amount: true, platformFee: true, dealerPayout: true },
      }),
    ])

    const userCounts = countGrouped(userRoleBreakdown, 'role')
    const carStatusCounts = countGrouped(carStatusBreakdown, 'status')
    const paymentStatusCounts = countGrouped(paymentStatusBreakdown, 'status')
    const verifiedDealerCount = dealerVerifiedBreakdown.find((row) => row.verified)?._count.verified ?? 0
    const unverifiedDealerCount = dealerVerifiedBreakdown.find((row) => !row.verified)?._count.verified ?? 0
    const pendingDealers = Math.max(unverifiedDealerCount - rejectedDealers, 0)

    return apiResponse({
      success: true,
      data: {
        totals: {
          users: sumCounts(userCounts),
          dealers: verifiedDealerCount + unverifiedDealerCount,
          cars: sumCounts(carStatusCounts),
          payments: sumCounts(paymentStatusCounts),
          loanApplications: totalLoanApplications,
        },
        dealerVerification: {
          verified: verifiedDealerCount,
          pending: pendingDealers,
          rejected: rejectedDealers,
        },
        carBreakdown: {
          byStatus: {
            pending: carStatusCounts.pending ?? 0,
            approved: carStatusCounts.approved ?? 0,
            rejected: carStatusCounts.rejected ?? 0,
          },
        },
        paymentBreakdown: {
          byStatus: {
            pending: paymentStatusCounts.pending ?? 0,
            uploaded: paymentStatusCounts.uploaded ?? 0,
            verified: paymentStatusCounts.verified ?? 0,
            rejected: paymentStatusCounts.rejected ?? 0,
          },
        },
        revenue: {
          total: verifiedPaymentRevenue._sum.amount || 0,
          platformFees: verifiedPaymentRevenue._sum.platformFee || 0,
          dealerPayouts: verifiedPaymentRevenue._sum.dealerPayout || 0,
        },
      },
    })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    userRoleBreakdown,
    dealerVerifiedBreakdown,
    rejectedDealers,
    carTypeBreakdown,
    carStatusBreakdown,
    bookingStatusBreakdown,
    paymentStatusBreakdown,
    loanStatusBreakdown,
    verifiedPaymentRevenue,
    revenueByType,
    totalContinueLoanEnquiries,
    totalAuctionBids,
    totalWorkshopAppointments,
    totalInsuranceEnquiries,
    totalReviews,
    recentUsers,
    recentBookings,
    recentPayments,
    recentCars,
    recentRevenue,
    recentActivity,
  ] = await Promise.all([
    db.user.groupBy({ by: ['role'], _count: { role: true } }),
    db.dealer.groupBy({ by: ['verified'], _count: { verified: true } }),
    db.dealer.count({ where: { rejectedAt: { not: null } } }),
    db.car.groupBy({ by: ['type'], _count: { type: true } }),
    db.car.groupBy({ by: ['status'], _count: { status: true } }),
    db.booking.groupBy({ by: ['status'], _count: { status: true } }),
    db.payment.groupBy({ by: ['status'], _count: { status: true } }),
    db.loanApplication.groupBy({ by: ['status'], _count: { status: true } }),
    db.payment.aggregate({
      where: { status: 'verified' },
      _sum: { amount: true, platformFee: true, dealerPayout: true },
    }),
    db.payment.groupBy({
      by: ['paymentType'],
      where: { status: 'verified' },
      _sum: { amount: true, platformFee: true },
    }),
    db.continueLoanEnquiry.count(),
    db.auctionBid.count(),
    db.workshopAppointment.count(),
    db.insuranceEnquiry.count(),
    db.review.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.payment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.car.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.payment.aggregate({
      where: { status: 'verified', verifiedAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true, platformFee: true },
    }),
    db.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        severity: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ])

  const userCounts = countGrouped(userRoleBreakdown, 'role')
  const carTypeCounts = countGrouped(carTypeBreakdown, 'type')
  const carStatusCounts = countGrouped(carStatusBreakdown, 'status')
  const paymentStatusCounts = countGrouped(paymentStatusBreakdown, 'status')
  const bookingStatusCounts = countGrouped(bookingStatusBreakdown, 'status')
  const loanStatusCounts = countGrouped(loanStatusBreakdown, 'status')
  const verifiedDealerCount = dealerVerifiedBreakdown.find((row) => row.verified)?._count.verified ?? 0
  const unverifiedDealerCount = dealerVerifiedBreakdown.find((row) => !row.verified)?._count.verified ?? 0
  const pendingDealers = Math.max(unverifiedDealerCount - rejectedDealers, 0)
  const totalUsers = sumCounts(userCounts)
  const totalDealers = verifiedDealerCount + unverifiedDealerCount
  const totalCars = sumCounts(carTypeCounts)
  const totalBookings = sumCounts(bookingStatusCounts)
  const totalPayments = sumCounts(paymentStatusCounts)
  const totalLoanApplications = sumCounts(loanStatusCounts)
  const totalRevenue = verifiedPaymentRevenue._sum.amount || 0
  const totalPlatformFees = verifiedPaymentRevenue._sum.platformFee || 0
  const totalDealerPayouts = verifiedPaymentRevenue._sum.dealerPayout || 0

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
        customers: userCounts.customer ?? 0,
        dealers: userCounts.dealer ?? 0,
        admins: userCounts.admin ?? 0,
      },
      dealerVerification: {
        verified: verifiedDealerCount,
        pending: pendingDealers,
        rejected: rejectedDealers,
      },
      carBreakdown: {
        byType: {
          rent: carTypeCounts.rent ?? 0,
          sale: carTypeCounts.sale ?? 0,
          auction: carTypeCounts.auction ?? 0,
          continueLoan: carTypeCounts.continueLoan ?? 0,
        },
        byStatus: {
          pending: carStatusCounts.pending ?? 0,
          approved: carStatusCounts.approved ?? 0,
          rejected: carStatusCounts.rejected ?? 0,
        },
      },
      paymentBreakdown: {
        byStatus: {
          pending: paymentStatusCounts.pending ?? 0,
          uploaded: paymentStatusCounts.uploaded ?? 0,
          verified: paymentStatusCounts.verified ?? 0,
          rejected: paymentStatusCounts.rejected ?? 0,
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
      bookingStatusBreakdown: bookingStatusBreakdown.map((booking) => ({
        status: booking.status,
        count: booking._count.status,
      })),
      loanStatusBreakdown: loanStatusBreakdown.map((loan) => ({
        status: loan.status,
        count: loan._count.status,
      })),
      recentAuditLogs: recentActivity,
    }
  })
}
