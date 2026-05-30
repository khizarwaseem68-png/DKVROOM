import { NextRequest } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// GET /api/serve-upload/[...path] - Serve uploaded files from local file system
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = join(process.cwd(), 'uploads', ...pathSegments)

    // Security: prevent directory traversal
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!filePath.startsWith(uploadsDir)) {
      return new Response('Forbidden', { status: 403 })
    }

    // Check file exists
    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Determine content type based on extension
    const ext = filePath.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      pdf: 'application/pdf',
    }
    const contentType = contentTypes[ext || ''] || 'application/octet-stream'

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[SERVE_UPLOAD_ERROR]', error)
    return new Response('File not found', { status: 404 })
  }
}
