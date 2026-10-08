import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { verifyProfilesMigration } from './verify-profiles-migration.mjs'

// Não carrega .env nem usa DATABASE_URL como alternativa.
const raw = process.env.TEST_DATABASE_URL
if (!raw) {
  console.error('Defina TEST_DATABASE_URL para um PostgreSQL exclusivo de testes. Consulte o README.')
  process.exit(1)
}
let url
try { url = new URL(raw) } catch {
  console.error('TEST_DATABASE_URL deve ser uma URL PostgreSQL válida.')
  process.exit(1)
}
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !/test/i.test(decodeURIComponent(url.pathname))) {
  console.error('TEST_DATABASE_URL deve apontar para um banco PostgreSQL com "test" no nome.')
  process.exit(1)
}
const schema = `portal_test_${randomUUID().replaceAll('-', '')}`
url.searchParams.set('schema', schema)
// A CLI usa DIRECT_URL nas migrations. Nunca herde a conexão da aplicação.
const env = { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString(), INTEGRATION_SCHEMA: schema,
  NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:5173',
  R2_ACCOUNT_ID: '', R2_ACCESS_KEY_ID: '', R2_SECRET_ACCESS_KEY: '', R2_BUCKET: '', R2_PUBLIC_URL: '',
}
const cwd = fileURLToPath(new URL('../', import.meta.url))
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } })
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Etapa de integração falhou (código ${result.status}).`)
}
try {
  console.log(`Integração PostgreSQL: schema temporário ${schema}`)
  // CREATE sem IF NOT EXISTS: nunca reutiliza um schema já existente.
  await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`)
  try {
    await verifyProfilesMigration(db, cwd, run)
    run(['--import', 'tsx', '--test', 'tests/integration/isolation.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/admin-profiles.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/instituicao-admin.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/postgres.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/admin.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/backend-regressions.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/deletions.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/evento-galeria.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/uploads.test.ts'])
    run(['--import', 'tsx', '--test', 'tests/integration/audit.test.ts'])
  } finally {
    await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`)
  }
} catch {
  console.error('Integração não concluída. Confira o PostgreSQL, as permissões e os resultados acima.')
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
