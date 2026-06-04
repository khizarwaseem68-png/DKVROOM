import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, sanitizeObject, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// ============================================================
// GET /api/reviews — List reviews (public with filters, or admin/dealer)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 120, keyPrefix: 'reviews-list' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
    const skip = (page - 1) * limit

    const carId = searchParams.get('carId') || undefined
    const dealerId = searchParams.get('dealerId') || undefined
    const userId = searchParams.get('userId') || undefined
    const targetType = searchParams.get('targetType') || undefined
    const status = searchParams.get('status') || undefined
    const bookingId = searchParams.get('bookingId') || undefined
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    // Auth for non-public queries
    const user = await getUserFromRequest(request)

    const where: any = {}

    if (carId) where.carId = carId
    if (dealerId) where.dealerId = dealerId
    if (userId) where.userId = userId
    if (targetType) where.targetType = targetType
    if (bookingId) where.bookingId = bookingId

    // Only admins/dealers can filter by status or see non-published reviews
    if (status) {
      if (!user || (user.role !== 'admin' && user.role !== 'dealer')) {
        return apiError('Forbidden', 403)
      }
      where.status = status
    } else if (!user || user.role !== 'admin') {
      // Public: only show published
      where.status = 'published'
    }

    const allowedSortFields = ['createdAt', 'rating', 'updatedAt']
    const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt'
    const sortOrder = order === 'asc' ? 'asc' : 'desc'
    const orderBy = { [sortField]: sortOrder }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          car: {
            select: { id: true, brand: true, model: true, photos: true },
          },
          dealer: {
            select: { id: true, companyName: true, logo: true },
          },
        },
      }),
      db.review.count({ where }),
    ])

    return paginatedResponse(reviews, total, page, limit)
  } catch (error) {
    console.error('[REVIEWS_LIST_ERROR]', error)
    return apiError('Failed to fetch reviews', 500)
  }
}

// ============================================================
// Helper: recalculate rating for a car
// ============================================================
async function recalculateCarRating(carId: string) {
  const agg = await db.review.aggregate({
    where: { carId, status: 'published' },
    _avg: { rating: true },
  })
  const newRating = agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0
  await db.car.update({
    where: { id: carId },
    data: { rating: newRating },
  })
}

// ============================================================
// Helper: recalculate rating for a dealer
// ============================================================
async function recalculateDealerRating(dealerId: string) {
  const agg = await db.review.aggregate({
    where: { dealerId, status: 'published' },
    _avg: { rating: true },
  })
  const newRating = agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0
  await db.dealer.update({
    where: { id: dealerId },
    data: { rating: newRating },
  })
}

// ============================================================
// POST /api/reviews — Create a review (customer only, after completed booking)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 10, keyPrefix: 'reviews-create' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)
    if (!requireRole(user, ['customer'])) return apiError('Forbidden: customer access required', 403)

    const body = await request.json()
    const sanitized = sanitizeObject(body)

    if (!sanitized.rating || typeof sanitized.rating !== 'number') {
      return apiError('Rating is required (1-5)', 400)
    }
    const rating = Math.max(1, Math.min(5, Math.round(sanitized.rating)))
    const comment = sanitized.comment ? sanitizeInput(String(sanitized.comment)) : null
    const targetType = sanitized.targetType === 'dealer' ? 'dealer' : 'car'
    const bookingId = sanitized.bookingId ? String(sanitized.bookingId) : null

    if (targetType === 'car') {
      const carId = sanitized.carId ? String(sanitized.carId) : null
      if (!carId) return apiError('carId is required for car reviews', 400)

      // Verify the car exists
      const car = await db.car.findUnique({ where: { id: carId } })
      if (!car) return apiError('Car not found', 404)

      // Verify user has a completed booking for this car
      if (bookingId) {
        const booking = await db.booking.findUnique({ where: { id: bookingId } })
        if (!booking || booking.userId !== user.id || booking.carId !== carId) {
          return apiError('Invalid booking reference', 400)
        }
        if (booking.status !== 'completed') {
          return apiError('You can only review after the booking is completed', 400)
        }
      } else {
        // Check if user has ANY completed booking for this car
        const completedBooking = await db.booking.findFirst({
          where: {
            carId,
            userId: user.id,
            status: 'completed',
          },
        })
        if (!completedBooking) {
          return apiError('You can only review a car after a completed booking', 400)
        }
      }

      // Check for existing review from this user for this car
      const existingReview = await db.review.findFirst({
        where: { carId, userId: user.id },
      })
      if (existingReview) {
        return apiError('You have already reviewed this car', 409)
      }

      const review = await db.review.create({
        data: {
          carId,
          userId: user.id,
          targetType: 'car',
          bookingId,
          rating,
          comment,
          status: 'published',
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          car: { select: { id: true, brand: true, model: true, photos: true } },
        },
      })

      // Recalculate car rating
      await recalculateCarRating(carId)

      // Audit log
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'review_created',
          resource: 'review',
          resourceId: review.id,
          details: JSON.stringify({ carId, rating, targetType: 'car' }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          severity: 'info',
        },
      })

      return apiResponse({ success: true, data: review }, 201)
    } else {
      // Dealer review
      const dealerId = sanitized.dealerId ? String(sanitized.dealerId) : null
      if (!dealerId) return apiError('dealerId is required for dealer reviews', 400)

      const dealer = await db.dealer.findUnique({ where: { id: dealerId } })
      if (!dealer) return apiError('Dealer not found', 404)

      // Verify user has a completed booking with this dealer
      if (bookingId) {
        const booking = await db.booking.findUnique({ where: { id: bookingId } })
        if (!booking || booking.userId !== user.id || booking.dealerId !== dealerId) {
          return apiError('Invalid booking reference', 400)
        }
        if (booking.status !== 'completed') {
          return apiError('You can only review after the booking is completed', 400)
        }
      } else {
        const completedBooking = await db.booking.findFirst({
          where: {
            dealerId,
            userId: user.id,
            status: 'completed',
          },
        })
        if (!completedBooking) {
          return apiError('You can only review a dealer after a completed booking', 400)
        }
      }

      // Check existing review
      const existingReview = await db.review.findFirst({
        where: { dealerId, userId: user.id },
      })
      if (existingReview) {
        return apiError('You have already reviewed this dealer', 409)
      }

      const review = await db.review.create({
        data: {
          dealerId,
          userId: user.id,
          targetType: 'dealer',
          bookingId,
          rating,
          comment,
          status: 'published',
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          dealer: { select: { id: true, companyName: true, logo: true } },
        },
      })

      // Recalculate dealer rating
      await recalculateDealerRating(dealerId)

      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'review_created',
          resource: 'review',
          resourceId: review.id,
          details: JSON.stringify({ dealerId, rating, targetType: 'dealer' }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          severity: 'info',
        },
      })

      return apiResponse({ success: true, data: review }, 201)
    }
  } catch (error) {
    console.error('[REVIEW_CREATE_ERROR]', error)
    return apiError('Failed to create review', 500)
  }
}
