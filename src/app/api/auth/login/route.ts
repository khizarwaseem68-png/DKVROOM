import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, generateToken, checkLoginAttempts, recordFailedAttempt, resetLoginAttempts } from '@/lib/auth/auth-utils'
import { authRateLimit, sanitizeInput, isValidEmail, apiResponse, apiError } from '@/lib/security/middleware'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = authRateLimit(request)
    if (!rateCheck.allowed) {
      return apiError('Too many login attempts. Please try again later.', 429)
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiError('Email and password are required', 400)
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase()

    if (!isValidEmail(sanitizedEmail)) {
      return apiError('Invalid email format', 400)
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      include: { dealer: true }
    })

    if (!user) {
      return apiError('Invalid email or password', 401)
    }

    // Check if account is locked
    if (!user.active) {
      return apiError('Your account has been deactivated. Please contact support.', 403)
    }

    // Check login attempts
    const attemptCheck = await checkLoginAttempts(user.id)
    if (!attemptCheck.allowed) {
      return apiError('Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.', 423)
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      await recordFailedAttempt(user.id)
      const remaining = Math.max(0, (attemptCheck.remainingAttempts || 5) - 1)
      return apiError(
        remaining > 0
          ? `Invalid email or password. ${remaining} attempts remaining.`
          : 'Account locked due to too many failed attempts.',
        401
      )
    }

    // Reset login attempts on successful login
    await resetLoginAttempts(user.id)

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        resource: 'user',
        resourceId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      }
    })

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return apiResponse({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return apiError('Login failed. Please try again.', 500)
  }
}
