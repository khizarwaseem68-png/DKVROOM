import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/loans - List loan applications
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  const where: any = {}

  // Role-based filtering
  if (user.role === 'admin') {
    // Admin sees all
  } else if (user.role === 'dealer' && user.dealer) {
    where.dealerId = user.dealer.id
  } else {
    where.userId = user.id
  }

  if (status) where.status = status
  if (type) where.type = type

  const [loans, total] = await Promise.all([
    db.loanApplication.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        car: { select: { id: true, brand: true, model: true, year: true, photos: true, price: true } },
        dealer: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.loanApplication.count({ where })
  ])

  return paginatedResponse(loans, total, page, limit)
}

// POST /api/loans - Create loan application (customer only)
export async function POST(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['customer'])) {
    return apiError('Only customers can create loan applications', 403)
  }

  const body = await request.json()
  const {
    carId,
    type,
    amount,
    tenure,
    monthlyIncome,
    employmentType,
    employerName,
    bankName,
    documents,
    payslipUrls,
    bankStatementUrls,
    epfStatementUrl,
  } = body

  if (!type) return apiError('Loan type is required', 400)
  if (!['loan', 'continueLoan'].includes(type)) {
    return apiError('Invalid loan type. Must be loan or continueLoan', 400)
  }

  // Validate car exists if provided
  let dealerId: string | null = null
  if (carId) {
    const car = await db.car.findUnique({ where: { id: carId } })
    if (!car) return apiError('Car not found', 404)
    dealerId = car.dealerId
  }

  const loan = await db.loanApplication.create({
    data: {
      userId: user.id,
      carId: carId || null,
      dealerId,
      type,
      amount: amount ? parseFloat(String(amount)) : null,
      tenure: tenure ? parseInt(String(tenure)) : null,
      monthlyIncome: monthlyIncome ? parseFloat(String(monthlyIncome)) : null,
      employmentType: employmentType ? sanitizeInput(employmentType) : null,
      employerName: employerName ? sanitizeInput(employerName) : null,
      bankName: bankName ? sanitizeInput(String(bankName)) : null,
      documents: documents ? String(documents) : null,
      payslipUrls: payslipUrls ? String(payslipUrls) : null,
      bankStatementUrls: bankStatementUrls ? String(bankStatementUrls) : null,
      epfStatementUrl: epfStatementUrl ? sanitizeInput(String(epfStatementUrl)) : null,
      status: 'pending',
    }
  })

  // Notify dealer if applicable
  if (dealerId) {
    const dealer = await db.dealer.findUnique({ where: { id: dealerId } })
    if (dealer) {
      await db.notification.create({
        data: {
          userId: dealer.userId,
          title: 'New Loan Application',
          message: `A customer has submitted a loan application related to your listing.`,
          type: 'info',
          link: `/loans/${loan.id}`,
        }
      })
    }
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'loan_application_created',
      resource: 'loanApplication',
      resourceId: loan.id,
      details: JSON.stringify({ type, amount, carId }),
      severity: 'info',
    }
  })

  return apiResponse({ success: true, data: loan }, 201)
}
