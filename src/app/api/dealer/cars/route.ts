import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// ============================================================
// GET /api/dealer/cars — List dealer's own cars (dealer-only)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 60, keyPrefix: 'dealer-cars' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check — dealer only
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)
    if (!requireRole(user, ['dealer'])) return apiError('Forbidden: dealer access required', 403)
    if (!user.dealer) return apiError('Dealer profile not found', 404)
    if (user.dealer.rejectedAt) return apiError('Dealer account rejected', 403)
    if (!user.dealer.verified) return apiError('Dealer account pending verification', 403)

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    // Filters
    const status = searchParams.get('status') || undefined
    const type = searchParams.get('type') || undefined
    const search = searchParams.get('search') || undefined

    // Build where clause
    const where: any = {
      dealerId: user.dealer.id,
    }

    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Optionally include inactive listings
    const includeInactive = searchParams.get('includeInactive') === 'true'
    if (!includeInactive) {
      where.active = true
    }

    const [cars, total] = await Promise.all([
      db.car.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      db.car.count({ where }),
    ])

    // Get aggregate stats for the dealer's cars
    const stats = await db.car.aggregate({
      where: { dealerId: user.dealer.id, active: true },
      _count: true,
      _sum: { views: true, enquiries: true },
    })

    return paginatedResponse(
      {
        cars,
        stats: {
          totalActive: stats._count,
          totalViews: stats._sum.views || 0,
          totalEnquiries: stats._sum.enquiries || 0,
        },
      },
      total,
      page,
      limit,
    )
  } catch (error) {
    console.error('[DEALER_CARS_ERROR]', error)
    return apiError('Failed to fetch dealer cars', 500)
  }
}
