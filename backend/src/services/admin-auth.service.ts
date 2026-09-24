import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto'
import { prisma } from '../db/prisma.js'
import { AppError, ValidationError } from '../errors/app.error.js'

const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 }, (err, key) => err ? reject(err) : resolve(key))
})
export async function hashPassword(password: string, options: { allowShortPassword?: boolean } = {}) {
  if (!password.length || password.length > 128 || (!options.allowShortPassword && password.length < 15)) throw new ValidationError('A senha deve ter entre 15 e 128 caracteres.')
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${(await derive(password, salt)).toString('hex')}`
}
export async function verifyPassword(password: string, hash: string) {
  const [algorithm, salt, key] = hash.split('$')
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(key ?? '')) return false
  return timingSafeEqual(await derive(password, salt), Buffer.from(key, 'hex'))
}
const dummyHash = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex')
// Bound expensive password derivations even when requests use many IP addresses.
let activeLogins = 0
export async function login(email: string, password: string, remember: boolean) {
  if (activeLogins >= 2) throw new AppError('Aguarde e tente novamente.', 429)
  activeLogins++
  try {
    const user = await prisma.administrador.findUnique({ where: { email } })
    const valid = await verifyPassword(password, user?.senhaHash ?? dummyHash)
    if (!valid || !user?.ativo) throw new AppError('E-mail ou senha inválidos.', 401)
    const token = randomBytes(32).toString('hex')
    const csrfToken = randomBytes(32).toString('hex')
    const maxAge = (remember ? 7 * 24 : 8) * 60 * 60 * 1000
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Administrador" WHERE "id" = ${user.id} FOR UPDATE`
      const current = await tx.administrador.findUnique({ where: { id: user.id } })
      if (!current?.ativo || current.senhaHash !== user.senhaHash) throw new AppError('E-mail ou senha inválidos.', 401)
      await tx.sessaoAdmin.deleteMany({ where: { OR: [{ expiraEm: { lte: new Date() } }, { administradorId: user.id }] } })
      await tx.sessaoAdmin.create({ data: { tokenHash: tokenHash(token), administradorId: user.id, csrfToken, expiraEm: new Date(Date.now() + maxAge) } })
    })
    return { token, csrfToken, maxAge, user: { id: user.id, email: user.email } }
  } finally { activeLogins-- }
}
export async function session(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new AppError('Autenticação necessária.', 401)
  const value = await prisma.sessaoAdmin.findUnique({ where: { tokenHash: tokenHash(token) }, include: { administrador: true } })
  if (!value || value.expiraEm <= new Date() || !value.administrador.ativo) throw new AppError('Sessão inválida ou expirada.', 401)
  return value
}
