import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/workshops - List workshops (dealers with dealerType='workshop')
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
    dealerType: 'workshop',
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

  const [workshops, total] = await Promise.all([
    db.dealer.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        logo: true,
        city: true,
        state: true,
        phone: true,
        whatsapp: true,
        rating: true,
        verified: true,
        operatingHours: true,
        description: true,
      },
      orderBy: { rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.dealer.count({ where })
  ])

  return paginatedResponse(workshops, total, page, limit)
}

// POST /api/workshops - Create workshop appointment (customer only)
export async function POST(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['customer'])) {
    return apiError('Only customers can create workshop appointments', 403)
  }

  const body = await request.json()
  const {
    dealerId,
    serviceType,
    vehicleBrand,
    vehicleModel,
    vehicleYear,
    registrationNo,
    issueDescription,
    photos,
    preferredDate,
    preferredTime,
  } = body

  if (!dealerId) return apiError('Workshop (dealer) ID is required', 400)
  if (!serviceType) return apiError('Service type is required', 400)

  const validServiceTypes = ['general_service', 'engine_repair', 'bodywork', 'electrical', 'tire_battery', 'ac_service', 'others']
  if (!validServiceTypes.includes(serviceType)) {
    return apiError(`Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`, 400)
  }

  // Verify dealer exists and is a workshop
  const dealer = await db.dealer.findUnique({ where: { id: dealerId } })
  if (!dealer) return apiError('Workshop not found', 404)
  if (dealer.dealerType !== 'workshop') return apiError('Dealer is not a workshop', 400)
  if (!dealer.active || !dealer.verified) return apiError('Workshop is not available', 400)

  const appointment = await db.workshopAppointment.create({
    data: {
      customerId: user.id,
      dealerId,
      serviceType,
      vehicleBrand: vehicleBrand ? sanitizeInput(vehicleBrand) : null,
      vehicleModel: vehicleModel ? sanitizeInput(vehicleModel) : null,
      vehicleYear: vehicleYear ? parseInt(String(vehicleYear)) : null,
      registrationNo: registrationNo ? sanitizeInput(registrationNo) : null,
      issueDescription: issueDescription ? sanitizeInput(issueDescription) : null,
      photos: photos ? JSON.stringify(photos) : null,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      preferredTime: preferredTime ? sanitizeInput(preferredTime) : null,
      status: 'pending',
    }
  })

  // Notify workshop dealer
  await db.notification.create({
    data: {
      userId: dealer.userId,
      title: 'New Workshop Appointment',
      message: `A customer has booked a ${serviceType.replace(/_/g, ' ')} appointment${preferredDate ? ` for ${new Date(preferredDate).toLocaleDateString()}` : ''}.`,
      type: 'booking',
      link: `/workshops/appointments/${appointment.id}`,
    }
  })

  // Audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'workshop_appointment_created',
      resource: 'workshopAppointment',
      resourceId: appointment.id,
      details: JSON.stringify({ dealerId, serviceType, preferredDate }),
      severity: 'info',
    }
  })

  return apiResponse({ success: true, data: appointment }, 201)
}
