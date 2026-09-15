import { useState, useEffect } from 'react'
import { fetchCadeiras } from '../services/api.js'
import { Cadeira } from '../types/index.js'

export function useCadeiras(filtro = 'Todos') {
  const [cadeiras, setCadeiras] = useState<Cadeira[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    fetchCadeiras(filtro)
      .then(data => {
        if (active) setCadeiras(data)
      })
      .catch(err => {
        if (active) setError(err.message || 'Erro ao carregar cadeiras')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filtro])

  return { cadeiras, loading, error }
}
