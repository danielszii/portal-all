import type { Prisma } from '@prisma/client'
import type { Cadeira, Evento, Noticia, AcervoItem, GaleriaFoto, ProducaoLiteraria } from '../types/index.js'

export const cadeiraInclude = {
  patrono: true,
  ocupacoes: { include: { academico: { include: { obras: true, producoes: { where: { status: 'PUBLICADO' as const } } } } } },
} satisfies Prisma.CadeiraInclude
type CadeiraRow = Prisma.CadeiraGetPayload<{ include: typeof cadeiraInclude }>

export function romano(numero: number): string {
  let result = ''
  for (const [valor, letra] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']] as const) {
    while (numero >= valor) { result += letra; numero -= valor }
  }
  return result
}
export function numeroCadeira(value: string): number | null {
  const text = value.trim().toUpperCase()
  if (/^\d+$/.test(text)) { const n = Number(text); return n > 0 && n < 4000 ? n : null }
  if (!/^[IVXLCDM]+$/.test(text) || text.length > 15) return null
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let total = 0
  for (let i = 0; i < text.length; i++) total += values[text[i]] < (values[text[i + 1]] ?? 0) ? -values[text[i]] : values[text[i]]
  return total > 0 && total < 4000 && romano(total) === text ? total : null
}
export function mapCadeira(row: CadeiraRow): Cadeira {
  const ocupacoes = [...row.ocupacoes].sort((a, b) => (a.inicioAno ?? 0) - (b.inicioAno ?? 0))
  const atual = ocupacoes.find(o => o.vigente)
  const ultimo = ocupacoes.at(-1)
  const membro = atual?.academico ?? (ultimo?.academico.inMemoriam ? ultimo.academico : undefined)
  return {
    number: romano(row.numero), patron: row.patrono.nome,
    founder: ocupacoes.find(o => o.fundador)?.academico.nome ?? '',
    holder: membro?.nome ?? 'Vaga', image: membro?.fotoUrl ?? '',
    status: atual ? 'Titular em exercício' : membro?.inMemoriam ? 'In memoriam' : 'Vaga',
    bio: membro?.biografia ?? undefined, bioExtra: membro?.bioExtra ?? undefined,
    posse: atual?.inicioAno?.toString(), patronoBio: row.patrono.biografia ?? undefined,
    obras: membro?.obras.map(o => ({ titulo: o.titulo, ano: o.ano ?? undefined, tipo: o.tipo ?? undefined })) ?? [],
    producao: membro?.producoes.map(p => ({ titulo: p.titulo, tipo: p.tipo as ProducaoLiteraria['tipo'], texto: p.texto })) ?? [],
    sucessao: ocupacoes.map(o => ({ nome: o.academico.nome, periodo: o.periodoTexto ?? `${o.inicioAno ?? '?'}–${o.vigente ? 'presente' : o.fimAno ?? '?'}`, status: o.academico.inMemoriam ? 'In memoriam' : 'Titular' })),
  }
}
const zone = 'America/Fortaleza'
export function mapEvento(row: Prisma.EventoGetPayload<object>): Evento {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(row.inicioEm)
  const part = (type: string) => parts.find(p => p.type === type)?.value
  return { id: row.id, titulo: row.titulo, tipo: row.tipo as Evento['tipo'],
    data: `${part('year')}-${part('month')}-${part('day')}`,
    hora: row.inicioEm.toLocaleTimeString('pt-BR', { timeZone: zone, hour: '2-digit', minute: '2-digit' }).replace(':', 'h'),
    local: row.local, descricao: row.descricao, foto: row.foto ?? undefined,
    passado: (row.fimEm ?? row.inicioEm).getTime() < Date.now() }
}
export function mapNoticia(row: Prisma.NoticiaGetPayload<object>): Noticia {
  return { id: row.id, titulo: row.titulo, categoria: row.categoria, lede: row.lede, img: row.img, conteudo: row.conteudo,
    data: row.publicadoEm?.toLocaleDateString('pt-BR', { timeZone: zone, day: '2-digit', month: 'short', year: 'numeric' }).replaceAll(' de ', ' ').replace('.', '').toUpperCase() ?? '' }
}
export function mapAcervo(row: Prisma.AcervoItemGetPayload<object>): AcervoItem {
  return { id: row.id, title: row.titulo, tomo: row.edicao ?? '', year: row.ano?.toString() ?? '', color: row.cor,
    author: row.autoriaTexto ?? '', type: row.categoria, pages: row.paginas?.toString() ?? '', desc: row.descricao, pdf: row.pdfUrl }
}
export function mapFoto(row: Prisma.GaleriaFotoGetPayload<object>): GaleriaFoto {
  return { src: row.src, legenda: row.legenda }
}
