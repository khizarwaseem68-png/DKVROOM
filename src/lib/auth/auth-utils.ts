import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { db } from '@/lib/db'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dk-vroom-secret-key-change-in-production-2024')
const SALT_ROUNDS = 12

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT Token generation
export async function generateToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

// JWT Token verification
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

// Account lockout after failed attempts
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export async function checkLoginAttempts(userId: string): Promise<{ allowed: boolean; remainingAttempts?: number }> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return { allowed: false }

  // Check if account is locked
  if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
    return { allowed: false }
  }

  // If lockout expired, reset attempts
  if (user.lockedUntil && new Date() >= new Date(user.lockedUntil)) {
    await db.user.update({
      where: { id: userId },
      data: { loginAttempts: 0, lockedUntil: null }
    })
  }

  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - user.loginAttempts }
}

export async function recordFailedAttempt(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return

  const newAttempts = user.loginAttempts + 1

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    await db.user.update({
      where: { id: userId },
      data: {
        loginAttempts: newAttempts,
        lockedUntil: new Date(Date.now() + LOCKOUT_DURATION)
      }
    })
  } else {
    await db.user.update({
      where: { id: userId },
      data: { loginAttempts: newAttempts }
    })
  }
}

export async function resetLoginAttempts(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
  })
}

// Get user from request (auth middleware helper)
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)
  if (!payload) return null

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: { dealer: true }
  })

  if (!user || !user.active) return null

  return user
}

// Require specific role
export function requireRole(user: any, roles: string[]) {
  if (!user || !roles.includes(user.role)) {
    return false
  }
  return true
}
