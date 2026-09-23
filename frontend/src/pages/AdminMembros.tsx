import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { useResource } from '@/hooks/useResource'
import { fetchCadeiras } from '@/services/api'
import { useCallback } from 'react'

export default function AdminMembros() {
  const load = useCallback((signal: AbortSignal) => fetchCadeiras(undefined, undefined, signal), [])
  const state = useResource(load, [])
  return <AdminResourcePage
    title="Gerenciar" emphasis="membros"
    description="Atualize titulares, patronos, biografias e a situação das cadeiras."
    singular="Membro" loading={state.loading} error={state.error}
    items={state.data.map(item => ({ id: item.number, title: item.holder, meta: `Cadeira ${item.number} · Patrono: ${item.patron}`, status: item.status }))}
    fields={[
      { name: 'nome', label: 'Nome completo', required: true },
      { name: 'cadeira', label: 'Cadeira', required: true },
      { name: 'status', label: 'Situação', type: 'select', required: true, options: ['Titular em exercício', 'In memoriam', 'Vaga'] },
      { name: 'patrono', label: 'Patrono', required: true },
      { name: 'fundador', label: 'Fundador' },
      { name: 'posse', label: 'Data de posse', type: 'date' },
      { name: 'biografia', label: 'Biografia', type: 'textarea' },
      { name: 'foto', label: 'Foto institucional', type: 'file' },
    ]}
  />
}
