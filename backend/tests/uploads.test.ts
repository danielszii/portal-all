import test from 'node:test'
import assert from 'node:assert/strict'
import { PDFDocument } from 'pdf-lib'
import { validateUpload } from '../src/services/admin-upload.service.js'
import { mediaUrl } from '../src/services/admin-validation.js'
import { imageFixture, pdfFixture } from './upload-fixtures.js'

test('upload decodifica imagens válidas e recusa MIME divergente e imagens truncadas', async () => {
  for (const format of ['png', 'jpeg', 'webp'] as const) {
    const bytes = await imageFixture(format)
    const mime = `image/${format}`
    assert.equal(await validateUpload(bytes, mime), format === 'jpeg' ? 'jpg' : format)
    await assert.rejects(validateUpload(bytes, format === 'png' ? 'image/jpeg' : 'image/png'))
    await assert.rejects(validateUpload(bytes.subarray(0, Math.floor(bytes.length / 2)), mime))
  }
})

test('assinaturas isoladas, HTML, SVG e arquivos vazios ou excessivos não são uploads válidos', async () => {
  const invalid: [string, Buffer][] = [
    ['image/png', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])],
    ['image/jpeg', Buffer.from([255, 216, 255, 255, 217])],
    ['image/webp', Buffer.from('RIFF0000WEBP')],
    ['application/pdf', Buffer.from('%PDF-1.4\n%%EOF')],
  ]
  for (const [mime, bytes] of invalid) {
    await assert.rejects(validateUpload(bytes, mime))
    await assert.rejects(validateUpload(Buffer.from('<svg onload="alert(1)"></svg>'), mime))
  }
  await assert.rejects(validateUpload(Buffer.from('<html>Teste</html>'), 'text/html'))
  await assert.rejects(validateUpload(Buffer.alloc(0), 'application/pdf'), /conteúdo/)
  await assert.rejects(validateUpload(Buffer.alloc(10 * 1024 * 1024 + 1), 'image/png'), /10 MB/)
})

test('PDF exige estrutura e páginas válidas e recusa truncamento', async () => {
  const bytes = Buffer.from(await pdfFixture())
  assert.equal(await validateUpload(bytes, 'application/pdf'), 'pdf')
  await assert.rejects(validateUpload(bytes.subarray(0, bytes.length - 20), 'application/pdf'))
  const empty = await PDFDocument.create()
  await assert.rejects(validateUpload(Buffer.from(await empty.save({ addDefaultPage: false })), 'application/pdf'))
  const invalidPage = await PDFDocument.create()
  invalidPage.addPage([0, 10])
  await assert.rejects(validateUpload(Buffer.from(await invalidPage.save()), 'application/pdf'))
})

test('URLs de upload respeitam o tipo do campo, inclusive com query, fragmento e extensão codificada', () => {
  for (const value of ['/uploads/foto.png', 'https://portal.test/uploads/foto.JPEG?download=1#foto', '/uploads/foto%2Ewebp']) {
    assert.equal(mediaUrl(value, 'foto', 'image'), value)
    assert.throws(() => mediaUrl(value, 'pdfUrl', 'pdf'))
  }
  for (const value of ['/uploads/livro.pdf', 'https://portal.test/uploads/livro.PDF?download=1', '/uploads/livro%2Epdf#capa']) {
    assert.equal(mediaUrl(value, 'pdfUrl', 'pdf'), value)
    assert.throws(() => mediaUrl(value, 'foto', 'image'))
  }
  for (const value of ['/uploads/sem-extensao', '/uploads/foto.svg', '/uploads/invalido%']) {
    assert.throws(() => mediaUrl(value, 'foto', 'image'))
  }
  assert.equal(mediaUrl('https://images.unsplash.com/photo-existente?w=800', 'foto', 'image'), 'https://images.unsplash.com/photo-existente?w=800')
  assert.equal(mediaUrl('https://acervo.test/download?id=10', 'pdfUrl', 'pdf'), 'https://acervo.test/download?id=10')
  assert.equal(mediaUrl(null, 'foto', 'image'), '')
  assert.throws(() => mediaUrl(null, 'pdfUrl', 'pdf', true))
})
