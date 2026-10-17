import { usePortalContent } from '@/hooks/usePortalContent'
import type { PortalContent } from '@/services/api'

type TextField = { [K in keyof PortalContent]: PortalContent[K] extends string ? K : never }[keyof PortalContent]

export default function PortalText({ field, className }: { field: TextField; className?: string }) {
  const state = usePortalContent()
  if (state.loading) return <p className={className} aria-busy='true'>Carregando…</p>
  if (state.error || !state.data) return <p className={className} role='alert'>Conteúdo indisponível.</p>
  return <p className={className}>{state.data[field]}</p>
}
