import { ValidationError } from '../errors/app.error.js'

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ValidationError('Envie um objeto JSON.')
  return value as Record<string, unknown>
}
export function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new ValidationError('Campo não reconhecido.')
}
export function text(value: unknown, name: string, max = 300): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new ValidationError(`${name}: texto obrigatório, até ${max} caracteres.`)
  return value.trim()
}
export function optionalText(value: unknown, name: string, max = 20000) {
  return value === null || value === undefined || value === '' ? null : text(value, name, max)
}
export function integer(value: unknown, name: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) throw new ValidationError(`${name}: inteiro entre ${min} e ${max}.`)
  return value
}
export function bool(value: unknown, fallback = false): boolean {
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') throw new ValidationError('Valor booleano inválido.')
  return value
}
export function date(value: unknown, name: string): Date {
  const input = text(value, name, 40)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(input)) throw new ValidationError(`${name}: use data ISO com fuso horário.`)
  day(input.slice(0, 10), name)
  const result = new Date(input)
  if (!Number.isFinite(result.getTime())) throw new ValidationError(`${name}: data inválida.`)
  return result
}
export function day(value: unknown, name: string): Date {
  const input = text(value, name, 10)
  const result = new Date(input + 'T00:00:00Z')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input) || !Number.isFinite(result.getTime()) || result.toISOString().slice(0, 10) !== input) throw new ValidationError(`${name}: use uma data válida YYYY-MM-DD.`)
  return result
}
export function url(value: unknown, name: string, required = false): string {
  if (!required && (value === undefined || value === null || value === '')) return ''
  const input = text(value, name, 2048)
  if (/[\s\\\u0000-\u001f]/.test(input)) throw new ValidationError(`${name}: URL inválida.`)
  if (input.startsWith('/') && !input.startsWith('//')) return input
  try {
    const parsed = new URL(input)
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error()
    return parsed.href
  } catch { throw new ValidationError(`${name}: use URL HTTP(S) ou caminho local absoluto.`) }
}
export function status(value: unknown): 'RASCUNHO' | 'PUBLICADO' | 'ARQUIVADO' {
  if (value === undefined) return 'RASCUNHO'
  if (value !== 'RASCUNHO' && value !== 'PUBLICADO' && value !== 'ARQUIVADO') throw new ValidationError('Status editorial inválido.')
  return value
}
export function email(value: unknown) {
  const result = text(value, 'email', 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new ValidationError('E-mail inválido.')
  return result
}
