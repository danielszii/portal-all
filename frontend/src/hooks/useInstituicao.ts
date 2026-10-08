import { useEffect } from 'react'
import { fetchInstituicao, subscribeInstituicao } from '@/services/api'
import { useResource } from './useResource'

export function useInstituicao() {
  const state = useResource(fetchInstituicao, { info: null, gestao: null })
  useEffect(() => subscribeInstituicao(state.retry), [state.retry])
  return state
}
