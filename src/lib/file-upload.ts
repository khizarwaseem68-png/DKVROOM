import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { randomUUID } from 'crypto'

const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf']

export async function saveFile(file: File, category: string, ownerId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  if (!allowedExtensions.includes(ext)) throw new Error('Invalid file extension')

  const filename = `${category}/${ownerId}/${randomUUID()}.${ext}`
  const uploadDir = join(process.cwd(), 'uploads', category, ownerId)

  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(join(process.cwd(), 'uploads', filename), buffer)

  return `/uploads/${filename}`
}

export function validateFile(file: File, maxSizeMB: number, allowedMimes: string[]): string | null {
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size must be under ${maxSizeMB}MB`
  }
  if (!allowedMimes.includes(file.type)) {
    return 'Invalid file type'
  }
  return null
}
