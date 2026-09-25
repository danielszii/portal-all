import { situacaoCadeira } from '../../../backend/src/domain/ocupacoes.js'

export type AdminResource = 'noticias' | 'acervo' | 'agenda' | 'cadeiras'
export type AdminPage<T> = { items: T[]; total: number; page: number; pageSize: number; totalPages: number }
export type Pessoa = { id: string; nome: string; biografia: string | null; fotoUrl: string | null; bioExtra?: string | null; inMemoriam?: boolean }
export type CadeiraAdmin = {
  id: string; numero: number; patrono: Pessoa
  ocupacoes: { id: string; academicoId: string; vigente: boolean; fundador: boolean; inicioEm: string | null; inicioAno: number | null; fimEm?: string | null; fimAno?: number | null; academico: Pessoa }[]
}
export type EditorialRecord = {
  atualizadoEm?: string
  id: string | number; titulo: string; status: string; categoria?: string; lede?: string; img?: string; conteudo?: string; publicadoEm?: string | null
  autoriaTexto?: string | null; edicao?: string | null; ano?: number | null; paginas?: number | null; cor?: string; descricao?: string; pdfUrl?: string
  tipo?: string; inicioEm?: string; fimEm?: string | null; local?: string; foto?: string | null
}
export type AdminRecord = EditorialRecord | CadeiraAdmin
export type ChairConfirmation = { code: 'CONFIRMACAO_CADEIRA'; cadeira: CadeiraAdmin; ocupacaoAtualId: string | null }
type PersonConfirmation = { code: 'CONFIRMACAO_PESSOA'; role: 'academico' | 'fundador' | 'patrono'; candidates: { id: string; nome: string; descricao: string }[] }
export class AdminApiError extends Error {
  constructor(message: string, public status: number, public confirmation?: ChairConfirmation, public personConfirmation?: PersonConfirmation) { super(message) }
}

export async function adminRequest<T>(path: string, options: { method?: string; body?: unknown; csrfToken?: string; signal?: AbortSignal; file?: Blob } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.csrfToken) headers['X-CSRF-Token'] = options.csrfToken
  if (options.file) headers['Content-Type'] = options.file.type
  else if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const timeout = AbortSignal.timeout(options.file ? 120000 : 20000)
  let response: Response
  try {
    response = await fetch('/api/admin' + path, {
      method: options.method ?? 'GET', credentials: 'include', headers,
      body: options.file ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new AdminApiError('Não foi possível confirmar a operação. Confira a conexão e atualize a lista antes de repetir um cadastro.', 0)
  }
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => null) as { error?: string; code?: string; cadeira?: CadeiraAdmin; role?: PersonConfirmation['role']; candidates?: PersonConfirmation['candidates'] } | null
  if (!response.ok) throw new AdminApiError(response.status === 401 ? 'Sua sessão expirou. Entre novamente para continuar.' : data?.error || 'Não foi possível concluir a operação.', response.status,
    data?.code === 'CONFIRMACAO_CADEIRA' && data.cadeira ? data as ChairConfirmation : undefined,
    data?.code === 'CONFIRMACAO_PESSOA' && data.role && Array.isArray(data.candidates) ? data as PersonConfirmation : undefined)
  if (data === null) throw new AdminApiError('Resposta inválida do servidor.', 0)
  return data as T
}

export function loadAdminPage(resource: AdminResource, page: number, q: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), pageSize: '20', q })
  return adminRequest<AdminPage<AdminRecord>>(`/${resource}?${query}`, { signal })
}
export function loadAdminRecord(resource: AdminResource, id: string, signal?: AbortSignal) {
  return adminRequest<AdminRecord>(`/${resource}/${encodeURIComponent(id)}`, { signal })
}
export function uploadAdminFile(file: Blob, csrfToken: string) {
  if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type)) throw new AdminApiError('Escolha uma imagem PNG, JPEG ou WebP, ou um PDF.', 400)
  if (!file.size || file.size > 10 * 1024 * 1024) throw new AdminApiError('O arquivo deve ter conteúdo e no máximo 10 MB.', 400)
  return adminRequest<{ url: string }>('/uploads', { method: 'POST', file, csrfToken })
}

