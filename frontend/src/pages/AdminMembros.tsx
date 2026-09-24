import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { useResource } from '@/hooks/useResource'
import { fetchCadeiras } from '@/services/api'
import { useCallback } from 'react'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'

export default function AdminMembros() {
  const load = useCallback((signal: AbortSignal) => fetchCadeiras(undefined, undefined, signal), [])
  const state = useResource(load, [])
  return <AdminResourcePage
    title="Gerenciar" emphasis="membros"
    description="Atualize titulares, patronos, biografias e a situação das cadeiras."
    singular="Membro" loading={state.loading} error={state.error}
    items={state.data.map(item => ({
      id: item.number,
      title: item.holder,
      meta: `Cadeira ${item.number} · Patrono: ${item.patron}`,
      status: item.status,
      values: {
        nome: item.holder,
        cadeira: item.number,
        status: item.status,
        patrono: item.patron,
        fundador: item.founder,
        posse: item.posse ?? '',
        biografia: item.bio ?? '',
        fotoPreview: item.image,
      },
    }))}
    fields={[
      { name: 'nome', label: 'Nome completo', required: true },
      { name: 'cadeira', label: 'Cadeira', required: true },
      { name: 'status', label: 'Situação', type: 'select', required: true, options: ['Titular em exercício', 'In memoriam', 'Vaga'] },
      { name: 'patrono', label: 'Patrono', required: true },
      { name: 'fundador', label: 'Fundador' },
      { name: 'posse', label: 'Data de posse', type: 'date' },
      { name: 'biografia', label: 'Biografia', type: 'textarea' },
      { name: 'foto', label: 'Foto institucional', type: 'file', accept: 'image/*' },
    ]}
    renderPreview={values => {
      const status = values.status || 'Titular em exercício'
      const photo = values.fotoPreview
      return (
        <article className="admin-member-preview-card">
          <MemberPhotoFrame
            src={photo}
            alt={values.nome ? `Prévia de ${values.nome}` : 'Prévia do novo membro'}
            status={status}
            chairNumber={values.cadeira || '—'}
            size="md"
            variant="ornate"
            photoVariant={photo ? 'source' : 'institutional-demo'}
          />
          <div className="admin-member-preview-copy">
            <span>Cadeira · {values.cadeira || '—'}</span>
            <h3>{values.nome || 'Nome do membro'}</h3>
            <p>{values.patrono || 'Patrono da cadeira'}</p>
            <small className={status === 'In memoriam' || status === 'Vaga' ? 'status memorial' : 'status'}>{status}</small>
          </div>
        </article>
      )
    }}
  />
}
