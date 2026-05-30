import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { rateLimit, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/payments - List user's payments with filters
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const paymentType = searchParams.get('paymentType')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  const where: any = {}

  // Role-based filtering
  if (user.role === 'admin') {
    // Admin sees all payments
  } else if (user.role === 'dealer' && user.dealer) {
    // Dealer sees payments for their bookings
    where.dealerId = user.dealer.id
  } else {
    // Customer sees own payments
    where.userId = user.id
  }

  if (status) where.status = status
  if (paymentType) where.paymentType = paymentType

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
