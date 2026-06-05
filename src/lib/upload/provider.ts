export type UploadResult = {
  url: string
  publicId?: string
}

export interface UploadProvider {
  upload(file: File, category: string, ownerId: string): Promise<UploadResult>
  delete(urlOrPublicId: string): Promise<void>
}
