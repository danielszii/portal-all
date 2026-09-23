import { BookOpen, CalendarDays, LayoutDashboard, Newspaper, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const modules = [
  { title: 'Acervo', description: 'Cadastre livros, edições e arquivos digitais.', action: 'Gerenciar acervo', icon: BookOpen },
  { title: 'Notícias', description: 'Prepare e publique novidades da Academia.', action: 'Gerenciar notícias', icon: Newspaper },
  { title: 'Agenda', description: 'Organize eventos, solenidades e encontros.', action: 'Gerenciar agenda', icon: CalendarDays },
  { title: 'Membros', description: 'Atualize informações das cadeiras e seus titulares.', action: 'Gerenciar membros', icon: Users },
]

export default function Admin() {
  const { user } = useAuth()

  return (
    <main className="admin-page">
      <section className="wrap admin-content" aria-labelledby="admin-modules-title">
        <div className="admin-section-heading">
          <div>
            <h2 id="admin-modules-title">O que deseja <em>gerenciar?</em></h2>
          </div>
          <div className="admin-session">
            <LayoutDashboard size={18} strokeWidth={1.5} aria-hidden="true" />
            <span>Sessão atual</span>
            <strong>{user?.email}</strong>
          </div>
        </div>

        <div className="admin-module-grid">
          {modules.map(({ title, description, action, icon: Icon }) => (
            <article className="admin-module-card" key={title}>
              <div className="admin-module-icon"><Icon size={24} strokeWidth={1.4} /></div>
              <span className="admin-module-status">Integração pendente</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <button type="button" disabled title="Disponível após a integração com a API">{action}</button>
            </article>
          ))}
        </div>

      </section>
    </main>
  )
}
