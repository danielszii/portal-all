import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ValidationError } from '../errors/app.error.js'

export const uploadDir = resolve(process.env.UPLOAD_DIR || fileURLToPath(new URL('../../uploads/', import.meta.url)))
export function uploadExtension(data: Buffer, mime: string) {
  if (mime === 'application/pdf' && data.subarray(0, 5).toString() === '%PDF-' && data.subarray(-1024).includes(Buffer.from('%%EOF'))) return 'pdf'
  if (mime === 'image/png' && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png'
  if (mime === 'image/jpeg' && data[0] === 255 && data[1] === 216 && data[2] === 255 && data[data.length - 2] === 255 && data[data.length - 1] === 217) return 'jpg'
  if (mime === 'image/webp' && data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP') return 'webp'
  throw new ValidationError('Arquivo inválido. Aceitos: PDF, PNG, JPEG e WebP com conteúdo correspondente ao Content-Type.')
}
export async function saveUpload(body: unknown, mime: string) {
  if (!Buffer.isBuffer(body) || body.length === 0) throw new ValidationError('Envie o arquivo binário no corpo da requisição.')
  const extension = uploadExtension(body, mime)
  const name = `${randomUUID()}.${extension}`
  await mkdir(uploadDir, { recursive: true })
  await writeFile(resolve(uploadDir, name), body, { flag: 'wx', mode: 0o600 })
  return { url: `/uploads/${name}`, contentType: mime, size: body.length }
}
