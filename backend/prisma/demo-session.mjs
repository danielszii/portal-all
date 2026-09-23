import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Importador restrito ao arquivo revisado nesta sessão, não executa SQL arbitrário.
const approvedHash = '53f3a0edeb9a39bf65cbbe5bbdae467026d6efaac63e2db621336025c3297626'
const expandedHash = 'c7e061f9d8384187642d5f2e725c6e25e7be724abe7c70a1ca904e1033e0e23d'
const tables = ['Patrono', 'Academico', 'Cadeira', 'OcupacaoCadeira', 'Obra',
  'ProducaoLiteraria', 'Evento', 'GaleriaFoto', 'Noticia', 'AcervoItem',
  'AutoriaAcervo', 'Instituicao', 'Gestao', 'MandatoDiretoria', 'ContatoMensagem']

export async function importDemo(db, filename) {
  const bytes = await readFile(filename)
  const sourceHash = createHash('sha256').update(bytes).digest('hex')
  const normalizedHash = createHash('sha256').update(bytes.toString('utf8').replaceAll('\r\n', '\n')).digest('hex')
  const expanded = normalizedHash === expandedHash
  if (sourceHash !== approvedHash && !expanded) {
    throw new Error('Arquivo diferente do SQL revisado. Nenhum comando foi executado.')
  }
  const statements = bytes.toString('utf8').match(/INSERT INTO public\."[A-Za-z]+"[\s\S]*?;/g) ?? []
  if (statements.length !== (expanded ? 142 : tables.length)) throw new Error('Estrutura do SQL inesperada.')
  const id = randomUUID()
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(724193, 1)`
    await tx.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS public."_PortalDemoSession" (
      id TEXT PRIMARY KEY, "sourceHash" TEXT NOT NULL, rows JSONB NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "removedAt" TIMESTAMPTZ
    )`)
    const rows = []
    for (const [index, statement] of statements.entries()) {
      const table = statement.match(/^INSERT INTO public\."([A-Za-z]+)"/)[1]
      if (!tables.includes(table) || (!expanded && table !== tables[index])) throw new Error('Tabela inesperada no SQL.')
      const inserted = await tx.$queryRawUnsafe(`WITH inserted AS (
        ${statement.slice(0, -1)} RETURNING *
      ) SELECT to_jsonb(inserted) AS row FROM inserted`)
      for (const { row } of inserted) rows.push({ table, row })
    }
    await tx.$executeRaw`INSERT INTO public."_PortalDemoSession" (id, "sourceHash", rows)
      VALUES (${id}, ${sourceHash}, ${JSON.stringify(rows)}::jsonb)`
    return { id, inserted: rows.map(({ table, row }) => ({ table, id: row.id ?? `${row.acervoId}/${row.academicoId}` })) }
  }, { timeout: 30000 })
}

export async function removeDemo(db, id, apply = false) {
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(724193, 1)`
    const [session] = await tx.$queryRaw`SELECT * FROM public."_PortalDemoSession" WHERE id = ${id} FOR UPDATE`
    if (!session) throw new Error('Importação não encontrada neste banco.')
    if (session.removedAt) return { id, alreadyRemoved: true, count: 0 }
    // Ordem inversa da inserção: filhos antes dos pais. Sem CASCADE.
    for (const { table, row } of [...session.rows].reverse()) {
      if (!tables.includes(table)) throw new Error('Tabela inválida no registro da importação.')
      const keys = table === 'AutoriaAcervo' ? { acervoId: row.acervoId, academicoId: row.academicoId } : { id: row.id }
      const [current] = await tx.$queryRawUnsafe(
        `SELECT to_jsonb(t) = $1::jsonb AS unchanged FROM public."${table}" t
         WHERE to_jsonb(t) @> $2::jsonb FOR UPDATE`, JSON.stringify(row), JSON.stringify(keys))
      if (!current) continue
      if (!current.unchanged) throw new Error(`Registro de ${table} foi alterado depois da importação. Remoção cancelada integralmente.`)
      if (apply) await tx.$executeRawUnsafe(
        `DELETE FROM public."${table}" t WHERE to_jsonb(t) = $1::jsonb`, JSON.stringify(row))
    }
    if (apply) await tx.$executeRaw`UPDATE public."_PortalDemoSession" SET "removedAt" = now() WHERE id = ${id}`
    return { id, count: session.rows.length, applied: apply }
  }, { timeout: 30000 })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, argument, confirmation] = process.argv.slice(2)
  if (!argument || !['import', 'remove'].includes(command)) {
    console.error('Uso: npm run db:demo-session -- import CAMINHO.sql | remove ID [--apply]')
    process.exitCode = 1
  } else {
    const db = new PrismaClient()
    try {
      const [{ schema }] = await db.$queryRaw`SELECT current_schema() AS schema`
      if (schema !== 'public') throw new Error('Este SQL exige schema public. Operação cancelada.')
      const result = command === 'import' ? await importDemo(db, argument) : await removeDemo(db, argument, confirmation === '--apply')
      console.log(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error(error.code ? `Operação cancelada e transação revertida (${error.code}). Verifique conexão, migrations e conflitos; nenhum dado anterior é sobrescrito.` : error.message)
      process.exitCode = 1
    } finally { await db.$disconnect() }
  }
}
