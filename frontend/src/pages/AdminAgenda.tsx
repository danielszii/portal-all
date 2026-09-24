import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { editorialStatus, imageAccept } from '@/components/admin/fields'

export default function AdminAgenda() {
  return <AdminResourcePage
    resource="agenda" defaults={{ status: 'RASCUNHO' }}
    title="Gerenciar" emphasis="agenda"
    description="Cadastre solenidades, posses, palestras e encontros da Academia."
    singular="Evento"
    fields={[
      { name: 'titulo', label: 'Título', required: true },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: ['Sessão Solene', 'Posse', 'Palestra', 'Lançamento', 'Sarau', 'Reunião'] },
      { name: 'inicioEm', label: 'Início (horário de Fortaleza)', type: 'datetime-local', required: true },
      { name: 'fimEm', label: 'Término (opcional)', type: 'datetime-local' },
      { name: 'local', label: 'Local', required: true },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      editorialStatus,
      { name: 'imagem', label: 'Imagem (até 10 MB)', type: 'file', accept: imageAccept, urlField: 'foto' },
    ]}
  />
}
