import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { useResource } from '@/hooks/useResource'
import { fetchEventos } from '@/services/api'
import { useCallback } from 'react'

export default function AdminAgenda() {
  const load = useCallback((signal: AbortSignal) => fetchEventos(undefined, signal), [])
  const state = useResource(load, [])
  return <AdminResourcePage
    title="Gerenciar" emphasis="agenda"
    description="Cadastre solenidades, posses, palestras e encontros da Academia."
    singular="Evento" loading={state.loading} error={state.error}
    items={state.data.map(item => ({ id: item.id, title: item.titulo, meta: `${item.tipo} · ${item.data} às ${item.hora}` }))}
    fields={[
      { name: 'titulo', label: 'Título', required: true },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: ['Sessão Solene', 'Posse', 'Palestra', 'Lançamento', 'Sarau', 'Reunião'] },
      { name: 'data', label: 'Data', type: 'date', required: true },
      { name: 'hora', label: 'Horário', type: 'time', required: true },
      { name: 'local', label: 'Local', required: true },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'imagem', label: 'Imagem', type: 'file' },
    ]}
  />
}
