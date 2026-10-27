import { maxUploadBytes } from '../../../backend/src/domain/media.js'

// Converte formatos de imagem suportados pelo navegador ao formato aceito pela API.
export async function convertCoverImage(file: File, maxDimension = 1400): Promise<File> {
  if (!file.type.startsWith('image/') || !file.size || file.size > maxUploadBytes) {
    throw new Error('Escolha uma imagem de até 10 MB.')
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error('A imagem deve ter no máximo 40 megapixels.')
    }
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a imagem neste navegador.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob || blob.size > maxUploadBytes) throw new Error('Não foi possível gerar uma capa de até 10 MB.')
    return new File([blob], 'capa.png', { type: 'image/png' })
  } catch (error) {
    if (error instanceof Error && /até 10 MB|40 megapixels|preparar a imagem/.test(error.message)) throw error
    throw new Error('Não foi possível abrir esta imagem. Tente outro formato compatível com seu navegador.')
  } finally {
    URL.revokeObjectURL(url)
  }
}
