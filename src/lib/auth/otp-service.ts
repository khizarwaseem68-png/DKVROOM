import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { db } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email/email-service'

export type OtpPurpose = 'registration' | 'forgot_password'

const OTP_EXPIRY_MINUTES = 10
const OTP_RESEND_SECONDS = 60
const MAX_OTP_ATTEMPTS = 5

function getOtpSecret(): Uint8Array {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OTP_SECRET or JWT_SECRET is required in production')
    }
    return new TextEncoder().encode('dk-vroom-dev-otp-secret')
  }
  return new TextEncoder().encode(secret)
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendEmailOtp(email: string, purpose: OtpPurpose) {
  const normalizedEmail = normalizeEmail(email)
  const existing = await db.emailOtp.findUnique({
    where: { email: normalizedEmail },
  })

  if (existing && Date.now() - existing.lastSentAt.getTime() < OTP_RESEND_SECONDS * 1000) {
    const retryAfter = Math.ceil((OTP_RESEND_SECONDS * 1000 - (Date.now() - existing.lastSentAt.getTime())) / 1000)
    return { sent: false, retryAfter }
  }

  const otp = generateOtp()
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await db.emailOtp.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      purpose,
      otpHash,
      attempts: 0,
      expiresAt,
      lastSentAt: new Date(),
    },
    update: {
      otpHash,
      attempts: 0,
      expiresAt,
      lastSentAt: new Date(),
    },
  })

  await sendOtpEmail({ email: normalizedEmail, otp, purpose })
  return { sent: true, retryAfter: 0 }
}

export async function verifyEmailOtp(email: string, purpose: OtpPurpose, otp: string) {
  const normalizedEmail = normalizeEmail(email)
  const record = await db.emailOtp.findUnique({
    where: { email: normalizedEmail },
  })

  if (!record) return { verified: false, error: 'OTP not found. Please request a new code.' }
  if (record.purpose !== purpose) return { verified: false, error: 'OTP purpose mismatch. Please request a new code.' }

  if (record.expiresAt.getTime() < Date.now()) {
    await db.emailOtp.delete({ where: { id: record.id } })
    return { verified: false, error: 'OTP expired. Please request a new code.' }
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await db.emailOtp.delete({ where: { id: record.id } })
    return { verified: false, error: 'Too many invalid attempts. Please request a new code.' }
  }

  const matches = await bcrypt.compare(otp, record.otpHash)
  if (!matches) {
    await db.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    })
    return { verified: false, error: 'Invalid OTP code.' }
  }

  await db.emailOtp.delete({ where: { id: record.id } })
  const verificationToken = await generateOtpVerificationToken(normalizedEmail, purpose)
  return { verified: true, verificationToken }
}

export async function generateOtpVerificationToken(email: string, purpose: OtpPurpose) {
  return new SignJWT({ email: normalizeEmail(email), purpose, type: 'email_otp_verified' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getOtpSecret())
}

export async function verifyOtpVerificationToken(token: string | undefined, purpose: OtpPurpose, email: string) {
  if (!token) return false

  try {
    const { payload } = await jwtVerify(token, getOtpSecret())
    return (
      payload.type === 'email_otp_verified' &&
      payload.purpose === purpose &&
      payload.email === normalizeEmail(email)
    )
  } catch {
    return false
  }
}
