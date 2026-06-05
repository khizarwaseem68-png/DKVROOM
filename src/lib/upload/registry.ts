import { UploadProvider } from './provider'
import { CloudinaryProvider } from './cloudinary'
import { FileSystemProvider } from './filesystem'

let provider: UploadProvider | null = null

async function getStoredProvider(): Promise<string> {
  try {
    const { db } = await import('@/lib/db')
    const setting = await db.platformSetting.findUnique({
      where: { key: 'upload_provider' },
    })
    if (setting) return setting.value
  } catch {}
  return process.env.UPLOAD_PROVIDER || 'cloudinary'
}

export async function getProvider(): Promise<UploadProvider> {
  if (provider) return provider

  const choice = await getStoredProvider()
  provider = choice === 'filesystem' ? new FileSystemProvider() : new CloudinaryProvider()
  return provider
}

export function resetProvider(): void {
  provider = null
}
