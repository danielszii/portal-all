import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { editorialStatus } from '@/components/admin/fields'
import { ArrowUpRight } from 'lucide-react'
import FormattedText from '@/components/FormattedText'
import { useCallback } from 'react'
import { useResource } from '@/hooks/useResource'
import { adminRequest, type AdminPage } from '@/services/admin'

type Author = { id: string; nome: string }
async function loadAuthors(signal: AbortSignal) {
  const authors: Author[] = []
  let page = 1
  let totalPages = 1
  do {
    const result = await adminRequest<AdminPage<Author>>(`/acervo/autores?page=${page}&pageSize=50`, { signal })
    authors.push(...result.items)
    totalPages = result.totalPages
    page++
  } while (page <= totalPages)
  return authors
}

export default function AdminAcervo() {
  const authors = useResource(useCallback(loadAuthors, []), [] as Author[])
  return <>
  {authors.error && <div className="wrap admin-state admin-state-error" role="alert">Não foi possível carregar os autores. <button type="button" onClick={authors.retry}>Tentar novamente</button></div>}
  <AdminResourcePage
    resource="acervo" defaults={{ status: 'PUBLICADO', cor: 'navy' }}
    title="Gerenciar" emphasis="acervo"
    description="Organize livros, edições e arquivos digitais publicados no portal."
    singular="Publicação"
    fields={[
      { name: 'titulo', label: 'Título', required: true },
      { name: 'autorId', label: 'Autor cadastrado', type: 'select', options: authors.data.map(author => ({ value: author.id, label: author.nome })) },
      { name: 'categoria', label: 'Tipo', type: 'select', required: true, allowCustom: true, options: ['Livro', 'Caderno', 'Antologia', 'Revista', 'Discurso', 'Estatuto', 'Matéria'] },
      { name: 'edicao', label: 'Edição / tomo' },
      { name: 'ano', label: 'Ano', type: 'number', min: 1, max: 9999 },
      { name: 'paginas', label: 'Páginas', type: 'number', min: 1, max: 100000 },
      { name: 'cor', label: 'Cor da capa', type: 'select', options: [{ value: 'navy', label: 'Azul' }, { value: 'ochre', label: 'Ocre' }, { value: 'ink', label: 'Preto' }] },
      editorialStatus,
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'arquivo', label: 'Arquivo da publicação: PDF ou imagem (até 10 MB)', type: 'file', accept: 'application/pdf,image/*', urlField: 'pdfUrl', publishedRequired: true },
    ]}
    renderPreview={values => <article className="admin-content-preview admin-book-preview">
      <div className={`admin-preview-book-cover ${values.cor || 'navy'} ${values.capaPreview || values.capaUrl ? 'has-image' : ''}`}>
        {values.capaPreview || values.capaUrl ? <img src={values.capaPreview || values.capaUrl} alt="Capa da publicação" /> : <>
        <span>A.L.L.</span>
        <strong>{values.titulo || 'Título da publicação'}</strong>
        <small>{values.edicao || 'Edição'}</small>
        <i>❧</i></>}
      </div>
      <div className="admin-preview-copy">
        <div className="admin-preview-meta"><span>{values.categoria || 'Tipo'}</span><time>{values.ano || 'Ano'}</time></div>
        <h3>{values.titulo || 'Título da publicação'}</h3>
        <p className="formatted-text"><FormattedText text={values.descricao || 'A descrição da publicação aparecerá aqui.'} /></p>
        <small>{values.paginas || '—'} páginas · {values.autoriaTexto || 'Autoria'}</small>
        <span className="admin-preview-link">
          <span className="admin-preview-action-long">Ler / visualizar</span>
          <span className="admin-preview-action-short">Visualizar</span>
          <ArrowUpRight size={13} />
        </span>
      </div>
    </article>}
  /></>
}
