import { numeroCadeira } from '../../../backend/src/domain/numero-cadeira.js'

export function formatNumeroCadeira(value: string): string {
  return String(numeroCadeira(value) ?? value)
}

export function formatData(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function formatMes(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '')
}

export function formatDia(iso: string): string {
  return new Date(iso + 'T00:00:00').getDate().toString().padStart(2, '0')
}
