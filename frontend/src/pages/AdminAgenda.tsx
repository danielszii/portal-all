import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { editorialStatus, imageAccept } from '@/components/admin/fields'
import { CalendarDays, ImageIcon, MapPin } from 'lucide-react'

function eventDate(value: string) {
  if (!value) return { day: '—', month: 'MÊS', full: 'Data e horário do evento' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { day: '—', month: 'MÊS', full: 'Data e horário do evento' }
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
    full: date.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }),
  }
}

export default function AdminAgenda() {
  return <AdminResourcePage
    resource="agenda" defaults={{ status: 'RASCUNHO' }}
    title="Gerenciar" emphasis="agenda"
    description="Cadastre solenidades, posses, palestras e encontros da Academia."
    singular="Evento"
    relatedActions={[{ label: 'Galeria de eventos', to: '/admin/galeria' }]}
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
    renderPreview={values => {
      const date = eventDate(values.inicioEm)
      const image = values.imagemPreview || values.foto
      return <article className="admin-content-preview admin-event-preview">
        <div className="admin-preview-event-date"><span>{date.month}</span><strong>{date.day}</strong></div>
        <div className="admin-preview-copy">
          <span className="admin-preview-event-type">{values.tipo || 'Tipo do evento'}</span>
          <h3>{values.titulo || 'Título do evento'}</h3>
          <p className="admin-preview-event-detail"><CalendarDays size={12} />{date.full}</p>
          <p className="admin-preview-event-detail"><MapPin size={12} />{values.local || 'Local do evento'}</p>
          <p>{values.descricao || 'A descrição do evento aparecerá aqui.'}</p>
        </div>
        <div className="admin-preview-event-image">{image ? <img src={image} alt="Prévia do evento" /> : <ImageIcon size={22} />}</div>
      </article>
    }}
  />
}
