import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'

export async function pdfFixture() {
  const document = await PDFDocument.create()
  document.addPage([200, 200]).drawText('Portal ALL', { x: 20, y: 100, size: 16 })
  return document.save()
}

export async function imageFixture(format: 'png' | 'jpeg' | 'webp' = 'png') {
  return sharp({ create: { width: 16, height: 16, channels: 3, background: '#123456' } }).toFormat(format).toBuffer()
}
