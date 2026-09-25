import type { Cadeira, Evento, GaleriaFoto, Noticia, AcervoItem, ContatoForm, SearchPage } from '@/types'

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, { ...init, signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(typeof body?.error === 'string' ? body.error : 'Não foi possível acessar o servidor. Tente novamente.', res.status)
  }
  return res.json() as Promise<T>
}
const query = (params: Record<string, string | undefined>) => {
  const result = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value?.trim()) result.set(key, value.trim())
  return result.toString()
}
export const fetchCadeiras = (status?: string, q?: string, signal?: AbortSignal) => request<Cadeira[]>(`/cadeiras?${query({ status, q })}`, { signal })
export async function fetchCadeiraByNumber(numero: string, signal?: AbortSignal): Promise<Cadeira | null> {
  try { return await request<Cadeira>(`/cadeiras/${encodeURIComponent(numero)}`, { signal }) }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error }
}
export const fetchEventos = (tipo?: string, signal?: AbortSignal) => request<Evento[]>(`/eventos?${query({ tipo })}`, { signal })
export const fetchGaleria = (signal?: AbortSignal) => request<GaleriaFoto[]>('/eventos/galeria', { signal })
export async function fetchNoticiaById(id: number, signal?: AbortSignal): Promise<Noticia | null> {
  try { return await request<Noticia>(`/noticias/${id}`, { signal }) }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error }
}
export const emptySearchPage: SearchPage = { cadeiras: [], noticias: [], acervo: [], page: 0, totalPages: 1 }
export const fetchSearchPage = (q: string, page: number, signal?: AbortSignal) => request<SearchPage>(`/busca?${query({ q, page: String(page), pageSize: '30' })}`, { signal })
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number; totalPages: number }
export const emptyPage = <T>(): Page<T> => ({ items: [], total: 0, page: 1, pageSize: 12, totalPages: 1 })
export const fetchNoticiasPage = (page: number, categoria?: string, q?: string, signal?: AbortSignal) => request<Page<Noticia>>(`/noticias?${query({ page: String(page), pageSize: '10', categoria, q, resumo: 'true' })}`, { signal })
export const fetchAcervoPage = (page: number, tipo?: string, q?: string, signal?: AbortSignal) => request<Page<AcervoItem>>(`/acervo?${query({ page: String(page), pageSize: '8', tipo, q })}`, { signal })
export const fetchAcervoById = (id: string, signal?: AbortSignal) => request<AcervoItem>(`/acervo/${encodeURIComponent(id)}`, { signal })
export const postContato = (dados: ContatoForm) => request<{ sucesso: boolean; mensagem: string; id: string }>('/contato', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) })

export type InstituicaoResponse = {
  info: { nome: string; historia: string; missao: string; endereco: string | null; email: string | null; telefone: string | null; fundacaoAno: number | null; sedeTexto: string | null; trajetoriaTexto: string | null; horarioAtendimento: string | null } | null
  gestao: { inicioAno: number; fimAno: number | null; diretoria: { cargo: string; nome: string; posse: string }[] } | null
}
export const fetchInstituicao = (signal?: AbortSignal) => request<InstituicaoResponse>('/instituicao', { signal })

type InicioCadeira = Pick<Cadeira, 'number' | 'patron' | 'holder' | 'image' | 'status'>
type InicioAcervo = Pick<AcervoItem, 'id' | 'title' | 'tomo' | 'year' | 'color' | 'author'>
export const fetchInicioCadeiras = (signal: AbortSignal) => request<{ total: number; items: InicioCadeira[] }>('/inicio/cadeiras', { signal })
export const fetchInicioAcervo = (signal: AbortSignal) => request<{ total: number; items: InicioAcervo[] }>('/inicio/acervo', { signal })
export const fetchInicioNoticias = (signal: AbortSignal) => request<Pick<Noticia, 'id' | 'titulo' | 'data'>[]>('/inicio/noticias', { signal })
