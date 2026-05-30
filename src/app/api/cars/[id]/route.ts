import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, sanitizeObject, apiResponse, apiError } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// ============================================================
// GET /api/cars/[id] — Single car detail
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 120, keyPrefix: 'cars-detail' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    const { id } = await params

    const car = await db.car.findUnique({
      where: { id },
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            verified: true,
            city: true,
            state: true,
            logo: true,
            rating: true,
            subscriptionTier: true,
            phone: true,
            whatsapp: true,
            address: true,
            operatingHours: true,
          },
        },
        reviews: {
          where: { status: 'published' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    })

    if (!car || !car.active) {
      return apiError('Car not found', 404)
    }

    // Increment view count (fire-and-forget)
    db.car.update({
      where: { id },
      data: { views: { increment: 1 } },
    }).catch(() => {})

    return apiResponse({ success: true, data: car })
  } catch (error) {
    console.error('[CAR_DETAIL_ERROR]', error)
    return apiError('Failed to fetch car', 500)
  }
}

// ============================================================
// PUT /api/cars/[id] — Update car (owner only)
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 20, keyPrefix: 'cars-update' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)

    const { id } = await params

    // Find the car
    const existingCar = await db.car.findUnique({
      where: { id },
      include: { dealer: true },
    })

    if (!existingCar) return apiError('Car not found', 404)
    if (!existingCar.active) return apiError('Car listing is inactive', 400)

    // Ownership check: only the dealer who owns the car can update
    if (existingCar.dealerId !== user.dealer?.id && user.role !== 'admin') {
      return apiError('Forbidden: you do not own this car listing', 403)
    }

    const body = await request.json()
    const sanitized = sanitizeObject(body)

    // Build update data — only allow updatable fields
    const updateData: any = {}

    // Basic info
    if (sanitized.brand) updateData.brand = sanitizeInput(sanitized.brand)
    if (sanitized.model) updateData.model = sanitizeInput(sanitized.model)
    if (sanitized.year) {
      const carYear = parseInt(sanitized.year, 10)
      if (isNaN(carYear) || carYear < 1900 || carYear > new Date().getFullYear() + 1) {
        return apiError('Invalid year', 400)
      }
      updateData.year = carYear
    }
    if (sanitized.color) updateData.color = sanitizeInput(sanitized.color)
    if (sanitized.mileage !== undefined) updateData.mileage = parseInt(sanitized.mileage, 10) || null
    if (sanitized.fuelType) updateData.fuelType = sanitized.fuelType
    if (sanitized.transmission) updateData.transmission = sanitized.transmission
    if (sanitized.seats !== undefined) updateData.seats = parseInt(sanitized.seats, 10) || null
    if (sanitized.condition) updateData.condition = sanitized.condition

    // Pricing
    if (sanitized.price !== undefined) {
      const price = parseFloat(sanitized.price)
      if (isNaN(price) || price <= 0) return apiError('Price must be a positive number', 400)
      updateData.price = price
    }
    if (sanitized.weeklyPrice !== undefined) updateData.weeklyPrice = parseFloat(sanitized.weeklyPrice) || null
    if (sanitized.monthlyPrice !== undefined) updateData.monthlyPrice = parseFloat(sanitized.monthlyPrice) || null
    if (sanitized.deposit !== undefined) updateData.deposit = parseFloat(sanitized.deposit) || null
    if (sanitized.bookingFee !== undefined) updateData.bookingFee = parseFloat(sanitized.bookingFee) || null

    // Continue Loan
    if (sanitized.monthlyInstallment !== undefined) updateData.monthlyInstallment = parseFloat(sanitized.monthlyInstallment) || null
    if (sanitized.remainingMonths !== undefined) updateData.remainingMonths = parseInt(sanitized.remainingMonths, 10) || null
    if (sanitized.remainingBalance !== undefined) updateData.remainingBalance = parseFloat(sanitized.remainingBalance) || null
    if (sanitized.takeoverAmount !== undefined) updateData.takeoverAmount = parseFloat(sanitized.takeoverAmount) || null
    if (sanitized.bankName !== undefined) updateData.bankName = sanitizeInput(sanitized.bankName) || null
    if (sanitized.vehicleCondition !== undefined) updateData.vehicleCondition = sanitizeInput(sanitized.vehicleCondition) || null
    if (sanitized.requiredDocs !== undefined) updateData.requiredDocs = sanitized.requiredDocs || null

    // Auction
    if (sanitized.auctionStartBid !== undefined) updateData.auctionStartBid = parseFloat(sanitized.auctionStartBid) || null
    if (sanitized.auctionReserve !== undefined) updateData.auctionReserve = parseFloat(sanitized.auctionReserve) || null
    if (sanitized.auctionEnd !== undefined) updateData.auctionEnd = sanitized.auctionEnd ? new Date(sanitized.auctionEnd) : null
    if (sanitized.auctionActive !== undefined) updateData.auctionActive = sanitized.auctionActive

    // Rental
    if (sanitized.rentalTerms !== undefined) updateData.rentalTerms = sanitized.rentalTerms || null
    if (sanitized.pickupAvailable !== undefined) updateData.pickupAvailable = sanitized.pickupAvailable
    if (sanitized.deliveryAvailable !== undefined) updateData.deliveryAvailable = sanitized.deliveryAvailable
    if (sanitized.deliveryFee !== undefined) updateData.deliveryFee = parseFloat(sanitized.deliveryFee) || null
    if (sanitized.availableFrom !== undefined) updateData.availableFrom = sanitized.availableFrom ? new Date(sanitized.availableFrom) : null
    if (sanitized.availableTo !== undefined) updateData.availableTo = sanitized.availableTo ? new Date(sanitized.availableTo) : null

    // Location
    if (sanitized.location !== undefined) updateData.location = sanitizeInput(sanitized.location) || null
    if (sanitized.city !== undefined) updateData.city = sanitizeInput(sanitized.city) || null
    if (sanitized.state !== undefined) updateData.state = sanitizeInput(sanitized.state) || null

    // Media
    if (sanitized.description !== undefined) updateData.description = sanitizeInput(sanitized.description) || null
    if (sanitized.features !== undefined) updateData.features = sanitized.features || null
    if (sanitized.photos !== undefined) updateData.photos = sanitized.photos || null
    if (sanitized.videoUrl !== undefined) updateData.videoUrl = sanitizeInput(sanitized.videoUrl) || null

    // Admin can update status and featured flag
    if (user.role === 'admin') {
      if (sanitized.status) updateData.status = sanitized.status
      if (sanitized.featured !== undefined) updateData.featured = sanitized.featured
    } else {
      // If dealer updates a car, reset status to pending for re-approval
      if (Object.keys(updateData).length > 0) {
        updateData.status = 'pending'
        updateData.approvedAt = null
        updateData.approvedBy = null
      }
    }

    if (Object.keys(updateData).length === 0) {
      return apiError('No valid fields to update', 400)
    }

    const updatedCar = await db.car.update({
      where: { id },
      data: updateData,
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            verified: true,
            city: true,
            state: true,
            logo: true,
            rating: true,
            subscriptionTier: true,
          },
        },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'car_updated',
        resource: 'car',
        resourceId: id,
        details: JSON.stringify({ updatedFields: Object.keys(updateData) }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      },
    })

    return apiResponse({ success: true, data: updatedCar })
  } catch (error) {
    console.error('[CAR_UPDATE_ERROR]', error)
    return apiError('Failed to update car', 500)
  }
}

