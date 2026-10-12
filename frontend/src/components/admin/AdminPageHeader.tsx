import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { NavLink } from 'react-router'

type Props = {
  title: string
  emphasis: string
  description: string
  backTo?: string
  backLabel?: string
  children?: ReactNode
}

export default function AdminPageHeader({ title, emphasis, description, backTo = '/admin', backLabel = 'Voltar ao painel', children }: Props) {
  return <header className="admin-workspace-header">
    <div>
      <h1>{title} <em>{emphasis}</em></h1>
      <p>{description}</p>
    </div>
    {(backTo || children) && <div className="admin-header-actions">
      {backTo && <NavLink className="admin-secondary-action" to={backTo}><ArrowLeft size={15} aria-hidden="true" /> {backLabel}</NavLink>}
      {children}
    </div>}
  </header>
}
