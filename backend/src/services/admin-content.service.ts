import { prisma } from '../db/prisma.js'
import { Prisma, type RecursoAuditoria } from '@prisma/client'
import { AppError, ValidationError } from '../errors/app.error.js'
import * as v from './admin-validation.js'
import { deleteRecord } from '../repositories/admin-delete.repository.js'
import { syncEventoFoto } from '../repositories/evento-galeria.repository.js'
import { auditEditorial, type AuditActor } from './admin-audit.service.js'

export function noticiaInput(input: unknown) {
  const b = v.object(input)
  v.keys(b, ['titulo', 'categoria', 'lede', 'img', 'conteudo', 'status', 'publicadoEm'])
  const status = v.status(b.status)
  const publicadoEm = b.publicadoEm == null ? null : v.date(b.publicadoEm, 'publicadoEm')
  if (status === 'PUBLICADO' && !publicadoEm) throw new ValidationError('Informe publicadoEm para publicar a notícia.')
  return { titulo: v.text(b.titulo, 'titulo'), categoria: v.text(b.categoria, 'categoria', 100),
    lede: v.text(b.lede, 'lede', 2000), conteudo: v.text(b.conteudo, 'conteudo', 100000),
    img: v.mediaUrl(b.img, 'img', 'image'), status, publicadoEm }
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
    descricao: v.optionalText(b.descricao, 'descricao') ?? '', pdfUrl: v.mediaUrl(b.pdfUrl, 'pdfUrl', 'pdf', status === 'PUBLICADO'), status }
}
export function eventoInput(input: unknown) {
  const b = v.object(input)
  v.keys(b, ['titulo', 'tipo', 'inicioEm', 'fimEm', 'local', 'descricao', 'foto', 'status'])
  const inicioEm = v.date(b.inicioEm, 'inicioEm')
  const fimEm = b.fimEm == null ? null : v.date(b.fimEm, 'fimEm')
  if (fimEm && fimEm < inicioEm) throw new ValidationError('fimEm não pode preceder inicioEm.')
  return { titulo: v.text(b.titulo, 'titulo'), tipo: v.text(b.tipo, 'tipo', 100), inicioEm, fimEm,
    local: v.text(b.local, 'local', 500), descricao: v.optionalText(b.descricao, 'descricao') ?? '',
    foto: v.mediaUrl(b.foto, 'foto', 'image') || null, status: v.status(b.status) }
}

type EditorialRecord = { id: string | number; titulo: string; status: string }
async function createEditorial<T extends EditorialRecord, D extends object>(data: D, actor: AuditActor, recurso: RecursoAuditoria,
  create: (tx: Prisma.TransactionClient, data: D) => Promise<T>) {
  return prisma.$transaction(async tx => {
    const record = await create(tx, data)
    await auditEditorial(tx, actor, recurso, record, Object.keys(data))
    return record
  })
}

async function updateVersioned<T extends EditorialRecord, D extends object>(input: unknown, validate: (value: unknown) => D,
  actor: AuditActor, recurso: RecursoAuditoria, find: (tx: Prisma.TransactionClient) => Promise<T | null>,
  update: (tx: Prisma.TransactionClient, expected: Date, next: Date, data: D) => Promise<T>): Promise<T> {
  const { atualizadoEm, ...fields } = v.object(input)
  const expected = v.date(atualizadoEm, 'atualizadoEm')
  const data = validate(fields)
  // Mesmo dois salvamentos no mesmo milissegundo precisam de versões distintas.
  const next = new Date(Math.max(Date.now(), expected.getTime() + 1))
  try {
    return await prisma.$transaction(async tx => {
      const before = await find(tx)
      const record = await update(tx, expected, next, data)
      await auditEditorial(tx, actor, recurso, record, Object.keys(data), before)
      return record
    })
  }
  catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2025') throw error
    if (!await find(prisma)) throw new AppError('Registro não encontrado.', 404)
    throw new AppError('Este registro foi alterado por outra pessoa. Reabra a edição e confira as alterações antes de salvar.', 409)
  }
}

