import 'dotenv/config'
import { prisma } from '../src/db/prisma.js'
import { hashPassword } from '../src/services/admin-auth.service.js'
import { email } from '../src/services/admin-validation.js'

// Sem endpoint de registro público. Senha somente por variável de ambiente.
try {
  const address = email(process.env.ADMIN_EMAIL)
  const command = process.argv[2] ?? 'create'
  if (command === 'disable') {
    await prisma.$transaction(async tx => {
      const user = await tx.administrador.update({ where: { email: address }, data: { ativo: false } })
      await tx.sessaoAdmin.deleteMany({ where: { administradorId: user.id } })
    })
  } else if (command === 'create' || command === 'password') {
    const password = process.env.ADMIN_PASSWORD ?? ''
    delete process.env.ADMIN_PASSWORD
    const senhaHash = await hashPassword(password, { allowShortPassword: process.argv.includes('--allow-short-password') })
    if (command === 'create') await prisma.administrador.create({ data: { email: address, senhaHash } })
    else await prisma.$transaction(async tx => {
      const user = await tx.administrador.update({ where: { email: address }, data: { senhaHash, ativo: true } })
      await tx.sessaoAdmin.deleteMany({ where: { administradorId: user.id } })
    })
  } else throw new Error('Comando inválido.')
  console.log('Conta administrativa atualizada.')
} catch {
  console.error('Operação não concluída. Confira comando, conexão, ADMIN_EMAIL, existência da conta e senha (15 a 128 caracteres).')
  process.exitCode = 1
} finally { await prisma.$disconnect() }
