import { mkdir, open, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ValidationError } from '../errors/app.error.js'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { maxUploadBytes, mediaMimeTypes } from '../domain/media.js'
import { prisma } from '../db/prisma.js'
import { recordAudit, type AuditActor } from './admin-audit.service.js'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readR2Config } from '../config/upload.config.js'

export const uploadDir = resolve(process.env.UPLOAD_DIR?.trim() || fileURLToPath(new URL('../../uploads/', import.meta.url)))

function r2Client(config: NonNullable<ReturnType<typeof readR2Config>>) {
  return new S3Client({
    region: 'auto', endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  })
}
export async function validateUpload(data: Buffer, mime: string): Promise<string> {
  if (!data.length || data.length > maxUploadBytes) throw new ValidationError('O arquivo deve ter conteúdo e no máximo 10 MB.')
  try {
    if (mime === 'application/pdf') {
      if (!data.subarray(0, 8).toString().match(/^%PDF-\d\.\d/) || !data.subarray(-1024).toString().trimEnd().endsWith('%%EOF')) throw new Error('PDF incompleto')
      const document = await PDFDocument.load(data, { throwOnInvalidObject: true, updateMetadata: false })
      const pages = document.getPages()
      if (!pages.length) throw new Error('PDF sem páginas')
      for (const page of pages) {
        const { width, height } = page.getSize()
        if (![width, height].every(value => Number.isFinite(value) && value > 0)) throw new Error('Página inválida')
      }
      return 'pdf'
    }
    if (mediaMimeTypes.image.includes(mime)) {
      const image = sharp(data, { failOn: 'warning', limitInputPixels: 40_000_000, animated: true })
      const metadata = await image.metadata()
      if (`image/${metadata.format}` !== mime) throw new Error('Tipo divergente')
      // metadata() lê só o cabeçalho. stats() força a decodificação dos pixels.
      await image.stats()
      return metadata.format === 'jpeg' ? 'jpg' : metadata.format!
    }
  } catch {
    throw new ValidationError('Arquivo inválido ou corrompido. Envie PNG, JPEG ou WebP de até 40 megapixels, ou PDF válido com páginas e sem senha, correspondente ao Content-Type.')
  }
  throw new ValidationError('Tipo não permitido. Aceitos: PDF, PNG, JPEG e WebP.')
}
export async function saveUpload(body: unknown, mime: string, actor: AuditActor) {
  if (!Buffer.isBuffer(body) || body.length === 0) throw new ValidationError('Envie o arquivo binário no corpo da requisição.')
  const extension = await validateUpload(body, mime)
  const name = `${randomUUID()}.${extension}`
  const cloud = readR2Config()
  const result = { url: cloud ? `${cloud.publicUrl}/${name}` : `/uploads/${name}`, contentType: mime, size: body.length }

  if (cloud) {
    const client = r2Client(cloud)
    try {
      await client.send(new PutObjectCommand({
        Bucket: cloud.bucket, Key: name, Body: body, ContentType: mime,
        CacheControl: 'public, max-age=31536000, immutable',
      }), { abortSignal: AbortSignal.timeout(60_000) })
      try {
        await recordAudit(prisma, actor, { acao: 'ENVIAR_ARQUIVO', recurso: 'UPLOAD', registroId: name,
          resumo: `Upload ${mime}`, detalhes: result })
      } catch (error) {
        try {
          await client.send(new DeleteObjectCommand({ Bucket: cloud.bucket, Key: name }), { abortSignal: AbortSignal.timeout(60_000) })
        } catch (cleanupError) {
          throw new AggregateError([error, cleanupError], `Falha na auditoria e na remoção do upload R2 ${name}. Verifique o objeto órfão.`)
        }
        throw error
      }
      return result
    } finally { client.destroy() }
  }

  await mkdir(uploadDir, { recursive: true })
  const path = resolve(uploadDir, name)
  const file = await open(path, 'wx', 0o600)
  try {
    await file.writeFile(body)
    await file.close()
    await recordAudit(prisma, actor, { acao: 'ENVIAR_ARQUIVO', recurso: 'UPLOAD', registroId: name,
      resumo: `Upload ${mime}`, detalhes: result })
    return result
  } catch (error) {
    await file.close()
    // Nome aleatório aberto com wx: somente o arquivo novo desta tentativa é removido.
    await unlink(path)
    throw error
  }
}
