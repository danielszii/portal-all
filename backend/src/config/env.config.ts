import dotenv from 'dotenv'

dotenv.config()

export function readEnvConfig(environment: NodeJS.ProcessEnv) {
  const nodeEnv = environment.NODE_ENV ?? 'development'
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV deve ser development, test ou production.')
  }

  const portValue = environment.PORT ?? '3001'
  const port = Number(portValue)
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um número inteiro entre 1 e 65535.')
  }

  const frontendUrl = environment.FRONTEND_URL ?? (nodeEnv === 'production' ? '' : 'http://localhost:5173')
  let origin: URL
  try {
    origin = new URL(frontendUrl)
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password ||
      origin.pathname !== '/' || origin.search || origin.hash) throw new Error()
  } catch {
    throw new Error('FRONTEND_URL deve ser uma origem HTTP(S), sem credenciais, caminho, consulta ou fragmento.')
  }
  if (nodeEnv === 'production' && origin.protocol !== 'https:') {
    throw new Error('FRONTEND_URL deve usar HTTPS em produção.')
  }

  return { port, nodeEnv, frontendUrl: origin.origin }
}

export const envConfig = readEnvConfig(process.env)
