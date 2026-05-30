import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/continue-loan - List continue loan enquiries
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const agreementStatus = searchParams.get('agreementStatus')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  const where: any = {}

  // Role-based filtering
  if (user.role === 'admin') {
    // Admin sees all
  } else if (user.role === 'dealer' && user.dealer) {
    where.dealerId = user.dealer.id
  } else {
    where.customerId = user.id
  }

  if (agreementStatus) where.agreementStatus = agreementStatus

  const [enquiries, total] = await Promise.all([
    db.continueLoanEnquiry.findMany({
      where,
      include: {
        car: { select: { id: true, brand: true, model: true, year: true, photos: true, price: true, monthlyInstallment: true, remainingMonths: true, remainingBalance: true, takeoverAmount: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        dealer: { select: { id: true, companyName: true, phone: true, whatsapp: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.continueLoanEnquiry.count({ where })
  ])

  return paginatedResponse(enquiries, total, page, limit)
}

// POST /api/continue-loan - Create a continue loan enquiry (customer only)
export async function POST(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['customer'])) {
    return apiError('Only customers can create continue loan enquiries', 403)
  }

  const body = await request.json()
  const { carId, notes } = body

  if (!carId) return apiError('Car ID is required', 400)

  // Verify car exists and is a continueLoan type
  const car = await db.car.findUnique({
    where: { id: carId },
    include: { dealer: true }
  })

  if (!car) return apiError('Car not found', 404)
  if (car.type !== 'continueLoan') return apiError('Car is not available for continue loan', 400)
  if (!car.dealerId) return apiError('Car has no associated dealer', 400)

  // Create the enquiry and deposit payment in a transaction
  const result = await db.$transaction(async (tx) => {
    const enquiry = await tx.continueLoanEnquiry.create({
      data: {
        carId,
        customerId: user.id,
        dealerId: car.dealerId,
        agreementStatus: 'pending',
        depositAmount: car.deposit || car.bookingFee || 0,
        notes: notes ? sanitizeInput(notes) : null,
      }
    })

    // Create payment record for the deposit
    const depositAmount = car.deposit || car.bookingFee || 0
    const platformFee = Math.round(depositAmount * 0.1 * 100) / 100 // 10% platform fee
    const dealerPayout = depositAmount - platformFee

    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        dealerId: car.dealerId,
        continueLoanEnquiryId: enquiry.id,
        amount: depositAmount,
        platformFee,
        dealerPayout,
        method: 'qr_manual',
        paymentType: 'deposit',
        status: 'pending',
      }
    })

    return { enquiry, payment }
  })

  // Notify dealer
  const dealer = await db.dealer.findUnique({ where: { id: car.dealerId } })
  if (dealer) {
    await db.notification.create({
      data: {
        userId: dealer.userId,
        title: 'New Continue Loan Enquiry',
        message: `A customer has submitted a continue loan enquiry for ${car.brand} ${car.model} ${car.year}`,
        type: 'booking',
        link: `/continue-loan/${result.enquiry.id}`,
      }
    })
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'continue_loan_enquiry_created',
      resource: 'continueLoanEnquiry',
      resourceId: result.enquiry.id,
      details: JSON.stringify({ carId, depositAmount: result.enquiry.depositAmount }),
      severity: 'info',
    }
  })

  return apiResponse({ success: true, data: result }, 201)
}
