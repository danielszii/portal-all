import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { editorialStatus, imageAccept } from '@/components/admin/fields'

export default function AdminNoticias() {
  return <AdminResourcePage
    resource="noticias" defaults={{ status: 'RASCUNHO' }}
    title="Gerenciar" emphasis="notícias"
    description="Prepare chamadas, textos e imagens para as notícias institucionais."
    singular="Notícia"
    fields={[
      { name: 'titulo', label: 'Título', required: true },
      { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: ['Institucional', 'Literatura', 'Eventos', 'Memória'] },
      editorialStatus,
      { name: 'publicadoEm', label: 'Publicar em (horário de Fortaleza)', type: 'datetime-local', publishedRequired: true },
      { name: 'lede', label: 'Resumo', type: 'textarea', required: true, maxLength: 2000 },
      { name: 'conteudo', label: 'Conteúdo', type: 'textarea', required: true },
      { name: 'imagem', label: 'Imagem de capa (até 10 MB)', type: 'file', accept: imageAccept, urlField: 'img' },
    ]}
  />
}
