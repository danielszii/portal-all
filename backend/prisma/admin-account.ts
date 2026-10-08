import 'dotenv/config'
import { prisma } from '../src/db/prisma.js'
import { createAccount, editAccount } from '../src/services/admin-accounts.service.js'
import { email } from '../src/services/admin-validation.js'

// Sem endpoint de registro público. Senha somente por variável de ambiente.
try {
  const address = email(process.env.ADMIN_EMAIL)
  const command = process.argv[2] ?? 'create'
  const password = process.env.ADMIN_PASSWORD ?? ''
  delete process.env.ADMIN_PASSWORD
  const perfis = (process.env.ADMIN_PERFIS ?? 'CONSULTA').split(',').map(value => value.trim().toUpperCase())
  const options = { allowShortPassword: process.argv.includes('--allow-short-password') }
  if (command === 'create') {
    await createAccount({ email: address, password, perfis }, null, options)
  } else if (['disable', 'password', 'profiles'].includes(command)) {
    const user = await prisma.administrador.findUniqueOrThrow({ where: { email: address } })
    if (command === 'profiles' && !process.env.ADMIN_PERFIS) throw new Error('Informe ADMIN_PERFIS.')
    await editAccount(user.id, {
      perfis: command === 'profiles' ? perfis : user.perfis,
      ativo: command === 'disable' ? false : command === 'password' ? true : user.ativo,
      atualizadoEm: user.atualizadoEm.toISOString(), ...(command === 'password' && { password }),
    }, null, options)
  } else throw new Error('Comando inválido.')
  console.log('Conta administrativa atualizada.')
} catch {
  console.error('Operação não concluída. Confira comando, conexão, ADMIN_EMAIL, ADMIN_PERFIS, senha (15 a 128 caracteres) e se restará um administrador geral ativo.')
  process.exitCode = 1
} finally { await prisma.$disconnect() }
