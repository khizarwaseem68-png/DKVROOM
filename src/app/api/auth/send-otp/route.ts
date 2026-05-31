import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendEmailOtp, type OtpPurpose } from '@/lib/auth/otp-service'
import { authRateLimit, sanitizeInput, isValidEmail, apiResponse, apiError } from '@/lib/security/middleware'

function isOtpPurpose(value: unknown): value is OtpPurpose {
  return value === 'registration' || value === 'forgot_password'
}

export async function POST(request: NextRequest) {
  try {
    const rateCheck = authRateLimit(request)
    if (!rateCheck.allowed) return apiError('Too many OTP requests. Please try again later.', 429)

    const body = await request.json()
    const email = sanitizeInput(String(body.email || '')).toLowerCase()
    const purpose = body.purpose

    if (!email || !isValidEmail(email)) return apiError('Valid email is required', 400)
    if (!isOtpPurpose(purpose)) return apiError('Invalid OTP purpose', 400)

    const existingUser = await db.user.findUnique({ where: { email } })
    if (purpose === 'registration' && existingUser) {
      return apiError('An account with this email already exists', 409)
    }
    if (purpose === 'forgot_password' && !existingUser) {
      return apiResponse({ success: true, message: 'If an account exists, an OTP has been sent.' })
    }

    const result = await sendEmailOtp(email, purpose)
    if (!result.sent) {
      return apiError(`Please wait ${result.retryAfter} seconds before requesting another OTP`, 429)
    }

    return apiResponse({ success: true, message: 'OTP sent successfully' })
  } catch (error) {
    console.error('Send OTP error:', error)
    return apiError('Failed to send OTP. Please try again.', 500)
  }
}
