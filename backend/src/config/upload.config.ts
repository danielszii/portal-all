const r2Variables = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'] as const

export function readR2Config(environment: NodeJS.ProcessEnv = process.env) {
  // Diretório explícito tem prioridade, inclusive para testes sem acesso à nuvem.
  if (environment.UPLOAD_DIR?.trim()) return null
  const value = (key: typeof r2Variables[number]) => environment[key]?.trim() ?? ''
  const configured = r2Variables.filter(key => value(key))
  if (!configured.length) return null
  if (configured.length !== r2Variables.length) {
    throw new Error(`Configuração incompleta do Cloudflare R2. Variáveis ausentes: ${r2Variables.filter(key => !value(key)).join(', ')}.`)
  }
  const accountId = value('R2_ACCOUNT_ID')
  if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new Error('R2_ACCOUNT_ID deve ser o identificador de 32 caracteres hexadecimais da conta.')
  let publicUrl: URL
  try { publicUrl = new URL(value('R2_PUBLIC_URL')) } catch { throw new Error('R2_PUBLIC_URL deve ser uma URL HTTPS pública válida.') }
  if (publicUrl.protocol !== 'https:' || publicUrl.username || publicUrl.password || publicUrl.search || publicUrl.hash) {
    throw new Error('R2_PUBLIC_URL deve usar HTTPS, sem credenciais, query ou fragmento.')
  }
  return {
    accountId, accessKeyId: value('R2_ACCESS_KEY_ID'), secretAccessKey: value('R2_SECRET_ACCESS_KEY'),
    bucket: value('R2_BUCKET'), publicUrl: publicUrl.href.replace(/\/+$/, ''),
  }
}
