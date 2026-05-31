import { NextRequest } from 'next/server'
import { verifyEmailOtp, type OtpPurpose } from '@/lib/auth/otp-service'
import { authRateLimit, sanitizeInput, isValidEmail, apiResponse, apiError } from '@/lib/security/middleware'

function isOtpPurpose(value: unknown): value is OtpPurpose {
  return value === 'registration' || value === 'forgot_password'
}

export async function POST(request: NextRequest) {
  try {
    const rateCheck = authRateLimit(request)
    if (!rateCheck.allowed) return apiError('Too many OTP attempts. Please try again later.', 429)

    const body = await request.json()
    const email = sanitizeInput(String(body.email || '')).toLowerCase()
    const otp = String(body.otp || '').replace(/\D/g, '')
    const purpose = body.purpose

    if (!email || !isValidEmail(email)) return apiError('Valid email is required', 400)
    if (!isOtpPurpose(purpose)) return apiError('Invalid OTP purpose', 400)
    if (otp.length !== 6) return apiError('Please enter the 6-digit OTP', 400)

    const result = await verifyEmailOtp(email, purpose, otp)
    if (!result.verified) return apiError(result.error || 'OTP verification failed', 400)

    return apiResponse({
      success: true,
      message: 'OTP verified successfully',
      verificationToken: result.verificationToken,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return apiError('Failed to verify OTP. Please try again.', 500)
  }
}
