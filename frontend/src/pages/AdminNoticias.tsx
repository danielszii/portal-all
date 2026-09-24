import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { useResource } from '@/hooks/useResource'
import { fetchNoticias } from '@/services/api'
import { useCallback } from 'react'

export default function AdminNoticias() {
  const load = useCallback((signal: AbortSignal) => fetchNoticias(undefined, undefined, signal), [])
  const state = useResource(load, [])
  return <AdminResourcePage
    title="Gerenciar" emphasis="notícias"
    description="Prepare chamadas, textos e imagens para as notícias institucionais."
    singular="Notícia" loading={state.loading} error={state.error}
    items={state.data.map(item => ({ id: String(item.id), title: item.titulo, meta: `${item.categoria} · ${item.data}` }))}
    fields={[
      { name: 'titulo', label: 'Título', required: true },
      { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: ['Institucional', 'Literatura', 'Eventos', 'Memória'] },
      { name: 'data', label: 'Data de publicação', type: 'date', required: true },
      { name: 'resumo', label: 'Resumo', type: 'textarea', required: true },
      { name: 'conteudo', label: 'Conteúdo', type: 'textarea', required: true },
      { name: 'imagem', label: 'Imagem de capa', type: 'file', accept: 'image/*' },
    ]}
  />
}
