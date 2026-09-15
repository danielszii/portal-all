import { cadeiras as fallbackCadeiras, type Cadeira } from '@/data/cadeiras'
import { eventos as fallbackEventos, galeriaFotos as fallbackGaleria, type Evento, type GaleriaFoto } from '@/data/agenda'

const API_BASE = '/api'

export async function fetchCadeiras(status?: string, q?: string): Promise<Cadeira[]> {
  try {
    const params = new URLSearchParams()
    if (status && status !== 'Todos') params.append('status', status)
    if (q) params.append('q', q)

    const res = await fetch(`${API_BASE}/cadeiras?${params.toString()}`)
    if (!res.ok) throw new Error('Falha ao obter cadeiras da API')
    return await res.json()
  } catch (err) {
    console.warn('API indisponível, utilizando dados locais de cadeiras:', err)
    let list = fallbackCadeiras
    if (status && status !== 'Todos') list = list.filter(c => c.status === status)
    if (q) {
      const query = q.toLowerCase()
      list = list.filter(c => c.holder.toLowerCase().includes(query) || c.patron.toLowerCase().includes(query))
    }
    return list
  }
}

export async function fetchCadeiraByNumber(numero: string): Promise<Cadeira | null> {
  try {
    const res = await fetch(`${API_BASE}/cadeiras/${encodeURIComponent(numero)}`)
    if (!res.ok) throw new Error(`Cadeira ${numero} não encontrada`)
    return await res.json()
  } catch (err) {
    console.warn(`API indisponível para cadeira ${numero}, utilizando dados locais:`, err)
    const chair = fallbackCadeiras.find(c => c.number.toUpperCase() === numero.toUpperCase())
    return chair || null
  }
}

export async function fetchEventos(tipo?: string): Promise<Evento[]> {
  try {
    const params = new URLSearchParams()
    if (tipo && tipo !== 'Todos') params.append('tipo', tipo)

    const res = await fetch(`${API_BASE}/eventos?${params.toString()}`)
    if (!res.ok) throw new Error('Falha ao obter eventos da API')
    return await res.json()
  } catch (err) {
    console.warn('API indisponível, utilizando dados locais de eventos:', err)
    if (tipo && tipo !== 'Todos') {
      return fallbackEventos.filter(e => e.tipo === tipo)
    }
    return fallbackEventos
  }
}

export async function fetchGaleria(): Promise<GaleriaFoto[]> {
  try {
    const res = await fetch(`${API_BASE}/eventos/galeria`)
    if (!res.ok) throw new Error('Falha ao obter galeria da API')
    return await res.json()
  } catch (err) {
    console.warn('API indisponível, utilizando dados locais da galeria:', err)
    return fallbackGaleria
  }
}

export async function fetchNoticias(categoria?: string, q?: string) {
  try {
    const params = new URLSearchParams()
    if (categoria && categoria !== 'Todas') params.append('categoria', categoria)
    if (q) params.append('q', q)

    const res = await fetch(`${API_BASE}/noticias?${params.toString()}`)
    if (!res.ok) throw new Error('Falha ao obter notícias da API')
    return await res.json()
  } catch (err) {
    console.warn('API indisponível para notícias:', err)
    return []
  }
}

export async function fetchAcervo(tipo?: string, q?: string) {
  try {
    const params = new URLSearchParams()
    if (tipo && tipo !== 'Todos') params.append('tipo', tipo)
    if (q) params.append('q', q)

    const res = await fetch(`${API_BASE}/acervo?${params.toString()}`)
    if (!res.ok) throw new Error('Falha ao obter acervo da API')
    return await res.json()
  } catch (err) {
    console.warn('API indisponível para acervo:', err)
    return []
  }
}

export async function postContato(dados: { nome: string; email: string; assunto: string; mensagem: string }) {
  const res = await fetch(`${API_BASE}/contato`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro ao enviar mensagem de contato.')
  }
  return await res.json()
}
