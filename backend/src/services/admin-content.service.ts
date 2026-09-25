import { prisma } from '../db/prisma.js'
import { Prisma } from '@prisma/client'
import { AppError, ValidationError } from '../errors/app.error.js'
import * as v from './admin-validation.js'

export function noticiaInput(input: unknown) {
  const b = v.object(input)
  v.keys(b, ['titulo', 'categoria', 'lede', 'img', 'conteudo', 'status', 'publicadoEm'])
  const status = v.status(b.status)
  const publicadoEm = b.publicadoEm == null ? null : v.date(b.publicadoEm, 'publicadoEm')
  if (status === 'PUBLICADO' && !publicadoEm) throw new ValidationError('Informe publicadoEm para publicar a notícia.')
  return { titulo: v.text(b.titulo, 'titulo'), categoria: v.text(b.categoria, 'categoria', 100),
    lede: v.text(b.lede, 'lede', 2000), conteudo: v.text(b.conteudo, 'conteudo', 100000),
    img: v.url(b.img, 'img'), status, publicadoEm }
}
export function acervoInput(input: unknown) {
  const b = v.object(input)
  v.keys(b, ['titulo', 'categoria', 'edicao', 'ano', 'cor', 'autoriaTexto', 'paginas', 'descricao', 'pdfUrl', 'status'])
  const status = v.status(b.status)
  const cor = b.cor === undefined ? 'navy' : v.text(b.cor, 'cor', 20)
  if (!['navy', 'ochre', 'ink'].includes(cor)) throw new ValidationError('Cor inválida.')
  return { titulo: v.text(b.titulo, 'titulo'), categoria: v.text(b.categoria, 'categoria', 100),
    edicao: v.optionalText(b.edicao, 'edicao', 200), ano: b.ano == null ? null : v.integer(b.ano, 'ano', 1, 9999), cor,
    autoriaTexto: v.optionalText(b.autoriaTexto, 'autoriaTexto', 1000), paginas: b.paginas == null ? null : v.integer(b.paginas, 'paginas', 1, 100000),
    descricao: v.optionalText(b.descricao, 'descricao') ?? '', pdfUrl: v.url(b.pdfUrl, 'pdfUrl', status === 'PUBLICADO'), status }
}
export function eventoInput(input: unknown) {
  const b = v.object(input)
  v.keys(b, ['titulo', 'tipo', 'inicioEm', 'fimEm', 'local', 'descricao', 'foto', 'status'])
  const inicioEm = v.date(b.inicioEm, 'inicioEm')
  const fimEm = b.fimEm == null ? null : v.date(b.fimEm, 'fimEm')
  if (fimEm && fimEm < inicioEm) throw new ValidationError('fimEm não pode preceder inicioEm.')
  return { titulo: v.text(b.titulo, 'titulo'), tipo: v.text(b.tipo, 'tipo', 100), inicioEm, fimEm,
    local: v.text(b.local, 'local', 500), descricao: v.optionalText(b.descricao, 'descricao') ?? '',
    foto: v.url(b.foto, 'foto') || null, status: v.status(b.status) }
}

async function updateVersioned<T, D>(input: unknown, validate: (value: unknown) => D,
  update: (expected: Date, next: Date, data: D) => Promise<T>, exists: () => Promise<unknown>): Promise<T> {
  const { atualizadoEm, ...fields } = v.object(input)
  const expected = v.date(atualizadoEm, 'atualizadoEm')
  const data = validate(fields)
  // Mesmo dois salvamentos no mesmo milissegundo precisam de versões distintas.
  const next = new Date(Math.max(Date.now(), expected.getTime() + 1))
  try { return await update(expected, next, data) }
  catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2025') throw error
    if (!await exists()) throw new AppError('Registro não encontrado.', 404)
    throw new AppError('Este registro foi alterado por outra pessoa. Reabra a edição e confira as alterações antes de salvar.', 409)
  }
}

export const contentResources = {
  noticias: {
    list: (skip: number, take: number, q = '') => prisma.noticia.findMany({ skip, take, where: { OR: [{ titulo: search(q) }, { categoria: search(q) }] }, orderBy: { id: 'desc' } }),
    count: (q = '') => prisma.noticia.count({ where: { OR: [{ titulo: search(q) }, { categoria: search(q) }] } }),
    get: (id: string) => prisma.noticia.findUnique({ where: { id: noticiaId(id) } }),
    create: (b: unknown) => prisma.noticia.create({ data: noticiaInput(b) }),
    update: (id: string, b: unknown) => updateVersioned(b, noticiaInput,
      (expected, next, data) => prisma.noticia.update({ where: { id: noticiaId(id), atualizadoEm: expected }, data: { ...data, atualizadoEm: next } }),
      () => prisma.noticia.findUnique({ where: { id: noticiaId(id) }, select: { id: true } })),
  },
  acervo: {
    list: (skip: number, take: number, q = '') => prisma.acervoItem.findMany({ skip, take, where: { OR: [{ titulo: search(q) }, { autoriaTexto: search(q) }, { categoria: search(q) }] }, orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }] }),
    count: (q = '') => prisma.acervoItem.count({ where: { OR: [{ titulo: search(q) }, { autoriaTexto: search(q) }, { categoria: search(q) }] } }),
    get: (id: string) => prisma.acervoItem.findUnique({ where: { id } }),
    create: (b: unknown) => prisma.acervoItem.create({ data: acervoInput(b) }),
    update: (id: string, b: unknown) => updateVersioned(b, acervoInput,
      (expected, next, data) => prisma.acervoItem.update({ where: { id, atualizadoEm: expected }, data: { ...data, atualizadoEm: next } }),
      () => prisma.acervoItem.findUnique({ where: { id }, select: { id: true } })),
  },
  agenda: {
    list: (skip: number, take: number, q = '') => prisma.evento.findMany({ skip, take, where: { OR: [{ titulo: search(q) }, { tipo: search(q) }, { local: search(q) }] }, orderBy: [{ inicioEm: 'desc' }, { id: 'asc' }] }),
    count: (q = '') => prisma.evento.count({ where: { OR: [{ titulo: search(q) }, { tipo: search(q) }, { local: search(q) }] } }),
    get: (id: string) => prisma.evento.findUnique({ where: { id } }),
    create: (b: unknown) => prisma.evento.create({ data: eventoInput(b) }),
    update: (id: string, b: unknown) => updateVersioned(b, eventoInput,
      (expected, next, data) => prisma.evento.update({ where: { id, atualizadoEm: expected }, data: { ...data, atualizadoEm: next } }),
      () => prisma.evento.findUnique({ where: { id }, select: { id: true } })),
  },
}
const search = (value: string) => ({ contains: value.trim().replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' as const })
function noticiaId(id: string) {
  if (!/^[1-9]\d*$/.test(id)) throw new ValidationError('ID de notícia inválido.')
  return v.integer(Number(id), 'id', 1, 2147483647)
}

export async function deleteEvento(id: string) {
  // Não converte fotos do evento em fotos públicas órfãs. A exclusão é atômica.
  await prisma.$transaction(async tx => {
    const event = await tx.evento.findUnique({ where: { id } })
    if (!event) throw new AppError('Evento não encontrado.', 404)
    await tx.galeriaFoto.deleteMany({ where: { eventoId: id } })
    await tx.evento.delete({ where: { id } })
  })
}
