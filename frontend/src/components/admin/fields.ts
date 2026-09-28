import type { AdminField } from './AdminResourcePage'
import { mediaMimeTypes } from '../../../../backend/src/domain/media.js'
export const editorialStatus: AdminField = {
  name: 'status', label: 'Publicação', type: 'select', required: true,
  options: [{ value: 'RASCUNHO', label: 'Rascunho — somente no painel' }, { value: 'PUBLICADO', label: 'Publicado — disponível no site' }, { value: 'ARQUIVADO', label: 'Arquivado — fora do site' }],
}
export const imageAccept = mediaMimeTypes.image.join(',')
