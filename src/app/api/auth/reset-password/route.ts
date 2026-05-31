import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth/auth-utils'
import { verifyOtpVerificationToken } from '@/lib/auth/otp-service'
import { authRateLimit, sanitizeInput, isValidEmail, apiResponse, apiError } from '@/lib/security/middleware'

const passwordPattern = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/

export async function POST(request: NextRequest) {
  try {
    const rateCheck = authRateLimit(request)
    if (!rateCheck.allowed) return apiError('Too many reset attempts. Please try again later.', 429)

    const body = await request.json()
    const email = sanitizeInput(String(body.email || '')).toLowerCase()
    const password = String(body.password || '')
    const verificationToken = String(body.verificationToken || '')

    if (!email || !isValidEmail(email)) return apiError('Valid email is required', 400)
    if (!passwordPattern.test(password)) {
      return apiError('Password must contain at least one uppercase letter, one lowercase letter, and one number', 400)
    }

    const verified = await verifyOtpVerificationToken(verificationToken, 'forgot_password', email)
    if (!verified) return apiError('Email verification expired. Please request a new OTP.', 400)

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return apiError('Unable to reset password', 400)

    await db.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(password),
        loginAttempts: 0,
        lockedUntil: null,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_reset',
        resource: 'user',
        resourceId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      },
    })

    return apiResponse({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return apiError('Failed to reset password. Please try again.', 500)
  }
}
