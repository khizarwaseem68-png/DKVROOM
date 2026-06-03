import { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, sanitizeObject, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// ============================================================
// GET /api/bookings — List user's bookings
// ============================================================
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 60, keyPrefix: 'bookings-list' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)

    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)))
    const skip = (page - 1) * limit

    // Filters
    const status = searchParams.get('status') || undefined
    const type = searchParams.get('type') || undefined

    // Build where clause — customer sees own bookings, dealer sees bookings for their cars
    const where: Prisma.BookingWhereInput = {}

    if (user.role === 'dealer' && user.dealer) {
      where.dealerId = user.dealer.id
    } else {
      where.userId = user.id
    }

    if (status) where.status = status
    if (type) where.type = type

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
              avatar: true,
            },
          },
          dealer: {
            select: {
              id: true,
              companyName: true,
              phone: true,
              whatsapp: true,
              logo: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              qrReference: true,
              receiptUrl: true,
              contactUnlocked: true,
              createdAt: true,
            },
          },
        },
      }),
      db.booking.count({ where }),
    ])

    return paginatedResponse(bookings, total, page, limit)
  } catch (error) {
    console.error('[BOOKINGS_LIST_ERROR]', error)
    return apiError('Failed to fetch bookings', 500)
  }
}

// ============================================================
// POST /api/bookings — Create booking (customer only)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 10, keyPrefix: 'bookings-create' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check — customer only
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)
    if (!requireRole(user, ['customer'])) return apiError('Forbidden: customer access required', 403)

    const body = await request.json()
    const sanitized = sanitizeObject(body)

    // Required fields
    if (!sanitized.carId) return apiError('Missing required field: carId', 400)
    if (!sanitized.type) return apiError('Missing required field: type', 400)

    // Validate booking type
    const validTypes = ['rent', 'purchase', 'continueLoan', 'auction', 'insurance', 'workshop']
    if (!validTypes.includes(sanitized.type)) {
      return apiError(`Invalid booking type. Must be one of: ${validTypes.join(', ')}`, 400)
    }

    // Verify the car exists and is available
    const car = await db.car.findUnique({
      where: { id: sanitized.carId },
      include: { dealer: true },
    })

    if (!car || !car.active) return apiError('Car not found', 404)
    if (car.status !== 'approved' && car.status !== 'available') {
      return apiError('Car is not available for booking', 400)
    }

    // Reuse unfinished bookings so repeated clicks continue payment instead of creating conflicts.
    const reusableBookingWhere: Prisma.BookingWhereInput = {
      carId: sanitized.carId,
      userId: user.id,
      status: { in: ['pending', 'payment_pending', 'payment_uploaded'] },
    }

    const existingPendingBooking = await db.booking.findFirst({
      where: reusableBookingWhere,
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
        dealer: {
          select: {
            id: true,
            companyName: true,
            phone: true,
            whatsapp: true,
            logo: true,
          },
        },
        payments: true,
      },
    })

    if (existingPendingBooking) {
      return apiResponse({
        success: true,
        message: 'Existing pending booking found. Continue payment to complete it.',
        data: existingPendingBooking,
        existing: true,
      })
    }

    const existingActiveBooking = await db.booking.findFirst({
      where: {
        carId: sanitized.carId,
        userId: user.id,
        status: { in: ['confirmed', 'active'] },
      },
    })

    if (existingActiveBooking) {
      return apiError('You already have an active booking for this car', 409)
    }

    // Calculate total amount based on type
    let totalAmount: number | null = null
    if (sanitized.type === 'rent') {
      totalAmount = car.bookingFee || 200
    } else if (sanitized.type === 'purchase') {
      totalAmount = car.bookingFee || car.deposit || car.price
    } else if (sanitized.type === 'continueLoan') {
      totalAmount = car.deposit || car.bookingFee || 0
    } else if (sanitized.type === 'auction') {
      totalAmount = sanitized.totalAmount
        ? parseFloat(sanitized.totalAmount)
        : Math.round((car.currentBid || car.auctionStartBid || car.price || 0) * 0.1)
    } else {
      totalAmount = sanitized.totalAmount ? parseFloat(sanitized.totalAmount) : car.bookingFee || 0
    }

    // Platform fee calculation (e.g., 5%)
    const platformFee = totalAmount ? Math.round(totalAmount * 0.05 * 100) / 100 : 0

    // Create booking + payment in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          carId: sanitized.carId,
          userId: user.id,
          dealerId: car.dealer.id,
          type: sanitized.type,
          startDate: sanitized.startDate ? new Date(sanitized.startDate) : undefined,
          endDate: sanitized.endDate ? new Date(sanitized.endDate) : undefined,
          status: 'payment_pending',
          totalAmount,
          platformFee,
          contactUnlocked: false,
          notes: sanitized.notes ? sanitizeInput(sanitized.notes) : undefined,
        },
      })

      // Generate QR reference
      const qrReference = 'QR' + Date.now().toString(36).toUpperCase()

      // Determine payment type based on booking type
      const paymentType = sanitized.type === 'auction' ? 'auction_deposit' : 'booking'

      // Create associated payment record
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          dealerId: car.dealer.id,
          bookingId: booking.id,
          amount: totalAmount || 0,
          platformFee,
          dealerPayout: totalAmount ? Math.round((totalAmount - platformFee) * 100) / 100 : 0,
          method: 'qr_manual',
          paymentType,
          qrReference,
          qrGeneratedAt: new Date(),
          status: 'pending',
          contactUnlocked: false,
        },
      })

      // Increment car enquiries count
      await tx.car.update({
        where: { id: sanitized.carId },
        data: { enquiries: { increment: 1 } },
      })

      return { booking, payment }
    })

    // Fetch the complete booking with relations
    const booking = await db.booking.findUnique({
      where: { id: result.booking.id },
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
        dealer: {
          select: {
            id: true,
            companyName: true,
            phone: true,
            whatsapp: true,
            logo: true,
          },
        },
        payments: true,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'booking_created',
        resource: 'booking',
        resourceId: result.booking.id,
        details: JSON.stringify({
          carId: sanitized.carId,
          type: sanitized.type,
          totalAmount,
          paymentId: result.payment.id,
          qrReference: result.payment.qrReference,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      },
    })

    // Create notification for dealer
    await db.notification.create({
      data: {
        userId: car.dealer.userId,
        title: 'New Booking Received',
        message: `New ${sanitized.type} booking for ${car.brand} ${car.model} (${car.year})`,
        type: 'booking',
        link: `/dealer/bookings/${result.booking.id}`,
      },
    }).catch(() => {})

    return apiResponse({ success: true, data: booking }, 201)
  } catch (error) {
    console.error('[BOOKING_CREATE_ERROR]', error)
    return apiError('Failed to create booking', 500)
  }
}
