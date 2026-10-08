// Política compartilhada com a interface; a API sempre verifica a sessão no banco.
export const adminProfiles = ['ADMINISTRADOR', 'EDITOR', 'SECRETARIA', 'CONSULTA'] as const
export type AdminProfile = typeof adminProfiles[number]
export const profileLabels: Record<AdminProfile, string> = {
  ADMINISTRADOR: 'Administrador geral', EDITOR: 'Editor de conteúdo',
  SECRETARIA: 'Secretaria institucional', CONSULTA: 'Consulta e auditoria',
}
export const adminPermissions = [
  'conteudo:ler', 'conteudo:editar', 'instituicao:ler', 'instituicao:editar',
  'auditoria:ler', 'arquivos:imagem', 'arquivos:pdf', 'registros:excluir', 'contas:gerenciar',
] as const
export type AdminPermission = typeof adminPermissions[number]
const grants: Record<AdminProfile, readonly AdminPermission[]> = {
  ADMINISTRADOR: adminPermissions,
  EDITOR: ['conteudo:ler', 'conteudo:editar', 'arquivos:imagem', 'arquivos:pdf'],
  SECRETARIA: ['instituicao:ler', 'instituicao:editar', 'arquivos:imagem'],
  CONSULTA: ['conteudo:ler', 'instituicao:ler', 'auditoria:ler'],
}
export function validProfiles(value: unknown): value is AdminProfile[] {
  return Array.isArray(value) && value.length > 0 && value.length <= adminProfiles.length
    && new Set(value).size === value.length && value.every(p => adminProfiles.includes(p))
}
export function permissionsFor(profiles: unknown): AdminPermission[] {
  if (!validProfiles(profiles)) return []
  return adminPermissions.filter(permission => profiles.some(profile => grants[profile].includes(permission)))
}
export function publicAdmin(user: { id: string; email: string; perfis: AdminProfile[] }) {
  return { id: user.id, email: user.email, perfis: user.perfis, permissoes: permissionsFor(user.perfis) }
}

// Recursos novos precisam ser incluídos explicitamente; caminhos desconhecidos falham fechados.
export function permissionForRequest(method: string, path: string, contentType = ''): AdminPermission | null {
  const resource = path.split('/')[1]?.toLowerCase()
  const read = method === 'GET' || method === 'HEAD'
  if (resource === 'contas') return ['GET', 'HEAD', 'POST', 'PUT'].includes(method) ? 'contas:gerenciar' : null
  if (resource === 'auditoria') return read ? 'auditoria:ler' : null
  if (resource === 'uploads') {
    if (method !== 'POST') return null
    return contentType.split(';')[0].trim().toLowerCase() === 'application/pdf' ? 'arquivos:pdf' : 'arquivos:imagem'
  }
  const area = ['noticias', 'acervo', 'agenda', 'galeria'].includes(resource) ? 'conteudo'
    : ['cadeiras', 'academicos', 'patronos', 'instituicao', 'gestoes'].includes(resource) ? 'instituicao' : null
  if (!area) return null
  if (read) return `${area}:ler`
  if (method === 'DELETE') return 'registros:excluir'
  return ['POST', 'PUT'].includes(method) ? `${area}:editar` : null
}
