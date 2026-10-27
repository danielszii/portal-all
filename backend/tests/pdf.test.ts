import test from 'node:test'
import assert from 'node:assert/strict'
import { pdfViewerUrl, publicationImageUrl } from '../../frontend/src/utils/pdf.js'

test('PDF local usa URL do portal e PDF externo mantém o visualizador existente', () => {
  const origin = 'http://localhost:5173'
  assert.equal(pdfViewerUrl('/acervo/livro.pdf', origin), `${origin}/acervo/livro.pdf`)
  assert.equal(pdfViewerUrl('acervo/livro.pdf', origin), `${origin}/acervo/livro.pdf`)
  const remote = 'https://example.org/livro.pdf'
  assert.equal(pdfViewerUrl(remote, origin), `https://docs.google.com/viewer?url=${encodeURIComponent(remote)}&embedded=true`)
  for (const invalid of ['', 'http://[', 'javascript:alert(1)', 'data:text/html,example']) {
    assert.equal(pdfViewerUrl(invalid, origin), undefined)
  }
})

test('publicações em imagem são reconhecidas sem aceitar URLs executáveis', () => {
  const origin = 'http://localhost:5173'
  assert.equal(publicationImageUrl('/uploads/materia.PNG?versao=1', origin), `${origin}/uploads/materia.PNG?versao=1`)
  assert.equal(publicationImageUrl('https://example.org/materia.webp', origin), 'https://example.org/materia.webp')
  assert.equal(publicationImageUrl('/uploads/livro.pdf', origin), undefined)
  assert.equal(publicationImageUrl('javascript:alert(1)', origin), undefined)
})
