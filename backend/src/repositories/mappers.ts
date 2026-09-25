import type { Prisma } from '@prisma/client'
import { situacaoCadeira } from '../domain/ocupacoes.js'
import { romano } from '../domain/numero-cadeira.js'
import type { Cadeira, Evento, Noticia, AcervoItem, GaleriaFoto, ProducaoLiteraria } from '../types/index.js'

export { numeroCadeira, romano } from '../domain/numero-cadeira.js'

export const cadeiraInclude = {
  patrono: true,
  ocupacoes: { include: { academico: { include: { obras: true, producoes: { where: { status: 'PUBLICADO' as const } } } } } },
} satisfies Prisma.CadeiraInclude
type CadeiraRow = Prisma.CadeiraGetPayload<{ include: typeof cadeiraInclude }>

export function mapCadeira(row: CadeiraRow): Cadeira {
  const { ocupacoes, atual, membro, status } = situacaoCadeira(row.ocupacoes)
  return {
    number: romano(row.numero), patron: row.patrono.nome,
    founder: ocupacoes.find(o => o.fundador)?.academico.nome ?? '',
    holder: membro?.nome ?? 'Vaga', image: membro?.fotoUrl ?? '',
    status,
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
export function mapNoticia(row: Pick<Prisma.NoticiaGetPayload<object>, 'id' | 'titulo' | 'categoria' | 'lede' | 'img' | 'publicadoEm'> & { conteudo?: string }): Noticia {
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
