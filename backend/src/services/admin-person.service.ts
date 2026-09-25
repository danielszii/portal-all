import type { Prisma } from '@prisma/client'
import { AppError, ValidationError } from '../errors/app.error.js'
import { foldSearch } from '../repositories/catalog-query.js'

export type PersonRole = 'academico' | 'fundador' | 'patrono'
export const normalizePersonName = (name: string) => foldSearch(name.trim().replace(/\s+/gu, ' '))

export class PersonConflict extends AppError {
  constructor(public readonly role: PersonRole, public readonly candidates: { id: string; nome: string; descricao: string }[]) {
    super('Já existem pessoas com este nome. Selecione o cadastro correto ou confirme que é outra pessoa.', 409)
  }
}

export function confirmedHomonyms(value: unknown): PersonRole[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 3 || value.some(role => !['academico', 'fundador', 'patrono'].includes(role))) {
    throw new ValidationError('Confirmação de homônimos inválida.')
  }
  return value as PersonRole[]
}

export async function lockPersonNames(tx: Prisma.TransactionClient, names: { role: PersonRole; nome: string }[]) {
  // Todas as reservas seguem a mesma ordem, inclusive entre cadeiras diferentes.
  const keys = [...new Set(names.map(p => `${p.role === 'patrono' ? 'patrono' : 'academico'}:${normalizePersonName(p.nome)}`))].sort()
  for (const key of keys) await tx.$executeRaw`SELECT pg_advisory_xact_lock(230924, hashtext(${key}))`
}

export async function checkPersonName(tx: Prisma.TransactionClient, role: PersonRole, name: string, confirmations: PersonRole[]) {
  if (confirmations.includes(role)) return
  // Busca só identificadores e nomes; biografias são lidas apenas dos candidatos.
  const names = role === 'patrono'
    ? await tx.patrono.findMany({ select: { id: true, nome: true } })
    : await tx.academico.findMany({ select: { id: true, nome: true } })
  const ids = names.filter(p => normalizePersonName(p.nome) === normalizePersonName(name)).map(p => p.id)
  if (!ids.length) return
  const candidates = role === 'patrono'
    ? (await tx.patrono.findMany({ where: { id: { in: ids } }, include: { cadeiras: { select: { numero: true } } }, orderBy: { id: 'asc' } }))
      .map(p => ({ id: p.id, nome: p.nome, descricao: [p.biografia?.slice(0, 300), p.cadeiras.map(c => `Cadeira ${c.numero}`).join(', ')].filter(Boolean).join(' · ') }))
    : (await tx.academico.findMany({ where: { id: { in: ids } }, include: { ocupacoes: { include: { cadeira: { select: { numero: true } } } } }, orderBy: { id: 'asc' } }))
      .map(p => ({ id: p.id, nome: p.nome, descricao: [p.biografia?.slice(0, 300), p.inMemoriam ? 'In memoriam' : '',
        p.ocupacoes.map(o => `Cadeira ${o.cadeira.numero}${o.vigente ? ' (titular atual)' : ' (histórico)'}`).join(', ')].filter(Boolean).join(' · ') }))
  throw new PersonConflict(role, candidates)
}
