import { useRef, type TextareaHTMLAttributes } from 'react'
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic } from 'lucide-react'

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
  const align = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    const input = ref.current
    if (!input || disabled) return
    const previousBreak = input.selectionStart === 0 ? -1 : value.lastIndexOf('\n\n', input.selectionStart - 1)
    const actualStart = previousBreak < 0 ? 0 : previousBreak + 2
    const boundary = value.indexOf('\n\n', input.selectionEnd)
    const end = boundary < 0 ? value.length : boundary
    const selected = value.slice(actualStart, end)
    const replacement = selected.split('\n\n').map(paragraph => {
      const content = paragraph.replace(/^\[align=(?:left|center|right|justify)\]([\s\S]*)\[\/align\]$/, '$1')
      return content ? `[align=${alignment}]${content}[/align]` : content
    }).join('\n\n')
    const next = value.slice(0, actualStart) + replacement + value.slice(end)
    if (props.maxLength !== undefined && next.length > props.maxLength) return
    onChange(next)
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(actualStart, actualStart + replacement.length) })
  }
  return <div className="formatted-editor">
    <div className="formatted-editor-toolbar" role="group" aria-label="Formatação do texto">
      <button type="button" disabled={disabled} aria-label="Aplicar negrito" title="Negrito" onMouseDown={event => event.preventDefault()} onClick={() => insert('**')}><Bold size={16} aria-hidden="true" /></button>
      <button type="button" disabled={disabled} aria-label="Aplicar itálico" title="Itálico" onMouseDown={event => event.preventDefault()} onClick={() => insert('*')}><Italic size={16} aria-hidden="true" /></button>
      {([
        ['left', 'Alinhar à esquerda', AlignLeft], ['center', 'Centralizar', AlignCenter],
        ['right', 'Alinhar à direita', AlignRight], ['justify', 'Justificar', AlignJustify],
      ] as const).map(([alignment, label, Icon]) => <button key={alignment} type="button" disabled={disabled} aria-label={label} title={label} onMouseDown={event => event.preventDefault()} onClick={() => align(alignment)}><Icon size={16} aria-hidden="true" /></button>)}
    </div>
    <textarea {...props} ref={ref} disabled={disabled} value={value} onChange={event => { event.currentTarget.setCustomValidity(''); onChange(event.target.value) }}
      onKeyDown={event => { if (event.key === 'Tab' && !event.shiftKey) { event.preventDefault(); insert('', true) } }} />
    <small>Selecione o texto para aplicar negrito, itálico ou alinhamento. Enter cria parágrafos; Tab indenta e Shift + Tab muda o foco.</small>
  </div>
}
