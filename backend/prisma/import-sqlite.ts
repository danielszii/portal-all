import 'dotenv/config'
import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { importData, type LegacyData } from './import-data.js'

const file = process.argv[2]
if (!file || !existsSync(file)) throw new Error('Informe o caminho de um banco SQLite legado existente. Faça backup antes da importação.')
if (!process.env.DATABASE_URL?.startsWith('postgresql://') && !process.env.DATABASE_URL?.startsWith('postgres://')) throw new Error('DATABASE_URL deve apontar para o PostgreSQL de destino.')
const source = new DatabaseSync(resolve(file), { readOnly: true })
const prisma = new PrismaClient()
try {
  const cadeiras = source.prepare('SELECT * FROM cadeiras').all().map(c => ({ ...c,
    obras: source.prepare('SELECT titulo, ano, tipo FROM obras WHERE cadeiraNumber = ?').all(c.number),
    sucessao: source.prepare('SELECT nome, periodo, status FROM sucessoes WHERE cadeiraNumber = ?').all(c.number),
    producao: source.prepare('SELECT titulo, tipo, texto FROM producoes_literarias WHERE cadeiraNumber = ?').all(c.number),
  }))
  const mensagens = source.prepare('SELECT * FROM contato_mensagens').all().map(m => ({ ...m, dataEnvio: new Date(m.dataEnvio as string | number).toISOString() }))
  const data = {
    cadeiras, mensagens,
    eventos: source.prepare('SELECT * FROM eventos').all(),
    noticias: source.prepare('SELECT * FROM noticias').all(),
    acervo: source.prepare('SELECT * FROM acervo_itens').all(),
    galeria: source.prepare('SELECT src, legenda FROM galeria_fotos').all(),
  } as unknown as LegacyData
  // Importação aditiva. O arquivo SQLite é aberto somente para leitura.
  await importData(prisma, data, resolve(file))
  console.log('Importação concluída. SQLite original preservado.')
} finally { source.close(); await prisma.$disconnect() }
