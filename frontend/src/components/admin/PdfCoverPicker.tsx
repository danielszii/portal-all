import { useEffect, useState } from 'react'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export default function PdfCoverPicker({ file, disabled, onCover, onPending }: {
  file: File; disabled: boolean; onCover: (file: File) => void; onPending: () => void
}) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [image, setImage] = useState('')

  useEffect(() => {
    let active = true
    let loading: ReturnType<typeof getDocument> | undefined
    setDocument(null); setPage(1); setImage(''); setError('')
    void file.arrayBuffer().then(data => {
      if (!active) return
      loading = getDocument({ data })
      return loading.promise.then(pdf => { if (active) setDocument(pdf) })
    }).catch(() => { if (active) setError('Não foi possível abrir o PDF. Confira se ele não está protegido por senha.') })
    return () => { active = false; if (loading) void loading.destroy() }
  }, [file])

  useEffect(() => {
    if (!document) return
    let active = true
    onPending()
    setWorking(true); setError(''); setImage('')
    void (async () => {
      const pdfPage = await document.getPage(page)
      const base = pdfPage.getViewport({ scale: 1 })
      const viewport = pdfPage.getViewport({ scale: Math.min(2, 1000 / Math.max(base.width, base.height)) })
      const canvas = window.document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas indisponível')
      await pdfPage.render({ canvasContext: context, canvas, viewport }).promise
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Não foi possível gerar a imagem')
      if (active) {
        setImage(canvas.toDataURL('image/png'))
        onCover(new File([blob], 'capa.png', { type: 'image/png' }))
      }
    })().catch(() => { if (active) setError('Não foi possível gerar a capa desta página.') })
      .finally(() => { if (active) setWorking(false) })
    return () => { active = false }
  }, [document, page, onCover, onPending])

  return <div className="admin-field-wide pdf-cover-picker">
    <label className="admin-field"><span>Página do PDF para a capa</span>
      <input type="number" min={1} max={document?.numPages ?? 1} value={page} disabled={disabled || !document}
        onChange={event => { const value = Number(event.target.value); if (value >= 1 && value <= (document?.numPages ?? 0) && value !== page) { onPending(); setPage(value) } }} />
    </label>
    {document && <small>Escolha uma página de 1 a {document.numPages}. A capa é gerada automaticamente.</small>}
    {working && <small role="status">Gerando capa…</small>}
    {error && <small role="alert">{error}</small>}
    {image && <img src={image} alt={`Prévia da página ${page} escolhida como capa`} />}
  </div>
}
