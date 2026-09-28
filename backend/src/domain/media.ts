export type MediaKind = 'image' | 'pdf'
export const mediaMimeTypes: Record<MediaKind, readonly string[]> = {
  image: ['image/png', 'image/jpeg', 'image/webp'],
  pdf: ['application/pdf'],
}
export const maxUploadBytes = 10 * 1024 * 1024
