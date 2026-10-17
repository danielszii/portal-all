import { adminRequest } from './admin.js'
import type { PortalContent } from './api.js'

export type AdminPortalContent = PortalContent & { atualizadoEm: string | null }
export const loadAdminPortal = (signal?: AbortSignal) => adminRequest<AdminPortalContent>('/portal', { signal })
export const saveAdminPortal = ({ id: _id, ...content }: AdminPortalContent, csrfToken: string) => adminRequest<AdminPortalContent>('/portal', { method: 'PUT', csrfToken, body: content })
