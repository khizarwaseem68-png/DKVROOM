import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth/auth-utils'
import { rateLimit, authRateLimit, sanitizeInput, isValidEmail, hasSqlInjection, apiResponse, apiError } from '@/lib/security/middleware'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = authRateLimit(request)
    if (!rateCheck.allowed) {
      return apiError('Too many registration attempts. Please try again later.', 429)
    }

    const body = await request.json()
    const {
      email, password, name, phone, whatsapp, address,
      icNumber, drivingLicense, role,
      // Dealer-specific fields
      companyName, dealerType, contactPerson, registrationNo,
      bankName, bankAccountNumber, bankAccountHolder,
    } = body

    // Validate required fields
    if (!email || !password || !name) {
      return apiError('Email, password, and name are required', 400)
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase()
    const sanitizedName = sanitizeInput(name)

    // Validate email
    if (!isValidEmail(sanitizedEmail)) {
      return apiError('Invalid email format', 400)
    }

    // Check for SQL injection
    if (hasSqlInjection(sanitizedEmail) || hasSqlInjection(sanitizedName)) {
      return apiError('Invalid input detected', 400)
    }

    // Validate password strength
    if (password.length < 8) {
      return apiError('Password must be at least 8 characters', 400)
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return apiError('Password must contain at least one uppercase letter, one lowercase letter, and one number', 400)
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: sanitizedEmail } })
    if (existingUser) {
      return apiError('An account with this email already exists', 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const userRole = role === 'dealer' ? 'dealer' : 'customer'

    const user = await db.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        phone: phone ? sanitizeInput(phone) : null,
        whatsapp: whatsapp ? sanitizeInput(whatsapp) : null,
        address: address ? sanitizeInput(address) : null,
        icNumber: icNumber ? sanitizeInput(icNumber) : null,
        drivingLicense: drivingLicense ? sanitizeInput(drivingLicense) : null,
        role: userRole,
        verified: false,
      }
    })

    // If dealer, create dealer record
    if (userRole === 'dealer') {
      if (!companyName) {
        await db.user.delete({ where: { id: user.id } })
        return apiError('Company name is required for dealer registration', 400)
      }

      await db.dealer.create({
        data: {
          userId: user.id,
          companyName: sanitizeInput(companyName),
          dealerType: dealerType || 'used_car',
          contactPerson: contactPerson ? sanitizeInput(contactPerson) : null,
          registrationNo: registrationNo ? sanitizeInput(registrationNo) : null,
          phone: phone ? sanitizeInput(phone) : null,
          whatsapp: whatsapp ? sanitizeInput(whatsapp) : null,
          address: address ? sanitizeInput(address) : null,
          bankName: bankName ? sanitizeInput(bankName) : null,
          bankAccountNumber: bankAccountNumber ? sanitizeInput(bankAccountNumber) : null,
          bankAccountHolder: bankAccountHolder ? sanitizeInput(bankAccountHolder) : null,
          verified: false,
        }
      })
    }

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
        action: 'register',
        resource: 'user',
        resourceId: user.id,
        details: JSON.stringify({ role: userRole, email: sanitizedEmail }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      }
    })

    // Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to DK Vroom!',
        message: userRole === 'dealer'
          ? 'Your dealer account is pending verification. You will be notified once approved.'
          : 'Your account has been created successfully. Start exploring premium vehicles now!',
        type: 'success',
      }
    })

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return apiResponse({
      success: true,
      message: userRole === 'dealer'
        ? 'Registration successful! Your dealer account is pending verification.'
        : 'Registration successful!',
      user: userWithoutPassword,
      token,
    }, 201)

  } catch (error: any) {
    console.error('Registration error:', error)
    return apiError('Registration failed. Please try again.', 500)
  }
}
