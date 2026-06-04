import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'
import { sendDealerVerificationEmail } from '@/lib/email/email-service'

// GET /api/admin/dealers - List all dealers with filters (admin only)
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
  const verified = searchParams.get('verified')
  const status = searchParams.get('status')
  const dealerType = searchParams.get('dealerType')
  const city = searchParams.get('city')
  const state = searchParams.get('state')
  const search = searchParams.get('search')
  const subscriptionTier = searchParams.get('subscriptionTier')

  const where: any = {}

  if (status === 'verified') {
    where.verified = true
  } else if (status === 'pending') {
    where.verified = false
    where.rejectedAt = null
  } else if (status === 'rejected') {
    where.rejectedAt = { not: null }
  } else if (verified !== null && verified !== undefined) {
    where.verified = verified === 'true'
  }
  if (dealerType) where.dealerType = dealerType
  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (state) where.state = { contains: state, mode: 'insensitive' }
  if (subscriptionTier) where.subscriptionTier = subscriptionTier
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: 'insensitive' } },
      { contactPerson: { contains: search, mode: 'insensitive' } },
      { registrationNo: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [dealers, total] = await Promise.all([
    db.dealer.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, active: true, createdAt: true } },
        _count: { select: { cars: true, bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.dealer.count({ where })
  ])

  return paginatedResponse(dealers, total, page, limit)
}

// PUT /api/admin/dealers - Verify/reject dealer (admin only)
export async function PUT(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  if (!requireRole(user, ['admin'])) {
    return apiError('Admin access required', 403)
  }

  const body = await request.json()
  const { dealerId, action, rejectionReason } = body

  if (!dealerId) return apiError('Dealer ID is required', 400)
  if (!action || !['verify', 'reject'].includes(action)) {
    return apiError('Action must be verify or reject', 400)
  }

  const dealer = await db.dealer.findUnique({
    where: { id: dealerId },
    include: { user: true }
  })

  if (!dealer) return apiError('Dealer not found', 404)

  if (action === 'reject' && !rejectionReason) {
    return apiError('Rejection reason is required', 400)
  }

  let updatedDealer

  if (action === 'verify') {
    updatedDealer = await db.dealer.update({
      where: { id: dealerId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: user.id,
        rejectedAt: null,
        rejectionReason: null,
      }
    })

    // Also verify the user
    await db.user.update({
      where: { id: dealer.userId },
      data: { verified: true }
    })

    // Notify dealer
    await db.notification.create({
      data: {
        userId: dealer.userId,
        title: 'Dealer Account Verified!',
        message: `Your dealer account "${dealer.companyName}" has been verified. You can now list cars and receive bookings.`,
        type: 'success',
        link: '/dealer-dashboard',
      }
    })

    try {
      await sendDealerVerificationEmail({
        email: dealer.user.email,
        name: dealer.user.name,
        companyName: dealer.companyName,
        status: 'verified',
      })
    } catch (emailError) {
      console.error('Dealer approval email failed:', emailError)
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'dealer_verified',
        resource: 'dealer',
        resourceId: dealerId,
        details: JSON.stringify({ companyName: dealer.companyName }),
        severity: 'info',
      }
    })
  } else {
    updatedDealer = await db.dealer.update({
      where: { id: dealerId },
      data: {
        verified: false,
        rejectedAt: new Date(),
        rejectionReason: sanitizeInput(rejectionReason),
      }
    })

    // Notify dealer
    await db.notification.create({
      data: {
        userId: dealer.userId,
        title: 'Dealer Account Rejected',
        message: `Your dealer account "${dealer.companyName}" has been rejected. Reason: ${rejectionReason}`,
        type: 'error',
        link: '/dealer-status',
      }
    })

    try {
      await sendDealerVerificationEmail({
        email: dealer.user.email,
        name: dealer.user.name,
        companyName: dealer.companyName,
        status: 'rejected',
        reason: rejectionReason,
      })
    } catch (emailError) {
      console.error('Dealer rejection email failed:', emailError)
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'dealer_rejected',
        resource: 'dealer',
        resourceId: dealerId,
        details: JSON.stringify({ companyName: dealer.companyName, rejectionReason }),
        severity: 'warning',
      }
    })
  }

  return apiResponse({ success: true, data: updatedDealer })
}
