import type { AdminPermission } from '../../../backend/src/domain/admin-permissions.js'
export { adminProfiles, profileLabels, permissionsFor, validProfiles } from '../../../backend/src/domain/admin-permissions.js'
export type { AdminProfile, AdminPermission } from '../../../backend/src/domain/admin-permissions.js'

const pages: Record<string, AdminPermission> = {
  acervo: 'conteudo:ler', noticias: 'conteudo:ler', agenda: 'conteudo:ler', galeria: 'conteudo:ler',
  membros: 'instituicao:ler', pessoas: 'instituicao:ler', instituicao: 'instituicao:ler',
  auditoria: 'auditoria:ler', contas: 'contas:gerenciar',
}
export function canOpenAdminPage(path: string, can: (permission: AdminPermission) => boolean) {
  const normalized = path.toLowerCase().replace(/\/$/, '')
  if (normalized === '/admin') return true
  const permission = pages[normalized.replace(/^\/admin\//, '')]
  return permission !== undefined && can(permission)
}