export type FormValues = Record<string, string>
export type AdminListItem = { id: string; title: string; meta: string; status: string; values: FormValues }
const str = (value: unknown) => value == null ? '' : String(value)
export const localDateTime = (value?: string | null) => value ? new Date(Date.parse(value) - 3 * 3600000).toISOString().slice(0, -1) : ''
export function isoDateTime(value: string) {
  if (!value) return null
  return `${value.length === 16 ? value + ':00' : value}-03:00`
}
const editorialLabel = (value: string) => ({ PUBLICADO: 'Publicado', RASCUNHO: 'Rascunho', ARQUIVADO: 'Arquivado' }[value] ?? value)

export function adminItem(resource: AdminResource, record: AdminRecord): AdminListItem {
  if (resource === 'cadeiras') {
    const row = record as CadeiraAdmin
    const { atual: current, membro: person, ocupacoes, status } = situacaoCadeira(row.ocupacoes)
    const founder = ocupacoes.find(o => o.fundador)
    return { id: String(row.numero), title: person?.nome ?? `Cadeira ${row.numero} sem titular`, meta: `Cadeira ${row.numero} · Patrono: ${row.patrono.nome}`, status,
      values: { nome: person?.nome ?? '', cadeira: String(row.numero), status, patrono: row.patrono.nome,
        fundador: founder?.academico.nome ?? '', posse: current?.inicioEm?.slice(0, 10) ?? '', inicioAno: str(current?.inicioAno),
        biografia: person?.biografia ?? '', bioExtra: person?.bioExtra ?? '', fotoUrl: person?.fotoUrl ?? '',
        patronoBio: row.patrono.biografia ?? '', patronoFoto: row.patrono.fotoUrl ?? '', ocupacaoAtualId: current?.id ?? '',
      } }
  }
  const row = record as EditorialRecord
  const values: FormValues = {
    atualizadoEm: row.atualizadoEm ?? '',
    titulo: row.titulo, status: row.status, categoria: row.categoria ?? '', lede: row.lede ?? '', conteudo: row.conteudo ?? '', img: row.img ?? '',
    publicadoEm: localDateTime(row.publicadoEm), autoriaTexto: row.autoriaTexto ?? '', edicao: row.edicao ?? '', ano: str(row.ano),
    paginas: str(row.paginas), cor: row.cor ?? 'navy', descricao: row.descricao ?? '', pdfUrl: row.pdfUrl ?? '',
    tipo: row.tipo ?? '', inicioEm: localDateTime(row.inicioEm), fimEm: localDateTime(row.fimEm), local: row.local ?? '', foto: row.foto ?? '',
  }
  return { id: String(row.id), title: row.titulo, meta: resource === 'agenda' ? `${row.tipo} · ${values.inicioEm.replace('T', ' ').slice(0, 16)}` : `${row.categoria} ${row.autoriaTexto ? '· ' + row.autoriaTexto : ''}`, status: editorialLabel(row.status), values }
}

