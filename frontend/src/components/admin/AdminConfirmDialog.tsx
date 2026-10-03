import { useCallback, useRef, useState } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useDialog } from '@/hooks/useDialog'

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'warning'
}

type PendingConfirmation = ConfirmOptions & { resolve: (accepted: boolean) => void }

export function useAdminConfirm() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null)
  const active = useRef<PendingConfirmation | null>(null)
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => {
    const request = { ...options, resolve }
    active.current?.resolve(false)
    active.current = request
    setPending(request)
  }), [])
  const finish = useCallback((accepted: boolean) => {
    const request = active.current
    active.current = null
    setPending(null)
    request?.resolve(accepted)
  }, [])
  return { confirm, dialog: pending ? <AdminConfirmDialog options={pending} onFinish={finish} /> : null }
}

function AdminConfirmDialog({ options, onFinish }: { options: ConfirmOptions; onFinish: (accepted: boolean) => void }) {
  const dialog = useDialog(() => onFinish(false))
  const danger = options.tone === 'danger'
  const Icon = danger ? Trash2 : AlertTriangle
  return <div className="admin-confirm-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onFinish(false) }}>
    <div ref={dialog} tabIndex={-1} className={`admin-confirm-dialog ${danger ? 'is-danger' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-message">
      <button className="admin-confirm-close" type="button" onClick={() => onFinish(false)} aria-label="Fechar confirmação"><X size={18} /></button>
      <span className="admin-confirm-icon" aria-hidden="true"><Icon size={22} /></span>
      <p>Confirmação necessária</p>
      <h2 id="admin-confirm-title">{options.title}</h2>
      <div id="admin-confirm-message">{options.message}</div>
      <div className="admin-confirm-actions">
        <button type="button" onClick={() => onFinish(false)}>Cancelar</button>
        <button className={danger ? 'danger' : ''} type="button" onClick={() => onFinish(true)}>{options.confirmLabel || 'Confirmar'}</button>
      </div>
    </div>
  </div>
}
