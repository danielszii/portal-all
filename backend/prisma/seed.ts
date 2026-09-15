import 'dotenv/config'
import { instituicaoData } from '../src/data/instituicao.data.js'
import { PrismaClient } from '@prisma/client'
import { cadeirasData } from '../src/data/cadeiras.data.js'
import { eventosData, galeriaData } from '../src/data/eventos.data.js'
import { noticiasData } from '../src/data/noticias.data.js'
import { acervoData } from '../src/data/acervo.data.js'
import { importData, key } from './import-data.js'

if (process.env.SEED_DEMO !== 'true') throw new Error('Dados demonstrativos: defina SEED_DEMO=true explicitamente. Para dados existentes, use db:import-sqlite.')
const prisma = new PrismaClient()
try {
  await importData(prisma, { cadeiras: cadeirasData, eventos: eventosData, galeria: galeriaData, noticias: noticiasData, acervo: acervoData }, 'demo')
  await prisma.instituicao.upsert({ where: { id: 'all' }, update: {}, create: instituicaoData })
  await prisma.gestao.upsert({ where: { id: 'demo-2022-2026' }, update: {}, create: { id: 'demo-2022-2026', inicioAno: 2022, fimAno: 2026 } })
  for (const [cargo, nome] of [['Presidente', 'Francisco de Assis Moura'], ['Vice-presidente', 'Ana Maria de Lima'], ['Secretário-geral', 'Raimundo Nonato de Oliveira'], ['Tesoureiro', 'José Airton de Freitas']]) {
    const academicoId = key('academico', nome)
    await prisma.academico.upsert({ where: { id: academicoId }, update: {}, create: { id: academicoId, nome } })
    const id = key('mandato', `demo-2022-2026:${cargo}`)
    await prisma.mandatoDiretoria.upsert({ where: { id }, update: {}, create: { id, gestaoId: 'demo-2022-2026', academicoId, cargo } })
  }
  console.log('Dados demonstrativos adicionados. Nenhum registro existente foi apagado ou sobrescrito.')
} finally { await prisma.$disconnect() }
