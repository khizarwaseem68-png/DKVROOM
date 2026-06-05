import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { rateLimit, validateFileUpload, apiResponse, apiError } from '@/lib/security/middleware'
import { getProvider } from '@/lib/upload/registry'

export async function POST(request: NextRequest) {
  try {
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 20, keyPrefix: 'upload' })
    if (!rateCheck.allowed) {
      return apiError('Too many upload requests. Please try again later.', 429)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as string | null
    const cat = category || 'default'

    const user = await getUserFromRequest(request)
    const publicRegistrationCategories = new Set(['documents', 'ic', 'license'])
    if (!user && !publicRegistrationCategories.has(cat)) {
      return apiError('Unauthorized', 401)
    }

    if (!file) {
      return apiError('No file provided', 400)
    }

    const maxSizes: Record<string, number> = {
      receipts: 5,
      documents: 10,
      photos: 5,
      ic: 5,
      license: 5,
      agreements: 10,
      vehicle_photos: 5,
      default: 5,
    }

    const allowedTypes: Record<string, string[]> = {
      receipts: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      documents: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      photos: ['image/jpeg', 'image/png', 'image/webp'],
      ic: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      license: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      agreements: ['application/pdf', 'image/jpeg', 'image/png'],
      vehicle_photos: ['image/jpeg', 'image/png', 'image/webp'],
      default: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    }

    const maxSizeMB = maxSizes[cat] || maxSizes.default
    const allowedMimes = allowedTypes[cat] || allowedTypes.default

    const validation = validateFileUpload(file, { maxSizeMB, allowedTypes: allowedMimes })
    if (!validation.valid) {
      return apiError(validation.error || 'Invalid file', 400)
    }

    const ownerFolder = user?.id || 'registration'
    const result = await (await getProvider()).upload(file, cat, ownerFolder)

    const { db } = await import('@/lib/db')
    await db.auditLog.create({
      data: {
        userId: user?.id,
        action: 'file_uploaded',
        resource: 'upload',
        details: JSON.stringify({
          filename: file.name,
          category: cat,
          size: file.size,
          type: file.type,
          url: result.url,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      },
    }).catch(() => {})

    return apiResponse({
      success: true,
      url: result.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      category: cat,
    }, 201)
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error)
    return apiError('File upload failed', 500)
  }
}
