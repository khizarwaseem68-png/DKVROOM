import { NextRequest } from 'next/server'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { rateLimit, validateFileUpload, apiResponse, apiError } from '@/lib/security/middleware'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = '/home/z/my-project/upload'
const MAX_FILE_SIZE_MB = 10
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// POST /api/upload - Handle file upload
export async function POST(request: NextRequest) {
  const rateCheck = rateLimit(request, { windowMs: 60 * 1000, maxRequests: 20, keyPrefix: 'upload' })
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return apiError('No file provided', 400)
    }

    // Validate file
    const validation = validateFileUpload(file, {
      maxSizeMB: MAX_FILE_SIZE_MB,
      allowedTypes: ALLOWED_TYPES,
    })

    if (!validation.valid) {
      return apiError(validation.error || 'Invalid file', 400)
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = extname(file.name)
    const uniqueId = randomUUID()
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${uniqueId}${fileExtension}`

    const filePath = join(UPLOAD_DIR, uniqueFilename)

    // Read file buffer and write to disk
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    writeFileSync(filePath, buffer)

    // Return the URL path for accessing the file
    const fileUrl = `/uploads/${uniqueFilename}`

    return apiResponse({
      success: true,
      data: {
        url: fileUrl,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
      }
    }, 201)
  } catch (error) {
    console.error('File upload error:', error)
    return apiError('Failed to upload file', 500)
  }
}
