import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/payments/[id] - Single payment detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { id } = await params

  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, whatsapp: true } },
      dealer: { select: { id: true, companyName: true, phone: true, whatsapp: true } },
      booking: {
        include: {
          car: { select: { id: true, brand: true, model: true, year: true, photos: true } }
        }
      },
      continueLoanEnquiry: {
        include: {
          car: { select: { id: true, brand: true, model: true, year: true, photos: true } }
        }
      },
      workshopAppointment: true,
      insuranceEnquiry: true,
    }
  })

  if (!payment) return apiError('Payment not found', 404)

  // Authorization: customer can only see own, dealer can see their payments, admin can see all
  if (user.role === 'customer' && payment.userId !== user.id) {
    return apiError('Forbidden', 403)
  }
  if (user.role === 'dealer' && user.dealer && payment.dealerId !== user.dealer.id) {
    return apiError('Forbidden', 403)
  }

  return apiResponse({ success: true, data: payment })
}

// PUT /api/payments/[id] - Update payment (upload receipt or verify/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { id } = await params

  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      booking: { include: { car: true } },
      continueLoanEnquiry: { include: { car: true } },
    }
  })

  if (!payment) return apiError('Payment not found', 404)

  const body = await request.json()

  // Customer: Upload receipt
  if (user.role === 'customer') {
    if (payment.userId !== user.id) return apiError('Forbidden', 403)
    if (payment.status !== 'pending') return apiError('Payment is not in pending status', 400)

    const { receiptUrl } = body
    if (!receiptUrl) return apiError('Receipt URL is required', 400)

    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        receiptUrl: sanitizeInput(receiptUrl),
        receiptUploadedAt: new Date(),
        status: 'uploaded',
      }
    })

    // Create notification for admin
    await db.notification.create({
      data: {
        userId: 'admin',
        title: 'Payment Receipt Uploaded',
        message: `A payment receipt has been uploaded for payment ${id}. Amount: RM${payment.amount}`,
        type: 'payment',
        link: `/admin/payments/${id}`,
      }
    })

    return apiResponse({ success: true, data: updatedPayment })
  }

  // Admin: Verify or reject payment
  if (requireRole(user, ['admin'])) {
    const { status, rejectionReason } = body

    if (!['verified', 'rejected'].includes(status)) {
      return apiError('Status must be verified or rejected', 400)
    }

    if (status === 'rejected' && !rejectionReason) {
      return apiError('Rejection reason is required', 400)
    }

    if (status === 'verified') {
      // CRITICAL PAYMENT VERIFICATION FLOW
      const updateData: any = {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: user.id,
        contactUnlocked: true,
        unlockedAt: new Date(),
      }

      const updatedPayment = await db.payment.update({
        where: { id },
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
            message: `Your payment has been verified! Contact details unlocked.`,
            type: 'success',
            link: `/bookings/${payment.bookingId}`,
          }
        })

        // Notification for dealer
        if (payment.dealerId && payment.booking?.car) {
          const dealer = await db.dealer.findUnique({ where: { id: payment.dealerId } })
          if (dealer) {
            await db.notification.create({
              data: {
                userId: dealer.userId,
                title: 'New Confirmed Booking',
                message: `New confirmed booking for ${payment.booking.car.brand} ${payment.booking.car.model} ${payment.booking.car.year}`,
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
            message: `Your payment has been verified! Contact details unlocked.`,
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
          resourceId: id,
          details: JSON.stringify({ amount: payment.amount, paymentType: payment.paymentType }),
          severity: 'info',
        }
      })

      return apiResponse({ success: true, data: updatedPayment })
    }

    if (status === 'rejected') {
      const updatedPayment = await db.payment.update({
        where: { id },
        data: {
          status: 'rejected',
          verifiedBy: user.id,
          rejectionReason: sanitizeInput(rejectionReason),
        }
      })

      // Notify customer
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: 'Payment Rejected',
          message: `Your payment has been rejected. Reason: ${rejectionReason}`,
          type: 'error',
          link: `/payments/${id}`,
        }
      })

      // Audit log
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'payment_rejected',
          resource: 'payment',
          resourceId: id,
          details: JSON.stringify({ rejectionReason }),
          severity: 'warning',
        }
      })

      return apiResponse({ success: true, data: updatedPayment })
    }
  }

  return apiError('Forbidden', 403)
}
