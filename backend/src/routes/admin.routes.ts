import { Router, raw, json, type RequestHandler, type ErrorRequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { createRequestLimit } from '../middlewares/contato-limit.middleware.js'
import { cookieName, cookieOptions, requireAdmin, requireOrigin } from '../middlewares/admin-auth.middleware.js'
import { login } from '../services/admin-auth.service.js'
import { contentResources, deleteEvento } from '../services/admin-content.service.js'
import { adminCadeiraInclude, CadeiraConflict, createOrReplaceCadeira, editCadeira, endOcupacao } from '../services/admin-cadeiras.service.js'
import { saveUpload } from '../services/admin-upload.service.js'
import { parsePagination } from '../repositories/catalog-query.js'
import { numeroCadeira } from '../repositories/mappers.js'
import { AppError, ValidationError } from '../errors/app.error.js'
import * as v from '../services/admin-validation.js'
import { PersonConflict } from '../services/admin-person.service.js'

const router = Router()
const handle = (fn: RequestHandler): RequestHandler => (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next) }
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next() })
router.post('/auth/login', createRequestLimit({ limit: 5, windowMs: 15 * 60_000, skipSuccessfulRequests: true }), requireOrigin, json({ limit: '4kb' }), handle(async (req, res) => {
  const b = v.object(req.body)
  v.keys(b, ['email', 'password', 'remember'])
  // Preserve spaces in passwords; unlike display text they are significant.
  if (typeof b.password !== 'string' || !b.password.length || b.password.length > 128) throw new ValidationError('Senha inválida.')
  const remember = v.bool(b.remember)
  const result = await login(v.email(b.email), b.password, remember)
  res.cookie(cookieName, result.token, { ...cookieOptions, ...(remember ? { maxAge: result.maxAge } : {}) })
  res.json({ user: result.user, csrfToken: result.csrfToken, expiraEm: new Date(Date.now() + result.maxAge) })
}))
router.use(requireAdmin)
router.get('/auth/me', (_req, res) => {
  const current = res.locals.adminSession
  res.json({ user: { id: current.administrador.id, email: current.administrador.email }, csrfToken: current.csrfToken, expiraEm: current.expiraEm })
})
router.post('/auth/logout', handle(async (_req, res) => {
  await prisma.sessaoAdmin.deleteMany({ where: { tokenHash: res.locals.adminSession.tokenHash } })
  res.clearCookie(cookieName, cookieOptions)
  res.status(204).end()
}))
// Auth/CSRF and the limit run before reading uploaded files or larger JSON bodies.
const writeLimit = createRequestLimit({ limit: 60, windowMs: 60_000 })
router.use((req, res, next) => ['GET', 'HEAD'].includes(req.method) ? next() : writeLimit(req, res, next))
router.post('/uploads', raw({ type: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'], limit: '10mb' }), handle(async (req, res) => {
  res.status(201).json(await saveUpload(req.body, (req.get('content-type') ?? '').split(';')[0].toLowerCase()))
}))
router.use(json({ limit: '256kb' }))

for (const [name, resource] of Object.entries(contentResources)) {
  router.get(`/${name}`, handle(async (req, res) => {
    const { page, pageSize } = parsePagination(req.query) ?? { page: 1, pageSize: 20 }
    const q = typeof req.query.q === 'string' ? req.query.q : ''
    const total = await resource.count(q)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(page, totalPages)
    const items = await resource.list((current - 1) * pageSize, pageSize, q)
    res.json({ items, total, page: current, pageSize, totalPages })
  }))
  router.get(`/${name}/:id`, handle(async (req, res) => {
    const item = await resource.get(v.text(req.params.id, 'id', 100))
    if (!item) throw new AppError('Registro não encontrado.', 404)
    res.json(item)
  }))
  router.post(`/${name}`, handle(async (req, res) => { res.status(201).json(await resource.create(req.body)) }))
  router.put(`/${name}/:id`, handle(async (req, res) => { res.json(await resource.update(v.text(req.params.id, 'id', 100), req.body)) }))
}
router.delete('/agenda/:id', handle(async (req, res) => {
  await deleteEvento(v.text(req.params.id, 'id', 100))
  res.status(204).end()
}))
router.get('/cadeiras', handle(async (req, res) => {
  const { page, pageSize } = parsePagination(req.query) ?? { page: 1, pageSize: 20 }
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const term = { contains: q.replace(/[\\%_]/g, '\\$&'), mode: 'insensitive' as const }
  const number = numeroCadeira(q)
  const where: Prisma.CadeiraWhereInput = q ? { OR: [
    { patrono: { nome: term } }, { ocupacoes: { some: { academico: { nome: term } } } },
    ...(number ? [{ numero: number }] : []),
  ] } : {}
  const total = await prisma.cadeira.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, totalPages)
  const items = await prisma.cadeira.findMany({ where, skip: (current - 1) * pageSize, take: pageSize, orderBy: { numero: 'asc' }, include: adminCadeiraInclude })
  res.json({ items, total, page: current, pageSize, totalPages })
}))
function chairNumber(value: unknown) {
  const numero = numeroCadeira(v.text(value, 'numero', 15))
  if (!numero) throw new ValidationError('Número de cadeira inválido.')
  return numero
}
router.get('/cadeiras/:numero', handle(async (req, res) => {
  const value = await prisma.cadeira.findUnique({ where: { numero: chairNumber(req.params.numero) }, include: adminCadeiraInclude })
  if (!value) throw new AppError('Cadeira não encontrada.', 404)
  res.json(value)
}))
router.post('/cadeiras', handle(async (req, res) => {
  const result = await createOrReplaceCadeira(req.body)
  res.status(result.created ? 201 : 200).json(result.cadeira)
}))
router.put('/cadeiras/:numero', handle(async (req, res) => { res.json(await editCadeira(chairNumber(req.params.numero), req.body)) }))
router.post('/cadeiras/:numero/encerrar', handle(async (req, res) => { res.json(await endOcupacao(chairNumber(req.params.numero), req.body)) }))
// Lookup de pessoas existentes evita duplicações durante cadastro de cadeiras.
for (const name of ['academicos', 'patronos'] as const) {
  router.get(`/${name}`, handle(async (req, res) => {
    const { page, pageSize } = parsePagination(req.query) ?? { page: 1, pageSize: 20 }
    const where = typeof req.query.q === 'string' ? { nome: { contains: req.query.q, mode: 'insensitive' as const } } : {}
    const args = { where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { nome: 'asc' as const } }
    const [items, total] = name === 'academicos'
      ? await Promise.all([prisma.academico.findMany(args), prisma.academico.count({ where })])
      : await Promise.all([prisma.patrono.findMany(args), prisma.patrono.count({ where })])
    res.json({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) })
  }))
}
const adminErrors: ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof PersonConflict) {
    res.status(409).json({ error: error.message, code: 'CONFIRMACAO_PESSOA', role: error.role, candidates: error.candidates })
  } else if (error instanceof CadeiraConflict) {
    res.status(409).json({ error: error.message, code: 'CONFIRMACAO_CADEIRA', cadeira: error.cadeira, ocupacaoAtualId: error.ocupacaoAtualId })
  } else if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2003', 'P2025', 'P2034', 'P2004'].includes(error.code)) {
    res.status(error.code === 'P2025' ? 404 : 409).json({ error: 'Registro inexistente ou conflito com os dados atuais. Recarregue e confira os dados.' })
  } else next(error)
}
router.use(adminErrors)
export default router
