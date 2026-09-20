import { prisma } from '../db/prisma.js'
import { romano } from './mappers.js'

export async function findInicioCadeiras() {
  // Apenas os campos dos cartões; biografias e textos literários ficam no perfil.
  const rows = await prisma.cadeira.findMany({
    orderBy: { numero: 'asc' },
    select: { numero: true, patrono: { select: { nome: true } }, ocupacoes: {
      select: { vigente: true, inicioAno: true, academico: {
        select: { nome: true, fotoUrl: true, inMemoriam: true },
      } },
    } },
  })
  const items = rows.map(row => {
    const ocupacoes = [...row.ocupacoes].sort((a, b) => (a.inicioAno ?? 0) - (b.inicioAno ?? 0))
    const atual = ocupacoes.find(o => o.vigente)
    const ultimo = ocupacoes.at(-1)
    const membro = atual?.academico ?? (ultimo?.academico.inMemoriam ? ultimo.academico : undefined)
    return { number: romano(row.numero), patron: row.patrono.nome,
      holder: membro?.nome ?? 'Vaga', image: membro?.fotoUrl ?? '',
      status: atual ? 'Titular em exercício' : membro?.inMemoriam ? 'In memoriam' : 'Vaga',
    }
  }).filter(c => c.status !== 'Vaga').slice(0, 4)
  return { total: rows.length, items }
}

export async function findInicioAcervo() {
  const [total, rows] = await prisma.$transaction([
    prisma.acervoItem.count({ where: { status: 'PUBLICADO' } }),
    prisma.acervoItem.findMany({ where: { status: 'PUBLICADO' }, take: 3,
      orderBy: [{ ano: { sort: 'desc', nulls: 'last' } }, { titulo: 'asc' }],
      select: { id: true, titulo: true, edicao: true, ano: true, cor: true, autoriaTexto: true },
    }),
  ])
  return { total, items: rows.map(row => ({ id: row.id, title: row.titulo,
    tomo: row.edicao ?? '', year: row.ano?.toString() ?? '', color: row.cor, author: row.autoriaTexto ?? '',
  })) }
}

export async function findInicioNoticias() {
  const rows = await prisma.noticia.findMany({
    where: { status: 'PUBLICADO', publicadoEm: { lte: new Date() } }, take: 3,
    orderBy: [{ publicadoEm: 'desc' }, { id: 'desc' }],
    select: { id: true, titulo: true, publicadoEm: true },
  })
  return rows.map(row => ({ id: row.id, titulo: row.titulo,
    data: row.publicadoEm?.toLocaleDateString('pt-BR', {
      timeZone: 'America/Fortaleza', day: '2-digit', month: 'short', year: 'numeric',
    }).replaceAll(' de ', ' ').replace('.', '').toUpperCase() ?? '',
  }))
}
