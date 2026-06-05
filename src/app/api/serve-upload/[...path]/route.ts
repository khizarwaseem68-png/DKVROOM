import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const contentTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

function getContentType(ext: string): string {
  return contentTypes[ext] || 'application/octet-stream'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = join(process.cwd(), 'uploads', ...pathSegments)

    const uploadsDir = join(process.cwd(), 'uploads')
    if (!filePath.startsWith(uploadsDir)) {
      return new Response('Forbidden', { status: 403 })
    }

    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 })
    }

    const fileBuffer = await readFile(filePath)

    const ext = filePath.split('.').pop()?.toLowerCase() || ''

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': getContentType(ext),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[SERVE_UPLOAD_ERROR]', error)
    return new Response('File not found', { status: 404 })
  }
}
