import test from 'node:test'
import assert from 'node:assert/strict'
import { PrismaClient } from '@prisma/client'

test('migrations e consultas usam o mesmo schema exclusivo de testes', async () => {
  const schema = process.env.INTEGRATION_SCHEMA ?? ''
  assert.match(schema, /^portal_test_[a-f0-9]{32}$/)
  assert.equal(process.env.DIRECT_URL, process.env.DATABASE_URL)
  assert.equal(new URL(process.env.DIRECT_URL!).searchParams.get('schema'), schema)
  const db = new PrismaClient()
  try {
    const [row] = await db.$queryRaw<{ schema: string; migrations: string | null }[]>`
      SELECT current_schema() AS schema, to_regclass('"_prisma_migrations"')::text AS migrations
    `
    assert.equal(row.schema, schema)
    assert.ok(row.migrations, 'As migrations devem estar no schema temporário.')
    assert.equal(await db.administrador.count(), 0)
  } finally { await db.$disconnect() }
})
