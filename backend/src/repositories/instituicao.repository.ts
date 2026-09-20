import type { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'

// Campos @db.Date representam dias civis, não instantes no fuso do servidor.
export function dataInstitucional(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`)
}

export function filtroMandatosAtuais(hoje: Date): Prisma.MandatoDiretoriaWhereInput {
  return { AND: [
    { OR: [{ inicioEm: null }, { inicioEm: { lte: hoje } }] },
    { OR: [{ fimEm: null }, { fimEm: { gte: hoje } }] },
  ] }
}

export async function findInstituicao(now = new Date()) {
  const hoje = dataInstitucional(now)
  const ano = hoje.getUTCFullYear()
  const info = await prisma.instituicao.findUnique({ where: { id: 'all' } })
  const gestao = await prisma.gestao.findFirst({
    where: { inicioAno: { lte: ano }, OR: [{ fimAno: null }, { fimAno: { gte: ano } }] },
    orderBy: { inicioAno: 'desc' },
    include: { mandatos: { where: filtroMandatosAtuais(hoje), include: { academico: true } } },
  })
  return { info, gestao: gestao ? {
    inicioAno: gestao.inicioAno, fimAno: gestao.fimAno,
    diretoria: gestao.mandatos.map(m => ({
      cargo: m.cargo, nome: m.academico.nome,
      posse: m.inicioEm?.getUTCFullYear().toString() ?? gestao.inicioAno.toString(),
    })),
  } : null }
}
