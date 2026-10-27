import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import FormattedText from '../src/components/FormattedText'

test('formata negrito e itálico preservando tabulações, quebras e texto HTML como texto', () => {
  const html = renderToStaticMarkup(<FormattedText text={'\tOlá **mundo**\n\n*texto* <script>alert(1)</script>'} />)
  assert.match(html, /\tOlá <strong>mundo<\/strong>\n\n<em>texto<\/em>/)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
})
