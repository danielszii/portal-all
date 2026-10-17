import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { AppError, ValidationError } from '../errors/app.error.js'
import { defaultPortalContent } from '../domain/portal-content.js'
import { changedFields, recordAudit, type AuditActor } from './admin-audit.service.js'
import * as v from './admin-validation.js'

const fields = ['heroSlides', 'heroImagem', 'inicioTitulo', 'inicioTexto', 'academiaIntroducao', 'cadeirasIntroducao', 'acervoIntroducao', 'agendaIntroducao', 'agendaAviso', 'noticiasIntroducao', 'contatoIntroducao', 'contatoAssuntos'] as const

function stringList(value: unknown, name: string, maxItems: number, maxLength: number) {
  if (!Array.isArray(value) || value.length < 1 || value.length > maxItems) throw new ValidationError(`${name}: informe de 1 a ${maxItems} itens.`)
  return value.map((item, index) => v.text(item, `${name}[${index}]`, maxLength))
}

export function portalInput(input: unknown) {
  const b = v.object(input)
  v.keys(b, [...fields, 'atualizadoEm'])
  if (!Array.isArray(b.heroSlides) || b.heroSlides.length < 1 || b.heroSlides.length > 8) throw new ValidationError('heroSlides: informe de 1 a 8 destaques.')
  const heroSlides = b.heroSlides.map((item, index) => {
    const slide = v.object(item); v.keys(slide, ['title', 'emphasis', 'description'])
    return { title: v.text(slide.title, `heroSlides[${index}].title`, 120), emphasis: v.text(slide.emphasis, `heroSlides[${index}].emphasis`, 120), description: v.text(slide.description, `heroSlides[${index}].description`, 500) }
  })
  return {
    heroSlides, heroImagem: v.mediaUrl(b.heroImagem, 'heroImagem', 'image') || null,
    inicioTitulo: v.text(b.inicioTitulo, 'inicioTitulo', 200), inicioTexto: v.text(b.inicioTexto, 'inicioTexto', 1000),
    academiaIntroducao: v.text(b.academiaIntroducao, 'academiaIntroducao', 2000), cadeirasIntroducao: v.text(b.cadeirasIntroducao, 'cadeirasIntroducao', 2000),
    acervoIntroducao: v.text(b.acervoIntroducao, 'acervoIntroducao', 2000), agendaIntroducao: v.text(b.agendaIntroducao, 'agendaIntroducao', 2000),
    agendaAviso: v.text(b.agendaAviso, 'agendaAviso', 2000), noticiasIntroducao: v.text(b.noticiasIntroducao, 'noticiasIntroducao', 2000),
    contatoIntroducao: v.text(b.contatoIntroducao, 'contatoIntroducao', 2000), contatoAssuntos: stringList(b.contatoAssuntos, 'contatoAssuntos', 20, 100),
  }
}

export async function getPortalContent() {
  return await prisma.configuracaoPortal.findUnique({ where: { id: 'portal' } }) ?? { id: 'portal', ...defaultPortalContent, atualizadoEm: null }
}

export async function savePortalContent(input: unknown, actor: AuditActor) {
  const b = v.object(input), data = portalInput(b)
  const expected = b.atualizadoEm === null ? null : v.date(b.atualizadoEm, 'atualizadoEm')
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(261017, 1)`
    const before = await tx.configuracaoPortal.findUnique({ where: { id: 'portal' } })
    if (before && (!expected || before.atualizadoEm.getTime() !== expected.getTime())) throw new AppError('A configuração foi alterada. Recarregue antes de salvar.', 409)
    if (!before && expected) throw new AppError('Configuração não encontrada.', 404)
    const next = new Date(Math.max(Date.now(), (before?.atualizadoEm.getTime() ?? 0) + 1))
    const saved = before
      ? await tx.configuracaoPortal.update({ where: { id: 'portal', atualizadoEm: expected! }, data: { ...data, atualizadoEm: next } })
      : await tx.configuracaoPortal.create({ data: { id: 'portal', ...data, atualizadoEm: next } })
    await recordAudit(tx, actor, { acao: before ? 'EDITAR' : 'CRIAR', recurso: 'PORTAL', registroId: 'portal', resumo: `${before ? 'EDITAR' : 'CRIAR'}: configuração do portal`, detalhes: { camposAlterados: changedFields(before ?? {}, saved, fields) } })
    return saved
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
