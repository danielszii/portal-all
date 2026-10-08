import { ArrowUpRight, BookOpen, Building2, CalendarDays, History, LayoutDashboard, Newspaper, Users, UserCog } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { NavLink } from 'react-router'
import { canOpenAdminPage } from '@/services/admin-permissions'

const modules = [
  { title: 'Acervo', description: 'Cadastre livros, edições e arquivos digitais.', action: 'Gerenciar acervo', to: '/admin/acervo', icon: BookOpen },
  { title: 'Notícias', description: 'Prepare e publique novidades da Academia.', action: 'Gerenciar notícias', to: '/admin/noticias', icon: Newspaper },
  { title: 'Agenda', description: 'Organize eventos, solenidades e encontros.', action: 'Gerenciar agenda', to: '/admin/agenda', icon: CalendarDays },
  { title: 'Membros', description: 'Atualize informações das cadeiras e seus titulares.', action: 'Gerenciar membros', to: '/admin/membros', icon: Users },
  { title: 'Histórico', description: 'Acompanhe publicações, edições, exclusões e acessos.', action: 'Consultar histórico', to: '/admin/auditoria', icon: History },
  { title: 'Instituição', description: 'Consulte os dados institucionais e a diretoria publicados.', action: 'Consultar instituição', to: '/admin/instituicao', icon: Building2 },
  { title: 'Contas', description: 'Defina os perfis e o acesso de cada pessoa.', action: 'Gerenciar contas', to: '/admin/contas', icon: UserCog },
]

export default function Admin() {
  const { user, can } = useAuth()

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

        <nav className="admin-module-grid" aria-label="Módulos administrativos">
          {modules.filter(module => canOpenAdminPage(module.to, can)).map(({ title, description, action, to, icon: Icon }, index) => (
            <NavLink className="admin-module-card" to={to} key={title}>
              <div className="admin-module-card-top">
                <div className="admin-module-icon"><Icon size={23} strokeWidth={1.5} /></div>
                <span className="admin-module-number">0{index + 1}</span>
              </div>
              <span className="admin-module-status">Módulo administrativo</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="admin-module-action">{action}<ArrowUpRight size={15} /></span>
            </NavLink>
          ))}
        </nav>

      </section>
    </main>
  )
}
