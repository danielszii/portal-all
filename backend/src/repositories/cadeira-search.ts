import { numeroCadeira } from '../domain/numero-cadeira.js'
import type { Cadeira } from '../types/index.js'
import { foldSearch } from './catalog-query.js'

export function matchesCadeiraSearch(cadeira: Pick<Cadeira, 'number' | 'patron' | 'holder' | 'founder'>, search: string): boolean {
  const term = foldSearch(search.trim())
  if (!term) return true

  const numero = numeroCadeira(term)
  return (numero !== null && numeroCadeira(cadeira.number) === numero)
    || [cadeira.patron, cadeira.holder, cadeira.founder].some(value => foldSearch(value).includes(term))
}
