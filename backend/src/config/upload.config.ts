import { AppError } from '../errors/app.error.js'

const r2Variables = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'] as const

function requiresSharedStorage(environment: NodeJS.ProcessEnv) {
  if (environment.NODE_ENV === 'production') return true
  if (!environment.DATABASE_URL?.trim()) return false
  let database: URL
  try { database = new URL(environment.DATABASE_URL) } catch {
    throw new AppError('DATABASE_URL inválida para determinar o destino dos uploads.', 503)
  }
  return !['localhost', '[::1]'].includes(database.hostname) && !/^127\.\d+\.\d+\.\d+$/.test(database.hostname)
}

export function readR2Config(environment: NodeJS.ProcessEnv = process.env) {
  // Diretório explícito tem prioridade, inclusive para testes sem acesso à nuvem.
  if (environment.UPLOAD_DIR?.trim()) return null
  const value = (key: typeof r2Variables[number]) => environment[key]?.trim() ?? ''
  const configured = r2Variables.filter(key => value(key))
  if (!configured.length) {
    if (requiresSharedStorage(environment)) {
      throw new AppError('Uploads indisponíveis: configure as cinco variáveis R2_* para compartilhar arquivos. UPLOAD_DIR só deve ser definido para armazenamento local explícito em um backend central com disco persistente.', 503)
    }
    return null
  }
  if (configured.length !== r2Variables.length) {
    throw new AppError(`Configuração incompleta do Cloudflare R2. Variáveis ausentes: ${r2Variables.filter(key => !value(key)).join(', ')}.`, 503)
  }
  const accountId = value('R2_ACCOUNT_ID')
  if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new AppError('R2_ACCOUNT_ID deve ser o identificador de 32 caracteres hexadecimais da conta.', 503)
  let publicUrl: URL
  try { publicUrl = new URL(value('R2_PUBLIC_URL')) } catch { throw new AppError('R2_PUBLIC_URL deve ser uma URL HTTPS pública válida.', 503) }
  if (publicUrl.protocol !== 'https:' || publicUrl.username || publicUrl.password || publicUrl.search || publicUrl.hash) {
    throw new AppError('R2_PUBLIC_URL deve usar HTTPS, sem credenciais, query ou fragmento.', 503)
  }
  return {
    accountId, accessKeyId: value('R2_ACCESS_KEY_ID'), secretAccessKey: value('R2_SECRET_ACCESS_KEY'),
    bucket: value('R2_BUCKET'), publicUrl: publicUrl.href.replace(/\/+$/, ''),
  }
}
