import { Fragment } from 'react'

// Somente marcações controladas são interpretadas; HTML permanece texto.
function inlineText(text: string) {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
  return <>{parts.map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : part.startsWith('*') && part.endsWith('*') && part.length > 2
      ? <em key={index}>{part.slice(1, -1)}</em>
      : <Fragment key={index}>{part}</Fragment>)}</>
}

export default function FormattedText({ text }: { text: string | null | undefined }) {
  if (!text) return null
  const parts = text.split(/(\[align=(?:left|center|right|justify)\][\s\S]*?\[\/align\])/g)
  return <>{parts.map((part, index) => {
    const match = /^\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]$/.exec(part)
    return match ? <span key={index} className="formatted-aligned" style={{ textAlign: match[1] as 'left' | 'center' | 'right' | 'justify' }}>{inlineText(match[2])}</span>
      : <Fragment key={index}>{inlineText(part)}</Fragment>
  })}</>
}
