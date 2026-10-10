import { adminRequest, type AdminPage, type PersonRecord } from './admin.js'
import { invalidateInstituicao } from './api.js'

export type AdminMandato = {
  id: string
  academicoId: string
  cargo: string
  inicioEm: string | null
  fimEm: string | null
  academico: Pick<PersonRecord, 'id' | 'nome' | 'inMemoriam'>
}

export type AdminGestao = {
  id: string
  inicioAno: number
  fimAno: number | null
  atualizadoEm: string
  mandatos: AdminMandato[]
}

export type AdminGestaoSummary = Omit<AdminGestao, 'mandatos'> & { _count: { mandatos: number } }

export const loadGestoes = (signal?: AbortSignal) =>
  adminRequest<AdminPage<AdminGestaoSummary>>('/gestoes?page=1&pageSize=50', { signal })

export const loadGestao = (id: string, signal?: AbortSignal) =>
  adminRequest<AdminGestao>(`/gestoes/${encodeURIComponent(id)}`, { signal })

export const loadAcademicosForBoard = (signal?: AbortSignal) =>
  adminRequest<AdminPage<PersonRecord>>('/academicos?page=1&pageSize=50', { signal })

export async function saveGestao(values: { inicioAno: number; fimAno: number | null }, csrfToken: string, current?: AdminGestao) {
  const result = await adminRequest<AdminGestao>(current ? `/gestoes/${encodeURIComponent(current.id)}` : '/gestoes', {
    method: current ? 'PUT' : 'POST', csrfToken,
    body: current ? { ...values, atualizadoEm: current.atualizadoEm } : values,
  })
  invalidateInstituicao()
  return result
}

export async function removeGestao(current: AdminGestao, csrfToken: string) {
  await adminRequest<void>(`/gestoes/${encodeURIComponent(current.id)}`, {
    method: 'DELETE', csrfToken, body: { atualizadoEm: current.atualizadoEm },
  })
  invalidateInstituicao()
}

type MandatoValues = { academicoId: string; cargo: string; inicioEm: string | null; fimEm: string | null }

export async function saveMandato(gestao: AdminGestao, values: MandatoValues, csrfToken: string, mandatoId?: string) {
  const suffix = mandatoId ? `/${encodeURIComponent(mandatoId)}` : ''
  const result = await adminRequest<AdminGestao>(`/gestoes/${encodeURIComponent(gestao.id)}/mandatos${suffix}`, {
    method: mandatoId ? 'PUT' : 'POST', csrfToken, body: { ...values, atualizadoEm: gestao.atualizadoEm },
  })
  invalidateInstituicao()
  return result
}

export async function removeMandato(gestao: AdminGestao, mandatoId: string, csrfToken: string) {
  const result = await adminRequest<AdminGestao>(`/gestoes/${encodeURIComponent(gestao.id)}/mandatos/${encodeURIComponent(mandatoId)}`, {
    method: 'DELETE', csrfToken, body: { atualizadoEm: gestao.atualizadoEm },
  })
  invalidateInstituicao()
  return result
}