export function adminPayload(resource: AdminResource, v: FormValues, editing: boolean): Record<string, unknown> {
  const status = v.status || 'RASCUNHO'
  if (resource === 'noticias') return { titulo: v.titulo, categoria: v.categoria, lede: v.lede, conteudo: v.conteudo, img: v.img || '', status, publicadoEm: isoDateTime(v.publicadoEm) }
  if (resource === 'acervo') return { titulo: v.titulo, categoria: v.categoria, autoriaTexto: v.autoriaTexto || null, edicao: v.edicao || null,
    ano: v.ano ? Number(v.ano) : null, paginas: v.paginas ? Number(v.paginas) : null, cor: v.cor || 'navy', descricao: v.descricao || '', pdfUrl: v.pdfUrl || '', status }
  if (resource === 'agenda') return { titulo: v.titulo, tipo: v.tipo, inicioEm: isoDateTime(v.inicioEm), fimEm: isoDateTime(v.fimEm), local: v.local, descricao: v.descricao || '', foto: v.foto || null, status }
  const academico = { nome: v.nome, biografia: v.biografia || null, bioExtra: v.bioExtra || null, fotoUrl: v.fotoUrl || null }
  const patrono = { nome: v.patrono, biografia: v.patronoBio || null, fotoUrl: v.patronoFoto || null }
  if (editing) return { patrono, ...(v.ocupacaoAtualId ? { academico, ocupacaoAtualId: v.ocupacaoAtualId,
    ...(v.status !== 'Titular em exercício' ? { encerramento: { fimEm: v.fimEm, inMemoriam: v.status === 'In memoriam' } } : {}) } : {}) }
  return { numero: Number(v.cadeira), patrono, academico, inicioEm: v.posse,
    ...(v.fundador?.trim() ? { fundador: { nome: v.fundador.trim() } } : {}) }
}

export async function saveAdminForm(resource: AdminResource, values: FormValues, id: string | null, csrfToken: string,
  confirm: (message: string) => boolean | Promise<boolean>) {
  const body = adminPayload(resource, values, id !== null)
  if (id !== null && resource !== 'cadeiras') body.atualizadoEm = values.atualizadoEm
  if (resource === 'cadeiras' && body.encerramento && !await confirm(`Encerrar a ocupação de ${values.nome} e preservá-la no histórico?`)) return false
  const resolvedPeople = new Set<string>()
  for (;;) {
    try {
      await adminRequest(`/${resource}${id ? '/' + encodeURIComponent(id) : ''}`, { method: id ? 'PUT' : 'POST', body, csrfToken })
      return true
    } catch (error) {
      if (!(error instanceof AdminApiError) || resource !== 'cadeiras' || id !== null) throw error
      if (error.confirmation) {
        if (body.confirmarSubstituicao) throw new AdminApiError('A cadeira foi alterada por outra pessoa. Confira os dados e salve novamente para uma nova confirmação.', 409)
        const { cadeira, ocupacaoAtualId } = error.confirmation
        const atual = cadeira.ocupacoes.find(o => o.id === ocupacaoAtualId)?.academico.nome
        if (!await confirm(`A cadeira ${cadeira.numero} já existe${atual ? ` e pertence a ${atual}` : ' e está vaga'}. Confirmar a posse de ${values.nome}? O titular anterior ficará no histórico; o patrono e o fundador serão preservados.`)) return false
        Object.assign(body, { confirmarSubstituicao: true, ocupacaoAtualId })
      } else if (error.personConfirmation) {
        const { role, candidates } = error.personConfirmation
        if (resolvedPeople.has(role)) throw error
        resolvedPeople.add(role)
        let selected = false
        for (const person of candidates) {
          if (await confirm(`Já existe um cadastro de ${person.nome}${person.descricao ? `: ${person.descricao}` : ''}. Usar esta pessoa como ${role === 'academico' ? 'titular' : role}, preservando seus dados? OK reutiliza o cadastro; Cancelar permite conferir as outras opções.`)) {
            delete body[role]
            body[`${role}Id`] = person.id
            selected = true
            break
          }
        }
        if (!selected) {
          if (!await confirm(`Confirma que é uma pessoa diferente, com o mesmo nome? OK cria um cadastro separado; Cancelar volta ao formulário sem salvar.${role === 'fundador' ? ' Se o próprio titular é o fundador, deixe o campo Fundador vazio.' : ''}`)) return false
          body.confirmarHomonimos = [...(body.confirmarHomonimos as string[] | undefined ?? []), role]
        }
      } else throw error
    }
  }
}
