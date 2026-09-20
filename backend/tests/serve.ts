import type { TestContext } from 'node:test'
import type { Express } from 'express'
import { once } from 'node:events'
import assert from 'node:assert/strict'

export async function serve(t: TestContext, app: Express) {
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeAllConnections()
  }))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  return `http://127.0.0.1:${address.port}`
}
