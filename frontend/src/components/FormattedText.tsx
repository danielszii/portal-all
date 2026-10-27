import { Fragment } from 'react'

// Apenas marcações de negrito e itálico são interpretadas; HTML permanece texto.
export default function FormattedText({ text }: { text: string | null | undefined }) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
  return <>{parts.map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : part.startsWith('*') && part.endsWith('*') && part.length > 2
      ? <em key={index}>{part.slice(1, -1)}</em>
      : <Fragment key={index}>{part}</Fragment>)}</>
}
