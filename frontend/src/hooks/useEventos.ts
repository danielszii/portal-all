import { useCallback } from 'react'
import { fetchEventos, fetchGaleria } from '@/services/api'
import { useResource } from './useResource'
export function useEventos(filtro = 'Todos') {
  const load = useCallback(async (signal: AbortSignal) => {
    const [eventos, galeria] = await Promise.all([fetchEventos(filtro, signal), fetchGaleria(signal)])
    return { eventos, galeria }
  }, [filtro])
  const state = useResource(load, { eventos: [], galeria: [] })
  return { ...state.data, loading: state.loading, error: state.error, retry: state.retry }
}
