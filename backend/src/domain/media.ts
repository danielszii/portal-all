export type MediaKind = 'image' | 'pdf' | 'publication'
export const mediaMimeTypes: Record<MediaKind, readonly string[]> = {
  image: ['image/png', 'image/jpeg', 'image/webp'],
  pdf: ['application/pdf'],
  publication: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
}
export const maxUploadBytes = 10 * 1024 * 1024
