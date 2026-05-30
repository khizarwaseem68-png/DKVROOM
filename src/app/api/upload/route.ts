import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { rateLimit, validateFileUpload, apiResponse, apiError } from '@/lib/security/middleware'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'

// POST /api/upload - Upload a file to local file system
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = rateLimit(request, { windowMs: 60_000, maxRequests: 20, keyPrefix: 'upload' })
    if (!rateCheck.allowed) {
      return apiError('Too many upload requests. Please try again later.', 429)
    }

    // Auth check - must be logged in
    const user = await getUserFromRequest(request)
    if (!user) return apiError('Unauthorized', 401)

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as string | null // receipts, documents, photos, ic, license, agreements, vehicle_photos

    if (!file) {
      return apiError('No file provided', 400)
    }

    // Validate file type and size based on category
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

    const cat = category || 'default'
    const maxSizeMB = maxSizes[cat] || maxSizes.default
    const allowedMimes = allowedTypes[cat] || allowedTypes.default

    // Validate file
    const validation = validateFileUpload(file, { maxSizeMB, allowedTypes: allowedMimes })
    if (!validation.valid) {
      return apiError(validation.error || 'Invalid file', 400)
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
    if (!allowedExtensions.includes(ext)) {
      return apiError('Invalid file extension', 400)
    }

    const filename = `${cat}/${user.id}/${randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), 'uploads', cat, user.id)

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file to disk
    const filePath = join(process.cwd(), 'uploads', filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return the URL path (relative to server)
    const url = `/uploads/${filename}`

    // Audit log
    const { db } = await import('@/lib/db')
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'file_uploaded',
        resource: 'upload',
        details: JSON.stringify({
          filename: file.name,
          category: cat,
          size: file.size,
          type: file.type,
          url,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        severity: 'info',
      },
    }).catch(() => {}) // Don't fail upload if audit log fails

    return apiResponse({
      success: true,
      url,
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
