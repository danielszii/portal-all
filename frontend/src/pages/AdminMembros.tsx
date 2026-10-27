import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { imageAccept } from '@/components/admin/fields'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'

export default function AdminMembros() {
  return <AdminResourcePage
    resource="cadeiras"
    title="Gerenciar" emphasis="membros"
    description="Atualize titulares, patronos, biografias e a situação das cadeiras."
    singular="Membro"
    relatedActions={[{ label: 'Cadastros sem vínculo', to: '/admin/pessoas' }]}
    fields={[
      { name: 'nome', label: 'Nome completo', requiredWhen: values => values.categoria !== 'Vaga' },
      { name: 'cadeira', label: 'Número da cadeira', type: 'number', required: true, min: 1, max: 3999, readOnlyOnEdit: true },
      { name: 'categoria', label: 'Categoria da cadeira', type: 'select', required: true, options: ['Titular', 'Honorário', 'In Memoriam', 'Vaga'], readOnlyOnEdit: true },
      { name: 'patrono', label: 'Patrono', required: true },
      { name: 'fundador', label: 'Fundador (se diferente do primeiro titular)' },
      { name: 'posse', label: 'Data de posse', type: 'date', requiredWhen: values => values.categoria !== 'Vaga' },
      { name: 'biografia', label: 'Biografia', type: 'textarea' },
      { name: 'bioExtra', label: 'Informações biográficas adicionais', type: 'textarea' },
      { name: 'foto', label: 'Foto institucional (até 10 MB)', type: 'file', accept: imageAccept, urlField: 'fotoUrl' },
    ]}
    renderPreview={values => {
      const status = values.categoria === 'In Memoriam' ? 'In memoriam' : values.categoria === 'Vaga' ? 'Vaga' : 'Titular em exercício'
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
