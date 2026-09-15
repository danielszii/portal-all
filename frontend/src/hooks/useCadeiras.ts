import { useCallback } from 'react'
import { fetchCadeiras } from '@/services/api'
import { useResource } from './useResource'
export function useCadeiras(filtro = 'Todos') {
  const load = useCallback((signal: AbortSignal) => fetchCadeiras(filtro, undefined, signal), [filtro])
  const state = useResource(load, [])
  return { cadeiras: state.data, loading: state.loading, error: state.error, retry: state.retry }
}
