import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// ============================================================
// GET /api/bookings/[id] — Single booking detail
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 120, keyPrefix: 'bookings-detail' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)

    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
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
            state: true,
            color: true,
            mileage: true,
            fuelType: true,
            transmission: true,
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
        dealer: {
          select: {
            id: true,
            companyName: true,
            phone: true,
            whatsapp: true,
            logo: true,
            address: true,
            city: true,
            state: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!booking) return apiError('Booking not found', 404)

    // Access control: only the booking user, the dealer, or admin can view
    const isBookingUser = booking.userId === user.id
    const isBookingDealer = booking.dealerId === user.dealer?.id
    const isAdmin = user.role === 'admin'

    if (!isBookingUser && !isBookingDealer && !isAdmin) {
      return apiError('Forbidden: you do not have access to this booking', 403)
    }

    // If contact is unlocked, include more details about the other party
    const responseData: any = { ...booking }

    if (booking.contactUnlocked) {
      if (user.role === 'customer') {
        // Show dealer contact details
        responseData.dealerContact = {
          phone: booking.dealer.phone,
          whatsapp: booking.dealer.whatsapp,
          address: booking.dealer.address,
        }
      } else if (user.role === 'dealer') {
        // Show customer contact details
        responseData.customerContact = {
          phone: booking.user.phone,
          whatsapp: booking.user.whatsapp,
        }
      }
    }

    return apiResponse({ success: true, data: responseData })
  } catch (error) {
    console.error('[BOOKING_DETAIL_ERROR]', error)
    return apiError('Failed to fetch booking', 500)
  }
}

// ============================================================
// PUT /api/bookings/[id] — Update booking status (confirm/cancel)
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 20, keyPrefix: 'bookings-update' })
    if (!rateCheck.allowed) {
      return apiError('Too many requests, please try again later', 429)
    }

    // Auth check
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)

    const { id } = await params

    // Find booking
    const existingBooking = await db.booking.findUnique({
      where: { id },
      include: {
        car: { select: { id: true, brand: true, model: true, year: true } },
        dealer: true,
        user: { select: { id: true, name: true } },
      },
    })

    if (!existingBooking) return apiError('Booking not found', 404)

    const body = await request.json()
    const { status, cancellationReason, notes } = body

    if (!status) return apiError('Missing required field: status', 400)

    // Valid status transitions
    const validStatuses = [
      'pending', 'payment_pending', 'payment_uploaded',
      'confirmed', 'active', 'completed', 'cancelled', 'disputed',
    ]

    if (!validStatuses.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
    }

    // Access control and status transition rules
    const isCustomer = existingBooking.userId === user.id
    const isDealer = existingBooking.dealerId === user.dealer?.id
    const isAdmin = user.role === 'admin'

    if (!isCustomer && !isDealer && !isAdmin) {
      return apiError('Forbidden: you do not have access to this booking', 403)
    }

    // Define allowed transitions based on role
    const currentStatus = existingBooking.status

    // Customer can: cancel (from pending/payment_pending/confirmed)
    if (isCustomer && !isAdmin) {
      const customerAllowed = ['cancelled']
      if (!customerAllowed.includes(status)) {
        return apiError('Customers can only cancel bookings', 403)
      }
      if (!['pending', 'payment_pending', 'confirmed'].includes(currentStatus)) {
        return apiError('Booking cannot be cancelled at this stage', 400)
      }
    }

    // Dealer can: confirm, cancel, mark active, mark completed
    if (isDealer && !isAdmin) {
      const dealerAllowed = ['confirmed', 'active', 'completed', 'cancelled']
      if (!dealerAllowed.includes(status)) {
        return apiError('Invalid status transition for dealer', 403)
      }

      // Validate transitions
      if (status === 'confirmed' && !['payment_uploaded', 'pending'].includes(currentStatus)) {
        return apiError('Booking must have payment uploaded before confirming', 400)
      }
      if (status === 'active' && currentStatus !== 'confirmed') {
        return apiError('Booking must be confirmed before activating', 400)
      }
      if (status === 'completed' && currentStatus !== 'active') {
        return apiError('Booking must be active before completing', 400)
      }
      if (status === 'cancelled' && ['completed', 'cancelled'].includes(currentStatus)) {
        return apiError('Booking cannot be cancelled at this stage', 400)
      }
    }

    // Build update data
    const updateData: any = { status }

    if (status === 'cancelled') {
      updateData.cancellationReason = cancellationReason
        ? sanitizeInput(cancellationReason)
        : undefined
    }

    if (status === 'confirmed') {
      updateData.contactUnlocked = true
      updateData.unlockedAt = new Date()
    }

    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    if (notes) {
      updateData.notes = sanitizeInput(notes)
    }

    // Use transaction for status updates that affect other records
    const result = await db.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          car: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              type: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          dealer: {
            select: {
              id: true,
              companyName: true,
              phone: true,
              whatsapp: true,
            },
          },
          payments: true,
        },
      })

      // If booking is confirmed, unlock contact on associated payments
      if (status === 'confirmed') {
        await tx.payment.updateMany({
          where: { bookingId: id },
          data: {
            contactUnlocked: true,
            unlockedAt: new Date(),
          },
        })
      }

      // If booking is cancelled, update payment statuses
      if (status === 'cancelled') {
        await tx.payment.updateMany({
          where: {
            bookingId: id,
            status: { in: ['pending', 'uploaded'] },
          },
          data: { status: 'failed' },
        })
      }

      // If booking is completed, update dealer total sales
      if (status === 'completed' && user.dealer) {
        await tx.dealer.update({
          where: { id: user.dealer.id },
          data: { totalSales: { increment: 1 } },
        })
      }

      return updatedBooking
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: `booking_${status}`,
        resource: 'booking',
        resourceId: id,
        details: JSON.stringify({
          previousStatus: currentStatus,
          newStatus: status,
          carId: existingBooking.carId,
          cancellationReason: cancellationReason || undefined,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: status === 'cancelled' || status === 'disputed' ? 'warning' : 'info',
      },
    })

    // Create notifications
    const notificationData: any[] = []

    if (status === 'confirmed') {
      // Notify customer
      notificationData.push({
        userId: existingBooking.userId,
        title: 'Booking Confirmed',
        message: `Your booking for ${existingBooking.car.brand} ${existingBooking.car.model} has been confirmed. Contact details unlocked!`,
        type: 'booking',
      })
    } else if (status === 'cancelled') {
      // Notify the other party
      const notifyUserId = isCustomer
        ? existingBooking.dealer.userId
        : existingBooking.userId
      notificationData.push({
        userId: notifyUserId,
        title: 'Booking Cancelled',
        message: `Booking for ${existingBooking.car.brand} ${existingBooking.car.model} has been cancelled.`,
        type: 'booking',
      })
    } else if (status === 'completed') {
      notificationData.push({
        userId: existingBooking.userId,
        title: 'Booking Completed',
        message: `Your booking for ${existingBooking.car.brand} ${existingBooking.car.model} has been completed. Please leave a review!`,
        type: 'booking',
      })
    }

    if (notificationData.length > 0) {
      await db.notification.createMany({ data: notificationData }).catch(() => {})
    }

    return apiResponse({ success: true, data: result })
  } catch (error) {
    console.error('[BOOKING_UPDATE_ERROR]', error)
    return apiError('Failed to update booking', 500)
  }
}
