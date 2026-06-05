import { getProvider } from './upload/registry'

export async function saveFile(file: File, category: string, ownerId: string): Promise<string> {
  const result = await (await getProvider()).upload(file, category, ownerId)
  return result.url
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
