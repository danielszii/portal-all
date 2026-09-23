import { prisma } from '../db/prisma.js'

// Compartilha uma consulta pendente para não acumular conexões durante uma falha.
let pending: Promise<unknown> | undefined
export async function databaseReady(timeoutMs = 3000): Promise<boolean> {
  if (!pending) {
    pending = Promise.resolve().then(() => prisma.$queryRaw`SELECT 1`).finally(() => { pending = undefined })
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      pending.then(() => true, () => false),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), timeoutMs) }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
