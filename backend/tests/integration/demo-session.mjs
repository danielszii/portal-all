// Teste manual em banco exclusivo: DATABASE_URL=.../portal_all_test node este-arquivo SQL
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'
import { importDemo, removeDemo } from '../../prisma/demo-session.mjs'

assert.match(new URL(process.env.DATABASE_URL).pathname, /test/)
const db = new PrismaClient()
try {
  assert.equal(await db.patrono.count(), 0, 'Teste exige banco vazio.')
  await db.patrono.create({ data: { id: 'teste-patrono-001', nome: 'Registro preexistente preservado' } })
  const imported = await importDemo(db, process.argv[2])
  assert.equal(imported.inserted.length, 14)
  assert.equal((await importDemo(db, process.argv[2])).inserted.length, 0)
  assert.equal((await removeDemo(db, imported.id)).applied, false)
  assert.equal(await db.noticia.count(), 1)
  const news = await db.noticia.findFirstOrThrow()
  await db.$executeRaw`UPDATE public."Noticia" SET conteudo = 'Alterado após importar' WHERE id = ${news.id}`
  await assert.rejects(removeDemo(db, imported.id, true), /alterado/)
  assert.equal(await db.contatoMensagem.count(), 1, 'Falha deve reverter todas as exclusões.')
  await db.$executeRaw`UPDATE public."Noticia" SET conteudo = ${news.conteudo} WHERE id = ${news.id}`
  await db.obra.create({ data: { id: 'obra-posterior', academicoId: 'teste-academico-001', titulo: 'Obra posterior' } })
  await assert.rejects(removeDemo(db, imported.id, true))
  assert.equal(await db.noticia.count(), 1, 'Novas referências impedem a remoção integral.')
  await db.obra.delete({ where: { id: 'obra-posterior' } })
  assert.equal((await removeDemo(db, imported.id, true)).applied, true)
  assert.equal(await db.noticia.count(), 0)
  assert.equal(await db.academico.count(), 0)
  assert.equal((await db.patrono.findUniqueOrThrow({ where: { id: 'teste-patrono-001' } })).nome, 'Registro preexistente preservado')
  assert.equal((await removeDemo(db, imported.id, true)).alreadyRemoved, true)
  console.log('PASSOU: importação, repetição, prévia, preservação de existentes, bloqueio de alterações e referências, remoção e repetição da remoção.')
} finally { await db.$disconnect() }
