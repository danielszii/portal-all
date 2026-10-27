import { useRef, type TextareaHTMLAttributes } from 'react'
import { Bold, Italic } from 'lucide-react'

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & {
  value: string; onChange: (value: string) => void
}

export default function FormattedTextarea({ value, onChange, disabled, ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const insert = (marker: string, tab = false) => {
    const input = ref.current
    if (!input || disabled) return
    const start = input.selectionStart
    const end = input.selectionEnd
    const selected = value.slice(start, end)
    const replacement = tab ? '\t' : `${marker}${selected}${marker}`
    const next = value.slice(0, start) + replacement + value.slice(end)
    if (props.maxLength !== undefined && next.length > props.maxLength) return
    onChange(next)
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(tab ? start + 1 : start + marker.length, tab ? start + 1 : end + marker.length)
    })
  }
  return <div className="formatted-editor">
    <div className="formatted-editor-toolbar" role="group" aria-label="Formatação do texto">
      <button type="button" disabled={disabled} aria-label="Aplicar negrito" title="Negrito" onMouseDown={event => event.preventDefault()} onClick={() => insert('**')}><Bold size={16} aria-hidden="true" /></button>
      <button type="button" disabled={disabled} aria-label="Aplicar itálico" title="Itálico" onMouseDown={event => event.preventDefault()} onClick={() => insert('*')}><Italic size={16} aria-hidden="true" /></button>
    </div>
    <textarea {...props} ref={ref} disabled={disabled} value={value} onChange={event => { event.currentTarget.setCustomValidity(''); onChange(event.target.value) }}
      onKeyDown={event => { if (event.key === 'Tab' && !event.shiftKey) { event.preventDefault(); insert('', true) } }} />
    <small>Selecione o texto para aplicar negrito ou itálico. Enter cria parágrafos; Tab indenta e Shift + Tab muda o foco.</small>
  </div>
}
