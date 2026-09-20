import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { serve } from '../serve.js'

// Só permite execução pelo runner, em seu schema recém-criado.
const schema = process.env.INTEGRATION_SCHEMA ?? ''
assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
assert.equal(new URL(process.env.DATABASE_URL!).searchParams.get('schema'), schema)
const { prisma } = await import('../../src/db/prisma.js')
const { createApp } = await import('../../src/app.js')

test('API com migrations e PostgreSQL real', async t => {
  t.after(() => prisma.$disconnect())
  const url = await serve(t, createApp())
  const get = async (path: string, status = 200): Promise<any> => {
    const res = await fetch(url + '/api' + path)
    assert.equal(res.status, status, path)
    return res.json()
  }

  await t.test('banco recém-migrado fornece respostas vazias', async () => {
    for (const path of ['/cadeiras', '/eventos', '/eventos/galeria', '/noticias', '/acervo', '/inicio/noticias']) {
      assert.deepEqual(await get(path), [], path)
    }
    for (const path of ['/inicio/cadeiras', '/inicio/acervo']) {
      assert.deepEqual(await get(path), { total: 0, items: [] })
    }
    assert.deepEqual(await get('/instituicao'), { info: null, gestao: null })
  })

  const patrono = await prisma.patrono.create({ data: { nome: 'Patrono de teste' } })
  const fundador = await prisma.academico.create({ data: { nome: 'Fundador de teste' } })
  const titular = await prisma.academico.create({ data: {
    nome: 'Titular de teste', biografia: 'Biografia oficial',
    obras: { create: { titulo: 'Livro do titular', ano: '2020' } },
    producoes: { create: [
      { titulo: 'Poema público', tipo: 'poema', texto: 'Versos', status: 'PUBLICADO' },
      { titulo: 'Poema privado', tipo: 'poema', texto: 'Rascunho' },
    ] },
  } })
  await prisma.cadeira.create({ data: {
    numero: 1, patronoId: patrono.id, ocupacoes: { create: [
      { academicoId: fundador.id, fundador: true, inicioAno: 2000, fimAno: 2010 },
      { academicoId: titular.id, vigente: true, inicioAno: 2011 },
    ] },
  } })

  await t.test('cadeiras preservam sucessão, autoria e filtros', async () => {
    const cadeira = await get('/cadeiras/I')
    assert.deepEqual(cadeira, await get('/cadeiras/1'))
    assert.equal(cadeira.patron, patrono.nome)
    assert.equal(cadeira.holder, titular.nome)
    assert.equal(cadeira.founder, fundador.nome)
    assert.deepEqual(cadeira.sucessao.map((s: any) => s.nome), [fundador.nome, titular.nome])
    assert.equal(cadeira.obras[0].titulo, 'Livro do titular')
    assert.deepEqual(cadeira.producao.map((p: any) => p.titulo), ['Poema público'])
    assert.equal((await get('/cadeiras?q=TITULAR')).length, 1)
    assert.deepEqual(await get('/cadeiras?status=Vaga'), [])
    assert.deepEqual(await get('/cadeiras?search=inexistente'), [])
    assert.equal((await get('/inicio/cadeiras')).total, 1)
  })

  await t.test('notícias ocultam rascunhos, arquivadas e publicações futuras', async () => {
    const ids: number[] = []
    for (const [status, date] of [
      ['PUBLICADO', '2020-01-01'], ['RASCUNHO', '2020-01-01'],
      ['ARQUIVADO', '2020-01-01'], ['PUBLICADO', '2099-01-01'],
    ] as const) {
      const row = await prisma.noticia.create({ data: {
        titulo: 'Encontro literário', categoria: 'Cultura', lede: 'Resumo', img: '/imagem.jpg',
        conteudo: 'Texto oficial', status, publicadoEm: new Date(date),
      } })
      ids.push(row.id)
    }
    assert.deepEqual((await get('/noticias?categoria=cultura&q=LITERÁRIO')).map((n: any) => n.id), [ids[0]])
    assert.deepEqual(await get('/noticias?search=ausente'), [])
    assert.equal((await get(`/noticias/${ids[0]}`)).conteudo, 'Texto oficial')
    for (const id of ids.slice(1)) await get(`/noticias/${id}`, 404)
    assert.deepEqual((await get('/inicio/noticias')).map((n: any) => n.id), [ids[0]])
  })

  await t.test('eventos, galeria e acervo respeitam publicação e filtros', async () => {
    const eventos = []
    for (const status of ['PUBLICADO', 'RASCUNHO', 'ARQUIVADO'] as const) {
      eventos.push(await prisma.evento.create({ data: {
        titulo: 'Sarau', tipo: 'Sarau', inicioEm: new Date('2020-01-02T01:00:00Z'),
        local: 'Sede', descricao: 'Encontro', status,
        fotos: { create: { src: `/${status}.jpg`, legenda: status } },
      } }))
      await prisma.acervoItem.create({ data: {
        titulo: 'Memórias', categoria: 'Livro', descricao: 'História', pdfUrl: '/livro.pdf', status, ano: 2020,
      } })
    }
    await prisma.galeriaFoto.create({ data: { src: '/sede.jpg', legenda: 'Sede', ordem: -1 } })
    const lista = await get('/eventos?tipo=sarau')
    assert.deepEqual(lista.map((e: any) => e.id), [eventos[0].id])
    assert.equal(lista[0].data, '2020-01-01')
    assert.equal(lista[0].hora, '22h00')
    assert.deepEqual(await get(`/eventos/${eventos[0].id}`), lista[0])
    for (const e of eventos.slice(1)) await get(`/eventos/${e.id}`, 404)
    assert.deepEqual(await get('/eventos?tipo=ausente'), [])
    assert.deepEqual((await get('/eventos/galeria')).map((f: any) => f.src), ['/sede.jpg', '/PUBLICADO.jpg'])
    const acervo = await get('/acervo?tipo=livro&q=MEMÓRIAS')
    assert.equal(acervo.length, 1)
    assert.equal(acervo[0].pdf, '/livro.pdf')
    assert.deepEqual(await get('/acervo?search=ausente'), [])
    assert.equal((await get('/inicio/acervo')).total, 1)
  })

  await t.test('instituição seleciona gestão e mandatos vigentes', async () => {
    const ano = Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Fortaleza', year: 'numeric' }).format(new Date()))
    await prisma.instituicao.create({ data: { nome: 'Academia de teste', historia: 'História', missao: 'Missão' } })
    await prisma.gestao.create({ data: { inicioAno: ano - 3, fimAno: ano - 1 } })
    await prisma.gestao.create({ data: { inicioAno: ano + 1 } })
    await prisma.gestao.create({ data: {
      inicioAno: ano, fimAno: ano, mandatos: { create: [
        { academicoId: titular.id, cargo: 'Presidente', inicioEm: new Date(`${ano}-01-01`) },
        { academicoId: fundador.id, cargo: 'Anterior', fimEm: new Date(`${ano - 1}-12-31`) },
        { academicoId: fundador.id, cargo: 'Futuro', inicioEm: new Date(`${ano + 1}-01-01`) },
      ] },
    } })
    const result = await get('/instituicao')
    assert.equal(result.info.nome, 'Academia de teste')
    assert.deepEqual(result.gestao, {
      inicioAno: ano, fimAno: ano,
      diretoria: [{ cargo: 'Presidente', nome: titular.nome, posse: String(ano) }],
    })
  })

  await t.test('contato HTTP persiste e continua sem leitura pública', async () => {
    const res = await fetch(url + '/api/contato', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: ' Maria ', email: 'maria@example.com', mensagem: 'Consulta ao acervo.' }),
    })
    assert.equal(res.status, 201)
    const result = await res.json() as { id: string }
    const row = await prisma.contatoMensagem.findUniqueOrThrow({ where: { id: result.id } })
    assert.equal(row.nome, 'Maria')
    assert.equal(row.assunto, 'Geral')
    assert.equal(row.mensagem, 'Consulta ao acervo.')
    await get('/contato', 404)
  })

  await t.test('buscas e filtros com acentos funcionam em todos os campos pesquisados', async () => {
    for (const campo of ['titulo', 'lede', 'conteudo', 'categoria'] as const) {
      const row = await prisma.noticia.create({ data: {
        titulo: 'Teste', lede: 'Resumo', conteudo: 'Texto', categoria: 'Teste', img: '/teste.jpg',
        status: 'PUBLICADO', publicadoEm: new Date('2020-01-01'), [campo]: 'Ação e memória',
      } })
      const found = await get('/noticias?q=' + encodeURIComponent('AÇÃO E MEMÓRIA'))
      assert.ok(found.some((n: any) => n.id === row.id), campo)
      if (campo === 'categoria') {
        assert.ok((await get('/noticias?categoria=' + encodeURIComponent('AÇÃO E MEMÓRIA'))).some((n: any) => n.id === row.id))
      }
      assert.equal((await prisma.noticia.findUniqueOrThrow({ where: { id: row.id } }))[campo], 'Ação e memória')
    }
    for (const campo of ['titulo', 'autoriaTexto', 'descricao', 'edicao', 'categoria'] as const) {
      const row = await prisma.acervoItem.create({ data: {
        titulo: 'Teste', descricao: 'Texto', categoria: 'Teste', pdfUrl: '/teste.pdf',
        status: 'PUBLICADO', [campo]: 'Ação e memória',
      } })
      const param = campo === 'categoria' ? 'tipo' : 'q'
      assert.ok((await get(`/acervo?${param}=` + encodeURIComponent('AÇÃO E MEMÓRIA'))).some((a: any) => a.id === row.id), campo)
    }
    const evento = await prisma.evento.create({ data: {
      titulo: 'Teste', tipo: 'Sessão Solene', inicioEm: new Date('2020-01-01'),
      local: 'Sede', descricao: 'Texto', status: 'PUBLICADO',
    } })
    assert.ok((await get('/eventos?tipo=' + encodeURIComponent('SESSÃO SOLENE'))).some((e: any) => e.id === evento.id))
  })

  await t.test('restrições SQL impedem inconsistências e exclusão do histórico', async () => {
    const sql = await readFile(new URL('../constraints.sql', import.meta.url), 'utf8')
    // O bloco DO contém ponto e vírgula: executá-lo inteiro, sem dividir SQL genericamente.
    const start = sql.indexOf('DO $$')
    const end = sql.indexOf('END $$;') + 'END $$;'.length
    const rollback = new Error('rollback de fixtures')
    await assert.rejects(prisma.$transaction(async tx => {
      const inserts = sql.slice(sql.indexOf('BEGIN;') + 6, start).split(';').filter(s => s.trim())
      for (const insert of inserts) await tx.$executeRawUnsafe(insert)
      await tx.$executeRawUnsafe(sql.slice(start, end))
      throw rollback
    }), error => error === rollback)
    assert.equal(await prisma.patrono.findUnique({ where: { id: 'test-p' } }), null)
  })
})
