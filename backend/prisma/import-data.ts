import { createHash } from 'node:crypto'
import type { Prisma, PrismaClient } from '@prisma/client'
import type { Cadeira, Evento, Noticia, AcervoItem, GaleriaFoto, ContatoMensagem } from '../src/types/index.js'
import { numeroCadeira } from '../src/repositories/mappers.js'

export type LegacyData = {
  cadeiras: Cadeira[]
  eventos: Evento[]
  noticias: Noticia[]
  acervo: Omit<AcervoItem, 'id'>[]
  galeria: GaleriaFoto[]
  mensagens?: ContatoMensagem[]
}
export const key = (type: string, value: string) => `${type}_${createHash('sha256').update(value).digest('hex').slice(0, 24)}`
const year = (value?: string) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : null }
const months: Record<string, string> = { JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06', JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12' }
function newsDate(value: string): Date {
  const match = /^(\d{2})\s+([A-Z]{3})\s+(\d{4})$/.exec(value.toUpperCase())
  const date = match && months[match[2]] ? new Date(`${match[3]}-${months[match[2]]}-${match[1]}T12:00:00-03:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`Data inválida: ${value}`)
  return date
}

// Uma transação: erros abortam a importação inteira; registros existentes nunca são sobrescritos.
export async function importData(prisma: PrismaClient, source: LegacyData, namespace: string) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const c of source.cadeiras) {
      const numero = numeroCadeira(c.number)
      if (!numero) throw new Error(`Número de cadeira inválido: ${c.number}`)
      const patronoId = key('patrono', c.patron)
      await tx.patrono.upsert({ where: { id: patronoId }, update: {}, create: { id: patronoId, nome: c.patron, biografia: c.patronoBio } })
      const cadeira = await tx.cadeira.upsert({ where: { numero }, update: {}, create: { id: key('cadeira', String(numero)), numero, patronoId } })
      // Se a cadeira já foi importada ou editada, preserve sua história integralmente.
      if (await tx.ocupacaoCadeira.count({ where: { cadeiraId: cadeira.id } })) continue
      const historico = [...(c.sucessao ?? [])]
      if (c.founder && !historico.some(h => h.nome === c.founder)) historico.unshift({ nome: c.founder, periodo: '', status: 'Titular' })
      if (c.holder && c.holder !== 'Vaga' && !historico.some(h => h.nome === c.holder)) historico.push({ nome: c.holder, periodo: c.posse ? `${c.posse}–${c.status === 'In memoriam' ? '?' : 'presente'}` : '', status: c.status === 'In memoriam' ? 'In memoriam' : 'Titular' })
      for (const h of historico) {
        const academicoId = key('academico', h.nome)
        const holder = h.nome === c.holder
        const period = h.periodo.match(/(\d{4})/g) ?? []
        await tx.academico.upsert({ where: { id: academicoId }, update: {}, create: {
          id: academicoId, nome: h.nome, biografia: holder ? c.bio : undefined,
          bioExtra: holder ? c.bioExtra : undefined, fotoUrl: holder ? c.image : undefined,
          inMemoriam: h.status === 'In memoriam',
        } })
        await tx.ocupacaoCadeira.create({ data: {
          id: key('ocupacao', `${cadeira.id}:${academicoId}`), cadeiraId: cadeira.id, academicoId,
          fundador: h.nome === c.founder, vigente: holder && c.status === 'Titular em exercício',
          inicioAno: year(period[0] ?? (holder ? c.posse : undefined)), fimAno: year(period[1]), periodoTexto: h.periodo || null,
        } })
        if (holder) {
          for (const o of c.obras ?? []) {
            const id = key('obra', `${academicoId}:${o.titulo}:${o.ano ?? ''}`)
            await tx.obra.upsert({ where: { id }, update: {}, create: { id, academicoId, ...o } })
          }
          for (const p of c.producao ?? []) {
            const id = key('texto', `${academicoId}:${p.titulo}`)
            await tx.producaoLiteraria.upsert({ where: { id }, update: {}, create: { id, academicoId, titulo: p.titulo, tipo: p.tipo, texto: p.texto, status: 'PUBLICADO' } })
          }
        }
      }
    }
    for (const e of source.eventos) {
      const hora = e.hora.replace('h', ':')
      const inicioEm = new Date(`${e.data}T${hora}:00-03:00`)
      if (Number.isNaN(inicioEm.getTime())) throw new Error(`Data/hora inválida no evento ${e.id}`)
      await tx.evento.upsert({ where: { id: e.id }, update: {}, create: { id: e.id, titulo: e.titulo, tipo: e.tipo, inicioEm, local: e.local, descricao: e.descricao, foto: e.foto, status: 'PUBLICADO' } })
    }
    for (const [ordem, g] of source.galeria.entries()) {
      const id = key('foto', `${g.src}:${g.legenda}`)
      // Sem inferir vínculo de evento apenas a partir da legenda.
      await tx.galeriaFoto.upsert({ where: { id }, update: {}, create: { id, ...g, ordem, textoAlternativo: g.legenda } })
    }
    for (const n of source.noticias) {
      await tx.noticia.upsert({ where: { id: n.id }, update: {}, create: { id: n.id, categoria: n.categoria, titulo: n.titulo, lede: n.lede, img: n.img, conteudo: n.conteudo ?? n.lede, publicadoEm: newsDate(n.data), status: 'PUBLICADO' } })
    }
    // IDs legados explícitos não devem colidir com o próximo cadastro automático.
    await tx.$queryRaw`SELECT setval(pg_get_serial_sequence('"Noticia"', 'id'), COALESCE((SELECT MAX(id) FROM "Noticia"), 1), EXISTS(SELECT 1 FROM "Noticia"))`
    for (const a of source.acervo) {
      const id = key('acervo', `${a.title}:${a.tomo}:${a.year}`)
      await tx.acervoItem.upsert({ where: { id }, update: {}, create: {
        id, titulo: a.title, edicao: a.tomo, ano: year(a.year), cor: a.color,
        autoriaTexto: a.author, categoria: a.type, paginas: year(a.pages), descricao: a.desc, pdfUrl: a.pdf, status: 'PUBLICADO',
      } })
    }
    for (const m of source.mensagens ?? []) {
      const id = m.id ?? key('mensagem', `${namespace}:${JSON.stringify(m)}`)
      await tx.contatoMensagem.upsert({ where: { id }, update: {}, create: { id, nome: m.nome, email: m.email, assunto: m.assunto, mensagem: m.mensagem, dataEnvio: m.dataEnvio ? new Date(m.dataEnvio) : undefined } })
    }
  }, { timeout: 60000 })
}
