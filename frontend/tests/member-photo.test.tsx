import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import MemberPhotoFrame from '../src/components/MemberPhotoFrame'

test('cartão e perfil priorizam a foto cadastrada mesmo com retrato demonstrativo configurado', () => {
  for (const size of ['md', 'lg'] as const) {
    const html = renderToStaticMarkup(<MemberPhotoFrame src="/uploads/foto-real.png" alt="Retrato do titular" chairNumber="1" size={size} photoVariant="institutional-demo" />)
    assert.match(html, /src="\/uploads\/foto-real.png"/)
    assert.match(html, /alt="Retrato do titular"/)
    assert.doesNotMatch(html, /retrato-institucional-/)
  }
})

test('membro sem foto mantém o retrato demonstrativo e cadeira vaga mantém a apresentação existente', () => {
  const missing = renderToStaticMarkup(<MemberPhotoFrame alt="Titular" chairNumber="1" photoVariant="institutional-demo" />)
  assert.match(missing, /src="\/images\/membros\/retrato-institucional-01.png"/)
  assert.match(missing, /Fotografia do acadêmico não disponibilizada/)
  const vacant = renderToStaticMarkup(<MemberPhotoFrame src="/uploads/anterior.png" alt="Anterior" chairNumber="1" status="Vaga" photoVariant="institutional-demo" />)
  assert.match(vacant, /Cadeira Vaga/)
  assert.doesNotMatch(vacant, /<img/)
})
