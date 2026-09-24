export type AdminSession = {
  user: { id: string; email: string }
  csrfToken: string
  expiraEm: string
}

export class AuthError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

async function authRequest(path: string, init: RequestInit = {}): Promise<AdminSession | null> {
  let response: Response
  try {
    const options = {
      ...init, credentials: 'include' as const, cache: 'no-store' as const,
      signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    }
    response = await fetch(`/api/admin/auth/${path}`, options)
  } catch (error) {
    if (init.signal?.aborted) throw error
    throw new AuthError('Não foi possível acessar o servidor. Tente novamente.', 0)
  }
  if (response.status === 204) return null
  const body = await response.json().catch(() => null) as {
    error?: unknown; user?: { id?: unknown; email?: unknown }; csrfToken?: unknown; expiraEm?: unknown
  } | null
  if (!response.ok) {
    if (response.status === 429) {
      const seconds = Number(response.headers.get('retry-after'))
      const wait = Number.isFinite(seconds) && seconds > 0 ? ` Tente novamente em cerca de ${Math.ceil(seconds / 60)} minuto(s).` : ' Aguarde e tente novamente.'
      throw new AuthError(`Muitas tentativas de acesso.${wait}`, 429)
    }
    throw new AuthError(typeof body?.error === 'string' ? body.error : 'Não foi possível verificar seu acesso.', response.status)
  }
  if (!body || typeof body.user?.id !== 'string' || typeof body.user?.email !== 'string'
    || typeof body.csrfToken !== 'string' || !/^[a-f0-9]{64}$/.test(body.csrfToken)
    || typeof body.expiraEm !== 'string' || !Number.isFinite(Date.parse(body.expiraEm)) || Date.parse(body.expiraEm) <= Date.now()) {
    throw new AuthError('Resposta de autenticação inválida. Tente novamente.', 0)
  }
  return body as AdminSession
}

export async function fetchAdminSession(signal?: AbortSignal) {
  try { return await authRequest('me', { signal }) }
  catch (error) { if (error instanceof AuthError && error.status === 401) return null; throw error }
}

export async function loginAdmin(email: string, password: string, remember: boolean) {
  const result = await authRequest('login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password, remember }),
  })
  if (!result) throw new AuthError('Resposta de autenticação inválida.', 0)
  return result
}

export async function logoutAdmin(csrfToken: string) {
  try { await authRequest('logout', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken } }) }
  catch (error) { if (!(error instanceof AuthError && error.status === 401)) throw error }
}

export function adminDestination(value: unknown): string {
  // Apenas destinos administrativos conhecidos; não aceita redirecionamentos externos.
  return typeof value === 'string' && /^\/admin(?:\/(?:acervo|noticias|agenda|membros))?$/.test(value) ? value : '/admin'
}
