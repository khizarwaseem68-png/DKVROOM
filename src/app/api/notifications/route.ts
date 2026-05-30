import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { rateLimit, apiResponse, apiError, paginatedResponse } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/notifications - List user's notifications
export async function GET(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'
  const type = searchParams.get('type')

  const where: any = {
    userId: user.id,
  }

  if (unreadOnly) where.read = false
  if (type) where.type = type

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.notification.count({ where }),
    db.notification.count({ where: { userId: user.id, read: false } }),
  ])

  return apiResponse({
    success: true,
    data: notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    unreadCount,
  })
}

// PUT /api/notifications - Mark as read
export async function PUT(request: NextRequest) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const body = await request.json()
  const { notificationIds, markAllRead } = body

  if (markAllRead) {
    // Mark all notifications as read
    await db.notification.updateMany({
      where: {
        userId: user.id,
        read: false,
      },
      data: { read: true }
    })

    return apiResponse({ success: true, message: 'All notifications marked as read' })
  }

  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    return apiError('Notification IDs array is required, or set markAllRead to true', 400)
  }

  // Mark specific notifications as read
  const result = await db.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId: user.id, // Ensure user can only update their own notifications
    },
    data: { read: true }
  })

  return apiResponse({
    success: true,
    data: { updated: result.count }
  })
}
