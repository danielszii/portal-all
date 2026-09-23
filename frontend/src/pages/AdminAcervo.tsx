import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { useResource } from '@/hooks/useResource'
import { fetchAcervo } from '@/services/api'
import { useCallback } from 'react'

export default function AdminAcervo() {
  const load = useCallback((signal: AbortSignal) => fetchAcervo(undefined, undefined, signal), [])
  const state = useResource(load, [])
  return <AdminResourcePage
    title="Gerenciar" emphasis="acervo"
    description="Organize livros, edições e arquivos digitais publicados no portal."
    singular="Publicação" loading={state.loading} error={state.error}
    items={state.data.map(item => ({ id: item.id, title: item.title, meta: `${item.author} · ${item.type} · ${item.year}` }))}
    fields={[
      { name: 'titulo', label: 'Título', required: true },
      { name: 'autor', label: 'Autoria', required: true },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: ['Livro', 'Caderno', 'Antologia', 'Revista', 'Discurso', 'Estatuto'] },
      { name: 'ano', label: 'Ano', type: 'number' },
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'arquivo', label: 'Arquivo PDF', type: 'file' },
    ]}
  />
}
