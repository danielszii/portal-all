import { useState, useEffect } from 'react'
import { fetchEventos, fetchGaleria } from '../services/api.js'
import { Evento, GaleriaFoto } from '../types/index.js'

export function useEventos(filtro = 'Todos') {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [galeria, setGaleria] = useState<GaleriaFoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([fetchEventos(filtro), fetchGaleria()])
      .then(([evts, gal]) => {
        if (!active) return
        setEventos(evts)
        setGaleria(gal)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filtro])

  return { eventos, galeria, loading }
}