// ============================================================
// DELETE /api/cars/[id] — Delete car (owner/admin only)
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 10, keyPrefix: 'cars-delete' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)

    const { id } = await params

    // Find the car
    const existingCar = await db.car.findUnique({
      where: { id },
      include: { dealer: true },
    })

    if (!existingCar) return apiError('Car not found', 404)

    // Ownership check: dealer owner or admin
    const isOwner = existingCar.dealerId === user.dealer?.id
    const isAdmin = user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return apiError('Forbidden: you do not have permission to delete this car', 403)
    }

    // Soft delete — mark as inactive instead of actual deletion
    const updatedCar = await db.car.update({
      where: { id },
      data: {
        active: false,
        status: 'inactive',
      },
    })

    // Update dealer's total listings count
    if (user.dealer) {
      await db.dealer.update({
        where: { id: user.dealer.id },
        data: { totalListings: { decrement: 1 } },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'car_deleted',
        resource: 'car',
        resourceId: id,
        details: JSON.stringify({
          brand: existingCar.brand,
          model: existingCar.model,
          softDelete: true,
          deletedBy: isAdmin ? 'admin' : 'owner',
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: isAdmin ? 'warning' : 'info',
      },
    })

    return apiResponse({ success: true, message: 'Car listing deleted successfully' })
  } catch (error) {
    console.error('[CAR_DELETE_ERROR]', error)
    return apiError('Failed to delete car', 500)
  }
}
