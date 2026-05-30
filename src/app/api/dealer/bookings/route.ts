import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// ============================================================
// GET /api/dealer/bookings — List bookings for dealer's cars (dealer-only)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 60, keyPrefix: 'dealer-bookings' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check — dealer only
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)
    if (!requireRole(user, ['dealer'])) return apiError('Forbidden: dealer access required', 403)
    if (!user.dealer) return apiError('Dealer profile not found', 404)

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Filters
    const status = searchParams.get('status') || undefined
    const type = searchParams.get('type') || undefined
    const carId = searchParams.get('carId') || undefined

    // Build where clause
    const where: any = {
      dealerId: user.dealer.id,
    }

    if (status) where.status = status
    if (type) where.type = type
    if (carId) where.carId = carId

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          car: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              type: true,
              photos: true,
              price: true,
              city: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              whatsapp: true,
              avatar: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              qrReference: true,
              paymentType: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      db.booking.count({ where }),
    ])

    // Get status breakdown for the dealer
    const statusBreakdown = await db.booking.groupBy({
      by: ['status'],
      where: { dealerId: user.dealer.id },
      _count: { status: true },
    })

    const statusCounts = statusBreakdown.reduce((acc: any, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {})

    return paginatedResponse(
      {
        bookings,
        statusBreakdown: statusCounts,
      },
      total,
      page,
      limit,
    )
  } catch (error) {
    console.error('[DEALER_BOOKINGS_ERROR]', error)
    return apiError('Failed to fetch dealer bookings', 500)
  }
}
