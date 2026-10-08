import assert from 'node:assert/strict'
import { mkdtemp, cp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Executado somente pelo runner, no schema aleatório do banco exclusivo de testes.
export async function verifyProfilesMigration(db, cwd, run) {
  const directory = await mkdtemp(join(tmpdir(), 'portal-profiles-migration-'))
  try {
    await cp(join(cwd, 'prisma/schema.prisma'), join(directory, 'schema.prisma'))
    const migrations = join(cwd, 'prisma/migrations')
    for (const name of await readdir(migrations)) {
      if (name === 'migration_lock.toml' || name < '20261008000100_perfis_administrativos') {
        await cp(join(migrations, name), join(directory, 'migrations', name), { recursive: true })
      }
    }
    run(['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--schema', join(directory, 'schema.prisma')])
    await db.$executeRaw`INSERT INTO "Administrador" (id, email, "senhaHash", ativo) VALUES
      ('migration-active', 'migration-active@example.test', 'invalid-test-hash', true),
      ('migration-inactive', 'migration-inactive@example.test', 'invalid-test-hash', false)`
    run(['node_modules/prisma/build/index.js', 'migrate', 'deploy'])
    const old = await db.administrador.findMany({ orderBy: { id: 'asc' } })
    assert.equal(old.length, 2)
    assert.deepEqual(old.map(account => account.perfis), [['ADMINISTRADOR'], ['ADMINISTRADOR']])
    assert.deepEqual(old.map(account => account.ativo), [true, false])
    const fresh = await db.administrador.create({ data: { id: 'migration-new', email: 'migration-new@example.test', senhaHash: 'invalid-test-hash' } })
    assert.deepEqual(fresh.perfis, ['CONSULTA'])
    await assert.rejects(db.administrador.update({ where: { id: fresh.id }, data: { perfis: [] } }))
    await db.administrador.deleteMany({ where: { id: { in: ['migration-active', 'migration-inactive', 'migration-new'] } } })
    console.log('Migração de perfis: contas existentes preservadas, novas contas com consulta e lista vazia rejeitada.')
  } finally { await rm(directory, { recursive: true, force: true }) }
}
