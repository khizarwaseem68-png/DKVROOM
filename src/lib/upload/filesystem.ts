import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { UploadProvider, UploadResult } from './provider'

const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf']

export class FileSystemProvider implements UploadProvider {
  async upload(file: File, category: string, ownerId: string): Promise<UploadResult> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    if (!allowedExtensions.includes(ext)) throw new Error('Invalid file extension')

    const filename = `${category}/${ownerId}/${crypto.randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), 'uploads', category, ownerId)

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(process.cwd(), 'uploads', filename), buffer)

    return { url: `/uploads/${filename}` }
  }

  async delete(urlOrPublicId: string): Promise<void> {
    const { unlink } = await import('fs/promises')
    const filePath = join(process.cwd(), 'uploads', urlOrPublicId.replace('/uploads/', ''))
    await unlink(filePath).catch(() => {})
  }
}
