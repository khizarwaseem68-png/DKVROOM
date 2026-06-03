import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'
import { sendPaymentVerifiedEmail } from '@/lib/email/email-service'

// GET /api/admin/payments - List all payments with filters (admin only)
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
  const paymentType = searchParams.get('paymentType')
  const method = searchParams.get('method')
  const userId = searchParams.get('userId')
  const dealerId = searchParams.get('dealerId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: any = {}

  if (status) where.status = status
  if (paymentType) where.paymentType = paymentType
  if (method) where.method = method
  if (userId) where.userId = userId
  if (dealerId) where.dealerId = dealerId
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        dealer: { select: { id: true, companyName: true } },
        booking: {
          select: {
            id: true, type: true, status: true,
            car: { select: { id: true, brand: true, model: true, year: true } }
          }
        },
        continueLoanEnquiry: {
          select: {
            id: true, agreementStatus: true,
            car: { select: { id: true, brand: true, model: true, year: true } }
          }
        },
        workshopAppointment: {
          select: { id: true, serviceType: true, status: true }
        },
        insuranceEnquiry: {
          select: { id: true, coverageType: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.payment.count({ where })
  ])

  return paginatedResponse(payments, total, page, limit)
}

// PUT /api/admin/payments - Verify/reject payment (admin only)
export async function PUT(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['admin'])) {
    return apiError('Admin access required', 403)
  }

  const body = await request.json()
  const { paymentId, action, rejectionReason } = body

  if (!paymentId) return apiError('Payment ID is required', 400)
  if (!action || !['verify', 'reject'].includes(action)) {
    return apiError('Action must be verify or reject', 400)
  }

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: { include: { car: true } },
      continueLoanEnquiry: { include: { car: true } },
    }
  })

  if (!payment) return apiError('Payment not found', 404)

  if (action === 'reject' && !rejectionReason) {
    return apiError('Rejection reason is required', 400)
  }

  if (action === 'verify') {
    if (payment.status !== 'uploaded') {
      return apiError('Receipt must be uploaded before payment can be verified', 400)
    }

    // CRITICAL PAYMENT VERIFICATION FLOW
    const updateData: any = {
      status: 'verified',
      verifiedAt: new Date(),
      verifiedBy: user.id,
      contactUnlocked: true,
      unlockedAt: new Date(),
    }

    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: updateData,
    })

    // If payment has bookingId, update booking
    if (payment.bookingId) {
      await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          contactUnlocked: true,
          status: 'confirmed',
        }
      })

      // Notification for customer
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Verified!',
          message: 'Your payment has been verified! Contact details unlocked.',
          type: 'success',
          link: `/bookings/${payment.bookingId}`,
        }
      })

      const customer = await db.user.findUnique({
        where: { id: payment.userId },
        select: { email: true, name: true },
      })

      if (customer?.email) {
        const car = payment.booking?.car
        await sendPaymentVerifiedEmail({
          email: customer.email,
          name: customer.name || 'Customer',
          amount: payment.amount,
          vehicleName: car ? `${car.brand} ${car.model} ${car.year}` : undefined,
          bookingType: payment.booking?.type,
        }).catch((error) => {
          console.error('Payment verified email failed:', error)
        })
      }

      // Notification for dealer
      if (payment.dealerId && payment.booking?.car) {
        const dealer = await db.dealer.findUnique({ where: { id: payment.dealerId } })
        if (dealer) {
          const car = payment.booking.car
          await db.notification.create({
            data: {
              userId: dealer.userId,
              title: 'New Confirmed Booking',
              message: `New confirmed booking for ${car.brand} ${car.model} ${car.year}`,
              type: 'booking',
              link: `/bookings/${payment.bookingId}`,
            }
          })
        }
      }
    }

    // If payment has continueLoanEnquiryId, update enquiry
    if (payment.continueLoanEnquiryId) {
      await db.continueLoanEnquiry.update({
        where: { id: payment.continueLoanEnquiryId },
        data: {
          contactUnlocked: true,
          unlockedAt: new Date(),
        }
      })

      // Notification for customer
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Verified!',
          message: 'Your payment has been verified! Contact details unlocked.',
          type: 'success',
          link: `/continue-loan/${payment.continueLoanEnquiryId}`,
        }
      })

      // Notification for dealer
      if (payment.dealerId && payment.continueLoanEnquiry?.car) {
        const dealer = await db.dealer.findUnique({ where: { id: payment.dealerId } })
        if (dealer) {
          const car = payment.continueLoanEnquiry.car
          await db.notification.create({
            data: {
              userId: dealer.userId,
              title: 'New Confirmed Enquiry',
              message: `New confirmed continue loan enquiry for ${car.brand} ${car.model} ${car.year}`,
              type: 'booking',
              link: `/continue-loan/${payment.continueLoanEnquiryId}`,
            }
          })
        }
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'payment_verified',
        resource: 'payment',
        resourceId: paymentId,
        details: JSON.stringify({ amount: payment.amount, paymentType: payment.paymentType }),
        severity: 'info',
      }
    })

    return apiResponse({ success: true, data: updatedPayment })
  }

  if (action === 'reject') {
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'rejected',
        verifiedBy: user.id,
        rejectionReason: sanitizeInput(rejectionReason),
      }
    })

    if (payment.bookingId) {
      await db.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'payment_pending',
          contactUnlocked: false,
        },
      })
    }

    // Notify customer
    await db.notification.create({
      data: {
        userId: payment.userId,
        title: 'Payment Rejected',
        message: `Your payment has been rejected. Reason: ${rejectionReason}`,
        type: 'error',
        link: `/payments/${paymentId}`,
      }
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'payment_rejected',
        resource: 'payment',
        resourceId: paymentId,
        details: JSON.stringify({ rejectionReason }),
        severity: 'warning',
      }
    })

    return apiResponse({ success: true, data: updatedPayment })
  }

  return apiError('Invalid action', 400)
}
