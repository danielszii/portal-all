import type { AdminField } from './AdminResourcePage'
export const editorialStatus: AdminField = {
  name: 'status', label: 'Publicação', type: 'select', required: true,
  options: [{ value: 'RASCUNHO', label: 'Rascunho — somente no painel' }, { value: 'PUBLICADO', label: 'Publicado — disponível no site' }, { value: 'ARQUIVADO', label: 'Arquivado — fora do site' }],
}
export const imageAccept = 'image/png,image/jpeg,image/webp'
