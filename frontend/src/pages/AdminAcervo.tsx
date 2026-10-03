import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { editorialStatus } from '@/components/admin/fields'
import { ArrowUpRight } from 'lucide-react'

export default function AdminAcervo() {
  return <AdminResourcePage
    resource="acervo" defaults={{ status: 'RASCUNHO', cor: 'navy' }}
    title="Gerenciar" emphasis="acervo"
    description="Organize livros, edições e arquivos digitais publicados no portal."
    singular="Publicação"
    fields={[
      { name: 'titulo', label: 'Título', required: true },
      { name: 'autoriaTexto', label: 'Autoria' },
      { name: 'categoria', label: 'Tipo', type: 'select', required: true, options: ['Livro', 'Caderno', 'Antologia', 'Revista', 'Discurso', 'Estatuto'] },
      { name: 'edicao', label: 'Edição / tomo' },
      { name: 'ano', label: 'Ano', type: 'number', min: 1, max: 9999 },
      { name: 'paginas', label: 'Páginas', type: 'number', min: 1, max: 100000 },
      { name: 'cor', label: 'Cor da capa', type: 'select', options: [{ value: 'navy', label: 'Azul' }, { value: 'ochre', label: 'Ocre' }, { value: 'ink', label: 'Preto' }] },
      editorialStatus,
      { name: 'descricao', label: 'Descrição', type: 'textarea' },
      { name: 'arquivo', label: 'Arquivo PDF (até 10 MB)', type: 'file', accept: 'application/pdf', urlField: 'pdfUrl', publishedRequired: true },
    ]}
    renderPreview={values => <article className="admin-content-preview admin-book-preview">
      <div className={`admin-preview-book-cover ${values.cor || 'navy'}`}>
        <span>A.L.L.</span>
        <strong>{values.titulo || 'Título da publicação'}</strong>
        <small>{values.edicao || 'Edição'}</small>
        <i>❧</i>
      </div>
      <div className="admin-preview-copy">
        <div className="admin-preview-meta"><span>{values.categoria || 'Tipo'}</span><time>{values.ano || 'Ano'}</time></div>
        <h3>{values.titulo || 'Título da publicação'}</h3>
        <p>{values.descricao || 'A descrição da publicação aparecerá aqui.'}</p>
        <small>{values.paginas || '—'} páginas · {values.autoriaTexto || 'Autoria'}</small>
        <span className="admin-preview-link">Ler / visualizar <ArrowUpRight size={13} /></span>
      </div>
    </article>}
  />
}
