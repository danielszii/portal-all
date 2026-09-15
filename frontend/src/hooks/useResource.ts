import { useCallback, useEffect, useState } from 'react'

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, initial: T) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision(v => v + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    load(controller.signal).then(value => {
      if (!controller.signal.aborted) setData(value)
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o conteúdo.')
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [load, revision])
  return { data, loading, error, retry }
}
