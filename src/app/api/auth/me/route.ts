import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { apiResponse, apiError, rateLimit } from '@/lib/security/middleware'

export async function GET(request: NextRequest) {
  try {
    const rateCheck = rateLimit(request)
    if (!rateCheck.allowed) {
      return apiError('Too many requests', 429)
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      return apiError('Unauthorized', 401)
    }

    const { password: _, ...userWithoutPassword } = user

    return apiResponse({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return apiError('Failed to get user data', 500)
  }
}
