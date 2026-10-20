import type { AdminField } from './AdminResourcePage'
import { mediaMimeTypes } from '../../../../backend/src/domain/media.js'
export const editorialStatus: AdminField = {
  name: 'status', label: 'Visibilidade no site', type: 'publication', required: true,
  options: [{ value: 'PUBLICADO', label: 'Mostrar no site' }, { value: 'RASCUNHO', label: 'Salvar sem publicar' }, { value: 'ARQUIVADO', label: 'Retirar do site' }],
}
export const imageAccept = mediaMimeTypes.image.join(',')
