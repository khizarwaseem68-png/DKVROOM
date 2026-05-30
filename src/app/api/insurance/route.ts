import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/insurance - List insurance partners (dealers with dealerType='insurance')
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const city = searchParams.get('city')
  const state = searchParams.get('state')
  const search = searchParams.get('search')

  const where: any = {
    dealerType: 'insurance',
    active: true,
    verified: true,
  }

  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (state) where.state = { contains: state, mode: 'insensitive' }
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { city: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [partners, total] = await Promise.all([
    db.dealer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, phone: true, whatsapp: true } },
        _count: { select: { insuranceEnquiries: true } },
      },
      orderBy: { rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.dealer.count({ where })
  ])

  return paginatedResponse(partners, total, page, limit)
}

// POST /api/insurance - Create insurance enquiry (customer only)
export async function POST(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['customer'])) {
    return apiError('Only customers can create insurance enquiries', 403)
  }

  const body = await request.json()
  const {
    dealerId,
    vehicleBrand,
    vehicleModel,
    vehicleYear,
    registrationNo,
    coverageType,
    currentInsurer,
    ncdPercentage,
    age,
    drivingExperience,
    claimsHistory,
  } = body

  // dealerId is optional for insurance - customer can submit general enquiry
  if (dealerId) {
    const dealer = await db.dealer.findUnique({ where: { id: dealerId } })
    if (!dealer) return apiError('Insurance partner not found', 404)
    if (dealer.dealerType !== 'insurance') return apiError('Dealer is not an insurance provider', 400)
    if (!dealer.active || !dealer.verified) return apiError('Insurance partner is not available', 400)
  }

  const validCoverageTypes = ['comprehensive', 'third_party', 'third_party_fire_theft']
  if (coverageType && !validCoverageTypes.includes(coverageType)) {
    return apiError(`Invalid coverage type. Must be one of: ${validCoverageTypes.join(', ')}`, 400)
  }

  const enquiry = await db.insuranceEnquiry.create({
    data: {
      customerId: user.id,
      dealerId: dealerId || null,
      vehicleBrand: vehicleBrand ? sanitizeInput(vehicleBrand) : null,
      vehicleModel: vehicleModel ? sanitizeInput(vehicleModel) : null,
      vehicleYear: vehicleYear ? parseInt(String(vehicleYear)) : null,
      registrationNo: registrationNo ? sanitizeInput(registrationNo) : null,
      coverageType: coverageType || null,
      currentInsurer: currentInsurer ? sanitizeInput(currentInsurer) : null,
      ncdPercentage: ncdPercentage ? parseFloat(String(ncdPercentage)) : null,
      age: age ? parseInt(String(age)) : null,
      drivingExperience: drivingExperience ? parseInt(String(drivingExperience)) : null,
      claimsHistory: claimsHistory ? JSON.stringify(claimsHistory) : null,
      status: 'pending',
    }
  })

  // Notify insurance dealer if specified
  if (dealerId) {
    const dealer = await db.dealer.findUnique({ where: { id: dealerId } })
    if (dealer) {
      await db.notification.create({
        data: {
          userId: dealer.userId,
          title: 'New Insurance Enquiry',
          message: `A customer has submitted an insurance enquiry${vehicleBrand ? ` for ${vehicleBrand} ${vehicleModel || ''}` : ''}.`,
          type: 'booking',
          link: `/insurance/enquiries/${enquiry.id}`,
        }
      })
    }
  }

  // Audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'insurance_enquiry_created',
      resource: 'insuranceEnquiry',
      resourceId: enquiry.id,
      details: JSON.stringify({ dealerId, coverageType, vehicleBrand, vehicleModel }),
      severity: 'info',
    }
  })

  return apiResponse({ success: true, data: enquiry }, 201)
}
