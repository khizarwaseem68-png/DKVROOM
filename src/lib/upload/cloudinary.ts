import { v2 as cloudinary } from 'cloudinary'
import { UploadProvider, UploadResult } from './provider'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf']

export class CloudinaryProvider implements UploadProvider {
  async upload(file: File, category: string, ownerId: string): Promise<UploadResult> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    if (!allowedExtensions.includes(ext)) throw new Error('Invalid file extension')

    const buffer = Buffer.from(await file.arrayBuffer())
    const publicId = `dkvroom/${category}/${ownerId}/${crypto.randomUUID()}`

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: ext === 'pdf' ? 'raw' : 'image',
          format: ext,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Upload failed'))
            return
          }
          resolve({ url: result.secure_url, publicId: result.public_id })
        }
      )
      uploadStream.end(buffer)
    })
  }

  async delete(urlOrPublicId: string): Promise<void> {
    const publicId = urlOrPublicId.includes('res.cloudinary.com')
      ? this.extractPublicId(urlOrPublicId)
      : urlOrPublicId

    await cloudinary.uploader.destroy(publicId)
  }

  private extractPublicId(url: string): string {
    const parts = url.split('/')
    const uploadIndex = parts.indexOf('upload')
    return parts.slice(uploadIndex + 2).join('/').replace(/\.[^.]+$/, '')
  }
}
