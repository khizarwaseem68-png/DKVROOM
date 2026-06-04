import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth/auth-utils'
import { verifyOtpVerificationToken } from '@/lib/auth/otp-service'
import { authRateLimit, sanitizeInput, isValidEmail, hasSqlInjection, apiResponse, apiError } from '@/lib/security/middleware'
import { saveFile, validateFile } from '@/lib/file-upload'

const FILE_CATEGORIES: Record<string, { maxSizeMB: number; allowedMimes: string[] }> = {
  icDocument: { maxSizeMB: 5, allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
  licenseDocument: { maxSizeMB: 5, allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
  registrationDoc: { maxSizeMB: 10, allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
}

export async function POST(request: NextRequest) {
  try {
    const rateCheck = authRateLimit(request)
    if (!rateCheck.allowed) {
      return apiError('Too many registration attempts. Please try again later.', 429)
    }

    const contentType = request.headers.get('content-type') || ''

    let body: Record<string, any>
    let icDocument: File | null = null
    let licenseDocument: File | null = null
    let registrationDoc: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      icDocument = formData.get('icDocument') as File | null
      licenseDocument = formData.get('licenseDocument') as File | null
      registrationDoc = formData.get('registrationDoc') as File | null
      body = {}
      for (const [key, value] of formData.entries()) {
        if (key !== 'icDocument' && key !== 'licenseDocument' && key !== 'registrationDoc') {
          body[key] = value
        }
      }
    } else {
      body = await request.json()
    }

    const {
      email, password, name, phone, whatsapp, address, city, state,
      icNumber, drivingLicense, licenseNumber, role,
      companyName, businessName, dealerType, contactPerson, contactName, registrationNo, regNo,
      bankName, bankAccountNumber, bankAccount, bankAccountHolder, bankHolder,
      icDocumentUrl, licenseDocumentUrl, registrationDocUrl,
      emailVerificationToken,
    } = body

    if (!email || !password || !name) {
      return apiError('Email, password, and name are required', 400)
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase()
    const sanitizedName = sanitizeInput(name)

    if (!isValidEmail(sanitizedEmail)) {
      return apiError('Invalid email format', 400)
    }

    if (hasSqlInjection(sanitizedEmail) || hasSqlInjection(sanitizedName)) {
      return apiError('Invalid input detected', 400)
    }

    const emailVerified = await verifyOtpVerificationToken(emailVerificationToken, 'registration', sanitizedEmail)
    if (!emailVerified) {
      return apiError('Please verify your email before registration', 400)
    }

    if (password.length < 8) {
      return apiError('Password must be at least 8 characters', 400)
    }

    const phonePattern = /^[+()\-\s0-9]{7,20}$/
    if (phone && !phonePattern.test(phone)) {
      return apiError('Please enter a valid phone number', 400)
    }
    if (whatsapp && !phonePattern.test(whatsapp)) {
      return apiError('Please enter a valid WhatsApp number', 400)
    }

    const existingUser = await db.user.findUnique({ where: { email: sanitizedEmail } })
    if (existingUser) {
      return apiError('An account with this email already exists', 409)
    }

    const hashedPassword = await hashPassword(password)
    const userRole = role === 'dealer' ? 'dealer' : 'customer'

    // Validate files before DB operations
    if (icDocument) {
      const cfg = FILE_CATEGORIES.icDocument
      const err = validateFile(icDocument, cfg.maxSizeMB, cfg.allowedMimes)
      if (err) return apiError('IC document: ' + err, 400)
    }
    if (licenseDocument) {
      const cfg = FILE_CATEGORIES.licenseDocument
      const err = validateFile(licenseDocument, cfg.maxSizeMB, cfg.allowedMimes)
      if (err) return apiError('License document: ' + err, 400)
    }
    if (registrationDoc) {
      const cfg = FILE_CATEGORIES.registrationDoc
      const err = validateFile(registrationDoc, cfg.maxSizeMB, cfg.allowedMimes)
      if (err) return apiError('Registration document: ' + err, 400)
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        phone: phone ? sanitizeInput(phone) : null,
        whatsapp: whatsapp ? sanitizeInput(whatsapp) : null,
        address: address ? sanitizeInput(address) : null,
        icNumber: icNumber ? sanitizeInput(icNumber) : null,
        drivingLicense: (drivingLicense || licenseNumber) ? sanitizeInput(drivingLicense || licenseNumber) : null,
        role: userRole,
        verified: false,
      }
    })

    let dealerProfile = null

    // If dealer, create dealer record
    if (userRole === 'dealer') {
      const dealerCompanyName = companyName || businessName

      if (!dealerCompanyName) {
        await db.user.delete({ where: { id: user.id } })
        return apiError('Company name is required for dealer registration', 400)
      }

      dealerProfile = await db.dealer.create({
        data: {
          userId: user.id,
          companyName: sanitizeInput(dealerCompanyName),
          dealerType: dealerType || 'used_car',
          contactPerson: (contactPerson || contactName) ? sanitizeInput(contactPerson || contactName) : null,
          registrationNo: (registrationNo || regNo) ? sanitizeInput(registrationNo || regNo) : null,
          phone: phone ? sanitizeInput(phone) : null,
          whatsapp: whatsapp ? sanitizeInput(whatsapp) : null,
          address: address ? sanitizeInput(address) : null,
          city: city ? sanitizeInput(city) : null,
          state: state ? sanitizeInput(state) : null,
          bankName: bankName ? sanitizeInput(bankName) : null,
          bankAccountNumber: (bankAccountNumber || bankAccount) ? sanitizeInput(bankAccountNumber || bankAccount) : null,
          bankAccountHolder: (bankAccountHolder || bankHolder) ? sanitizeInput(bankAccountHolder || bankHolder) : null,
          verified: false,
        }
      })
    }

    // Only now save files to disk (after DB success)
    let finalIcUrl = icDocumentUrl || null
    let finalLicenseUrl = licenseDocumentUrl || null
    let finalRegUrl = registrationDocUrl || null

    try {
      if (icDocument) {
        finalIcUrl = await saveFile(icDocument, 'ic', user.id)
      }
      if (licenseDocument) {
        finalLicenseUrl = await saveFile(licenseDocument, 'license', user.id)
      }
      if (registrationDoc && dealerProfile) {
        finalRegUrl = await saveFile(registrationDoc, 'documents', `dealer_${dealerProfile.id}`)
      }
    } catch {
      // File save failed but DB is already committed — non-critical, proceed
    }

    // Update user with document URLs
    if (finalIcUrl || finalLicenseUrl) {
      await db.user.update({
        where: { id: user.id },
        data: {
          ...(finalIcUrl ? { icDocumentUrl: finalIcUrl } : {}),
          ...(finalLicenseUrl ? { licenseDocumentUrl: finalLicenseUrl } : {}),
        }
      })
    }

    // Update dealer with registration doc URL
    if (finalRegUrl && dealerProfile) {
      await db.dealer.update({
        where: { id: dealerProfile.id },
        data: { registrationDocUrl: finalRegUrl }
      })
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Refresh user data with URLs
    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      include: userRole === 'dealer' ? { dealer: true } : undefined,
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

    if (!updatedUser) {
      return apiError('Registration failed', 500)
    }

    const { password: _, ...userWithoutPassword } = updatedUser
    const userResponse = userRole === 'dealer'
      ? { ...userWithoutPassword, dealer: dealerProfile }
      : userWithoutPassword

    return apiResponse({
      success: true,
      message: userRole === 'dealer'
        ? 'Registration successful! Your dealer account is pending verification.'
        : 'Registration successful!',
      user: userResponse,
      token,
    }, 201)

  } catch (error: unknown) {
    console.error('Registration error:', error)
    return apiError('Registration failed. Please try again.', 500)
  }
}