export const contentResources = {
  noticias: {
    list: (skip: number, take: number, q = '') => prisma.noticia.findMany({ skip, take, where: { OR: [{ titulo: search(q) }, { categoria: search(q) }] }, orderBy: { id: 'desc' } }),
    count: (q = '') => prisma.noticia.count({ where: { OR: [{ titulo: search(q) }, { categoria: search(q) }] } }),
    get: (id: string) => prisma.noticia.findUnique({ where: { id: noticiaId(id) } }),
    create: (b: unknown, actor: AuditActor) => createEditorial(noticiaInput(b), actor, 'NOTICIA', (tx, data) => tx.noticia.create({ data })),
    update: (id: string, b: unknown, actor: AuditActor) => updateVersioned(b, noticiaInput, actor, 'NOTICIA',
      tx => tx.noticia.findUnique({ where: { id: noticiaId(id) } }),
      (tx, expected, next, data) => tx.noticia.update({ where: { id: noticiaId(id), atualizadoEm: expected }, data: { ...data, atualizadoEm: next } })),
    delete: (id: string, actor: AuditActor) => deleteRecord('Noticia', noticiaId(id), actor),
  },
  acervo: {
    list: (skip: number, take: number, q = '') => prisma.acervoItem.findMany({ skip, take, where: { OR: [{ titulo: search(q) }, { autoriaTexto: search(q) }, { categoria: search(q) }] }, orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }] }),
    count: (q = '') => prisma.acervoItem.count({ where: { OR: [{ titulo: search(q) }, { autoriaTexto: search(q) }, { categoria: search(q) }] } }),
    get: (id: string) => prisma.acervoItem.findUnique({ where: { id } }),
    create: (b: unknown, actor: AuditActor) => createEditorial(acervoInput(b), actor, 'ACERVO', (tx, data) => tx.acervoItem.create({ data })),
    update: (id: string, b: unknown, actor: AuditActor) => updateVersioned(b, acervoInput, actor, 'ACERVO',
      tx => tx.acervoItem.findUnique({ where: { id } }),
      (tx, expected, next, data) => tx.acervoItem.update({ where: { id, atualizadoEm: expected }, data: { ...data, atualizadoEm: next } })),
    delete: deleteAcervo,
  },
  agenda: {
    list: (skip: number, take: number, q = '') => prisma.evento.findMany({ skip, take, where: { OR: [{ titulo: search(q) }, { tipo: search(q) }, { local: search(q) }] }, orderBy: [{ inicioEm: 'desc' }, { id: 'asc' }] }),
    count: (q = '') => prisma.evento.count({ where: { OR: [{ titulo: search(q) }, { tipo: search(q) }, { local: search(q) }] } }),
    get: (id: string) => prisma.evento.findUnique({ where: { id } }),
    create: (b: unknown, actor: AuditActor) => createEditorial(eventoInput(b), actor, 'EVENTO', async (tx, data) => {
      const evento = await tx.evento.create({ data })
      await syncEventoFoto(tx, evento)
      return evento
    }),
    update: (id: string, b: unknown, actor: AuditActor) => updateVersioned(b, eventoInput, actor, 'EVENTO',
      tx => tx.evento.findUnique({ where: { id } }),
      async (tx, expected, next, data) => {
        const evento = await tx.evento.update({ where: { id, atualizadoEm: expected }, data: { ...data, atualizadoEm: next } })
        await syncEventoFoto(tx, evento)
        return evento
      }),
    delete: deleteEvento,
  },
}
const search = (value: string) => ({ contains: value.trim().replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' as const })
function noticiaId(id: string) {
  if (!/^[1-9]\d*$/.test(id)) throw new ValidationError('ID de notícia inválido.')
  return v.integer(Number(id), 'id', 1, 2147483647)
}

async function deleteAcervo(id: string, actor: AuditActor) {
  await prisma.$transaction(async tx => {
    // Remove apenas os vínculos desta publicação; os acadêmicos são preservados.
    await tx.autoriaAcervo.deleteMany({ where: { acervoId: id } })
    await deleteRecord('AcervoItem', id, actor, tx)
  })
}

async function deleteEvento(id: string, actor: AuditActor) {
  // Não converte fotos do evento em fotos públicas órfãs. A exclusão é atômica.
  await prisma.$transaction(async tx => {
    await tx.galeriaFoto.deleteMany({ where: { eventoId: id } })
    await deleteRecord('Evento', id, actor, tx)
  })
}
