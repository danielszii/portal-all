import { ArrowUpRight, BookOpen, Building2, CalendarDays, History, LayoutDashboard, Newspaper, Users, UserCog, PanelsTopLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { NavLink } from 'react-router'
import { canOpenAdminPage } from '@/services/admin-permissions'

const modules = [
  { title: 'Portal', description: 'Edite os destaques e textos apresentados nas páginas públicas.', action: 'Editar portal', to: '/admin/portal', icon: PanelsTopLeft },
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
      <section className="wrap admin-workspace" aria-labelledby="admin-modules-title">
        <header className="admin-workspace-header admin-dashboard-header">
          <div>
            <h1 id="admin-modules-title">Painel <em>administrativo</em></h1>
            <p>Escolha um módulo para consultar ou atualizar as informações do portal.</p>
          </div>
          <div className="admin-session">
            <LayoutDashboard size={18} strokeWidth={1.5} aria-hidden="true" />
            <span>Sessão atual</span>
            <strong>{user?.email}</strong>
          </div>
        </header>

        <nav className="admin-module-grid" aria-label="Módulos administrativos">
          {modules.filter(module => canOpenAdminPage(module.to, can)).map(({ title, description, action, to, icon: Icon }, index) => (
            <NavLink className="admin-module-card" to={to} key={title}>
              <div className="admin-module-card-top">
                <div className="admin-module-icon"><Icon size={23} strokeWidth={1.5} aria-hidden="true" /></div>
                <span className="admin-module-number">0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="admin-module-action">{action}<ArrowUpRight size={15} aria-hidden="true" /></span>
            </NavLink>
          ))}
        </nav>

      </section>
    </main>
  )
}
