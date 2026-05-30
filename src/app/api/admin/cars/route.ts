import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/admin/cars - List all cars with filters (admin only)
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['admin'])) {
    return apiError('Admin access required', 403)
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const brand = searchParams.get('brand')
  const city = searchParams.get('city')
  const dealerId = searchParams.get('dealerId')
  const featured = searchParams.get('featured')
  const search = searchParams.get('search')

  const where: any = {}

  if (status) where.status = status
  if (type) where.type = type
  if (brand) where.brand = { contains: brand, mode: 'insensitive' }
  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (dealerId) where.dealerId = dealerId
  if (featured !== null && featured !== undefined) {
    where.featured = featured === 'true'
  }
  if (search) {
    where.OR = [
      { brand: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [cars, total] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        dealer: {
          select: { id: true, companyName: true, verified: true }
        },
        dealerUser: {
          select: { id: true, name: true, email: true }
        },
        _count: { select: { bookings: true, reviews: true, auctionBids: true, continueLoanEnquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.car.count({ where })
  ])

  return paginatedResponse(cars, total, page, limit)
}

// PUT /api/admin/cars - Approve/reject car listing (admin only)
export async function PUT(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['admin'])) {
    return apiError('Admin access required', 403)
  }

  const body = await request.json()
  const { carId, action, rejectionReason } = body

  if (!carId) return apiError('Car ID is required', 400)
  if (!action || !['approve', 'reject'].includes(action)) {
    return apiError('Action must be approve or reject', 400)
  }

  const car = await db.car.findUnique({
    where: { id: carId },
    include: {
      dealer: { include: { user: true } }
    }
  })

  if (!car) return apiError('Car not found', 404)

  if (action === 'reject' && !rejectionReason) {
    return apiError('Rejection reason is required', 400)
  }

  let updatedCar

  if (action === 'approve') {
    updatedCar = await db.car.update({
      where: { id: carId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user.id,
        rejectedAt: null,
        rejectionReason: null,
      }
    })

    // Update dealer total listings
    await db.dealer.update({
      where: { id: car.dealerId },
      data: { totalListings: { increment: 1 } }
    })

    // Notify dealer
    if (car.dealer?.user) {
      await db.notification.create({
        data: {
          userId: car.dealer.userId,
          title: 'Car Listing Approved',
          message: `Your listing for ${car.brand} ${car.model} ${car.year} has been approved and is now live!`,
          type: 'success',
          link: `/cars/${carId}`,
        }
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'car_approved',
        resource: 'car',
        resourceId: carId,
        details: JSON.stringify({ brand: car.brand, model: car.model, year: car.year }),
        severity: 'info',
      }
    })
  } else {
    updatedCar = await db.car.update({
      where: { id: carId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: sanitizeInput(rejectionReason),
        approvedAt: null,
        approvedBy: null,
      }
    })

    // Notify dealer
    if (car.dealer?.user) {
      await db.notification.create({
        data: {
          userId: car.dealer.userId,
          title: 'Car Listing Rejected',
          message: `Your listing for ${car.brand} ${car.model} ${car.year} has been rejected. Reason: ${rejectionReason}`,
          type: 'error',
          link: `/dealer/cars/${carId}`,
        }
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'car_rejected',
        resource: 'car',
        resourceId: carId,
        details: JSON.stringify({ brand: car.brand, model: car.model, year: car.year, rejectionReason }),
        severity: 'warning',
      }
    })
  }

  return apiResponse({ success: true, data: updatedCar })
}
