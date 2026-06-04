import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, sanitizeObject, apiResponse, apiError } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// ============================================================
// Helpers: recalculate ratings
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
// GET /api/reviews/[id] — Single review detail
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 120, keyPrefix: 'reviews-detail' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    const { id } = await params

    const review = await db.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        car: { select: { id: true, brand: true, model: true, photos: true } },
        dealer: { select: { id: true, companyName: true, logo: true } },
      },
    })

    if (!review) return apiError('Review not found', 404)

    return apiResponse({ success: true, data: review })
  } catch (error) {
    console.error('[REVIEW_DETAIL_ERROR]', error)
    return apiError('Failed to fetch review', 500)
  }
}

// ============================================================
// PUT /api/reviews/[id] — Update review (owner: edit content, admin: moderate status)
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 20, keyPrefix: 'reviews-update' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)

    const { id } = await params

    const existingReview = await db.review.findUnique({ where: { id } })
    if (!existingReview) return apiError('Review not found', 404)

    const isOwner = existingReview.userId === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return apiError('Forbidden: you do not have permission to update this review', 403)
    }

    const body = await request.json()
    const sanitized = sanitizeObject(body)

    const updateData: any = {}

    // Owner can update rating and comment
    if (isOwner) {
      if (sanitized.rating !== undefined) {
        const rating = Math.max(1, Math.min(5, Math.round(Number(sanitized.rating))))
        updateData.rating = rating
      }
      if (sanitized.comment !== undefined) {
        updateData.comment = sanitized.comment ? sanitizeInput(String(sanitized.comment)) : null
      }
    }

    // Admin can moderate status
    if (isAdmin && sanitized.status) {
      const validStatuses = ['published', 'hidden', 'flagged']
      if (!validStatuses.includes(sanitized.status)) {
        return apiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
      }
      updateData.status = sanitized.status
    }

    if (Object.keys(updateData).length === 0) {
      return apiError('No valid fields to update', 400)
    }

    const updatedReview = await db.review.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        car: { select: { id: true, brand: true, model: true, photos: true } },
        dealer: { select: { id: true, companyName: true, logo: true } },
      },
    })

    // Recalculate ratings if status changed or rating changed
    if (updateData.status || updateData.rating !== undefined) {
      if (existingReview.carId) {
        await recalculateCarRating(existingReview.carId)
      }
      if (existingReview.dealerId) {
        await recalculateDealerRating(existingReview.dealerId)
      }
    }

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'review_updated',
        resource: 'review',
        resourceId: id,
        details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      },
    })

    return apiResponse({ success: true, data: updatedReview })
  } catch (error) {
    console.error('[REVIEW_UPDATE_ERROR]', error)
    return apiError('Failed to update review', 500)
  }
}

// ============================================================
// DELETE /api/reviews/[id] — Delete review (owner or admin)
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 10, keyPrefix: 'reviews-delete' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)

    const { id } = await params

    const existingReview = await db.review.findUnique({ where: { id } })
    if (!existingReview) return apiError('Review not found', 404)

    const isOwner = existingReview.userId === user.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return apiError('Forbidden: you do not have permission to delete this review', 403)
    }

    const carId = existingReview.carId
    const dealerId = existingReview.dealerId

    await db.review.delete({ where: { id } })

    // Recalculate ratings after deletion
    if (carId) {
      await recalculateCarRating(carId)
    }
    if (dealerId) {
      await recalculateDealerRating(dealerId)
    }

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'review_deleted',
        resource: 'review',
        resourceId: id,
        details: JSON.stringify({ carId, dealerId, wasOwner: isOwner }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: isAdmin ? 'warning' : 'info',
      },
    })

    return apiResponse({ success: true, message: 'Review deleted successfully' })
  } catch (error) {
    console.error('[REVIEW_DELETE_ERROR]', error)
    return apiError('Failed to delete review', 500)
  }
}
