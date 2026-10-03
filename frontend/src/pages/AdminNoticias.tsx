import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { editorialStatus, imageAccept } from '@/components/admin/fields'
import { ArrowUpRight, ImageIcon } from 'lucide-react'

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
    renderPreview={values => {
      const image = values.imagemPreview || values.img
      const date = values.publicadoEm ? new Date(values.publicadoEm).toLocaleDateString('pt-BR') : 'Data da publicação'
      return <article className="admin-content-preview admin-news-preview">
        <div className="admin-preview-media">{image ? <img src={image} alt="Prévia da capa da notícia" /> : <span><ImageIcon size={24} />Imagem de capa</span>}</div>
        <div className="admin-preview-copy">
          <div className="admin-preview-meta"><span>{values.categoria || 'Categoria'}</span><time>{date}</time></div>
          <h3>{values.titulo || 'Título da notícia'}</h3>
          <p>{values.lede || 'O resumo da notícia aparecerá aqui conforme você digitar.'}</p>
          <span className="admin-preview-link">Ler notícia <ArrowUpRight size={13} /></span>
        </div>
      </article>
    }}
  />
}
