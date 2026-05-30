import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in-memory, resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(request: NextRequest, options: {
  windowMs?: number
  maxRequests?: number
  keyPrefix?: string
} = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    maxRequests = 60,
    keyPrefix = 'api'
  } = options

  // Get client identifier (IP + user agent hash for more security)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
  const key = `${keyPrefix}:${ip}`

  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count }
}

// Stricter rate limit for auth endpoints
export function authRateLimit(request: NextRequest) {
  return rateLimit(request, { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: 'auth' })
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') return sanitizeInput(obj)
  if (Array.isArray(obj)) return obj.map(sanitizeObject)
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  return obj
}

// SQL injection prevention - validate that input doesn't contain SQL patterns
export function hasSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
    /(--|;|\/\*|\*\/|xp_|0x)/i,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  ]
  return sqlPatterns.some(pattern => pattern.test(input))
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate Malaysian phone number
export function isValidMalaysianPhone(phone: string): boolean {
  const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Validate Malaysian IC number
export function isValidIC(ic: string): boolean {
  const icRegex = /^\d{6}-\d{2}-\d{4}$/
  return icRegex.test(ic)
}

// File upload validation
export function validateFileUpload(file: File, options: {
  maxSizeMB?: number
  allowedTypes?: string[]
} = {}) {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  } = options

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} not allowed` }
  }

  return { valid: true }
}

// CORS headers
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

// Security headers for responses
export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

// Standard API response helpers
export function apiResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...securityHeaders(),
      ...corsHeaders(),
    }
  })
}

export function apiError(message: string, status = 400, details?: any) {
  return NextResponse.json({
    success: false,
    error: message,
    ...(details && { details })
  }, {
    status,
    headers: {
      ...securityHeaders(),
      ...corsHeaders(),
    }
  })
}

// Paginated response helper
export function paginatedResponse(data: any[], total: number, page: number, limit: number) {
  return apiResponse({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    }
  })
}
