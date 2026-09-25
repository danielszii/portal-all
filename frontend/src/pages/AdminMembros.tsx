import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { imageAccept } from '@/components/admin/fields'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'

export default function AdminMembros() {
  return <AdminResourcePage
    resource="cadeiras" defaults={{ status: 'Titular em exercício' }}
    title="Gerenciar" emphasis="membros"
    description="Atualize titulares, patronos, biografias e a situação das cadeiras."
    singular="Membro"
    fields={[
      { name: 'nome', label: 'Nome completo', required: true },
      { name: 'cadeira', label: 'Número da cadeira', type: 'number', required: true, min: 1, max: 3999, readOnlyOnEdit: true },
      { name: 'status', label: 'Situação', type: 'select', required: true, options: ['Titular em exercício', 'In memoriam', 'Vaga'] },
      { name: 'patrono', label: 'Patrono', required: true },
      { name: 'fundador', label: 'Fundador (se diferente do primeiro titular)', readOnlyOnEdit: true },
      { name: 'posse', label: 'Data de posse', type: 'date', required: true, readOnlyOnEdit: true },
      { name: 'fimEm', label: 'Data de encerramento da ocupação', type: 'date', onlyEnd: true },
      { name: 'biografia', label: 'Biografia', type: 'textarea' },
      { name: 'bioExtra', label: 'Informações biográficas adicionais', type: 'textarea' },
      { name: 'foto', label: 'Foto institucional (até 10 MB)', type: 'file', accept: imageAccept, urlField: 'fotoUrl' },
    ]}
    renderPreview={values => {
      const status = values.status || 'Titular em exercício'
      const photo = values.fotoPreview || values.fotoUrl
      return (
        <article className="admin-member-preview-card">
          <MemberPhotoFrame
            src={photo}
            alt={values.nome ? `Prévia de ${values.nome}` : 'Prévia do novo membro'}
            status={status}
            chairNumber={values.cadeira || '—'}
            size="md"
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
