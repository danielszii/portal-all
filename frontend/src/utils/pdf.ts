export function pdfViewerUrl(value: string, origin: string): string | undefined {
  if (!value.trim()) return undefined
  try {
    const url = new URL(value, origin)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    // O Google não consegue buscar arquivos locais do portal em desenvolvimento.
    return url.origin === origin
      ? url.href
      : `https://docs.google.com/viewer?url=${encodeURIComponent(url.href)}&embedded=true`
  } catch { return undefined }
}

export function publicationImageUrl(value: string, origin: string): string | undefined {
  try {
    const url = new URL(value, origin)
    if (!['http:', 'https:'].includes(url.protocol) || !/\.(?:png|jpe?g|webp)$/i.test(decodeURIComponent(url.pathname))) return undefined
    return url.href
  } catch { return undefined }
}
