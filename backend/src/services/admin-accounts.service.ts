import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { AppError, ValidationError } from '../errors/app.error.js'
import { adminProfiles, validProfiles } from '../domain/admin-permissions.js'
import { parsePagination } from '../repositories/catalog-query.js'
import { hashPassword } from './admin-auth.service.js'
import { recordAudit, type AuditActor } from './admin-audit.service.js'
import * as v from './admin-validation.js'

const accountSelect = { id: true, email: true, ativo: true, perfis: true, criadoEm: true, atualizadoEm: true } satisfies Prisma.AdministradorSelect
const cliActor: AuditActor = { id: 'operador-cli', email: 'operador-cli@local.invalid' }

function profiles(value: unknown) {
  if (!validProfiles(value)) throw new ValidationError('Escolha ao menos um perfil válido, sem repetições.')
  return adminProfiles.filter(profile => value.includes(profile))
}
function password(value: unknown) {
  if (typeof value !== 'string') throw new ValidationError('Informe uma senha válida.')
  return value // Espaços fazem parte da senha.
}
async function authorizeChange(tx: Prisma.TransactionClient, actor: AuditActor | null) {
  // Serializa também alterações em contas diferentes, protegendo o último administrador.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(718460021)`
  if (!actor) return // Uso exclusivo da CLI local; rotas HTTP sempre fornecem o ator autenticado.
  const current = await tx.administrador.findUnique({ where: { id: actor.id } })
  if (!current?.ativo || !current.perfis.includes('ADMINISTRADOR')) throw new AppError('Permissão administrativa revogada.', 403)
}

export async function listAccounts(query: Record<string, unknown>) {
  v.keys(query, ['page', 'pageSize'])
  const { page, pageSize } = parsePagination(query, 20) ?? { page: 1, pageSize: 20 }
  return prisma.$transaction(async tx => {
    const total = await tx.administrador.count()
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(page, totalPages)
    const items = await tx.administrador.findMany({ select: accountSelect, orderBy: [{ email: 'asc' }, { id: 'asc' }], skip: (current - 1) * pageSize, take: pageSize })
    return { items, total, totalPages, page: current, pageSize }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}

export async function createAccount(input: unknown, actor: AuditActor | null, options: { allowShortPassword?: boolean } = {}) {
  const body = v.object(input)
  v.keys(body, ['email', 'password', 'perfis'])
  const email = v.email(body.email)
  const perfis = profiles(body.perfis)
  const senhaHash = await hashPassword(password(body.password), options)
  return prisma.$transaction(async tx => {
    await authorizeChange(tx, actor)
    const account = await tx.administrador.create({ data: { email, perfis, senhaHash }, select: accountSelect })
    await recordAudit(tx, actor ?? cliActor, { acao: 'CRIAR', recurso: 'ADMINISTRADOR', registroId: account.id,
      resumo: `Conta criada: ${email}`, detalhes: { perfisAtuais: perfis, ativoAtual: true } })
    return account
  })
}

export async function editAccount(id: string, input: unknown, actor: AuditActor | null, options: { allowShortPassword?: boolean } = {}) {
  const body = v.object(input)
  v.keys(body, ['perfis', 'ativo', 'atualizadoEm', 'password'])
  const perfis = profiles(body.perfis)
  if (typeof body.ativo !== 'boolean') throw new ValidationError('Informe se a conta está ativa.')
  const ativo = body.ativo
  const version = v.date(body.atualizadoEm, 'atualizadoEm')
  const senhaHash = body.password === undefined ? undefined : await hashPassword(password(body.password), options)
  return prisma.$transaction(async tx => {
    await authorizeChange(tx, actor)
    const previous = await tx.administrador.findUnique({ where: { id }, select: accountSelect })
    if (!previous) throw new AppError('Conta não encontrada.', 404)
    if (previous.atualizadoEm.getTime() !== version.getTime()) throw new AppError('Esta conta foi alterada. Recarregue antes de salvar.', 409)
    if (previous.ativo && previous.perfis.includes('ADMINISTRADOR') && (!ativo || !perfis.includes('ADMINISTRADOR'))) {
      const others = await tx.administrador.count({ where: { id: { not: id }, ativo: true, perfis: { has: 'ADMINISTRADOR' } } })
      if (!others) throw new AppError('Mantenha ao menos um administrador geral ativo.', 409)
    }
    const rolesChanged = JSON.stringify([...previous.perfis].sort()) !== JSON.stringify([...perfis].sort())
    const fields = [...(rolesChanged ? ['perfis'] : []), ...(ativo !== previous.ativo ? ['ativo'] : []), ...(senhaHash ? ['senha'] : [])]
    if (!fields.length) return previous
    const account = await tx.administrador.update({ where: { id }, data: { perfis, ativo, ...(senhaHash && { senhaHash }),
      atualizadoEm: new Date(Math.max(Date.now(), previous.atualizadoEm.getTime() + 1)) }, select: accountSelect })
    await tx.sessaoAdmin.deleteMany({ where: { administradorId: id } })
    await recordAudit(tx, actor ?? cliActor, { acao: 'EDITAR', recurso: 'ADMINISTRADOR', registroId: id,
      resumo: `Conta atualizada: ${account.email}`, detalhes: { camposAlterados: fields,
        perfisAnteriores: previous.perfis, perfisAtuais: perfis, ativoAnterior: previous.ativo, ativoAtual: ativo } })
    return account
  })
}
