import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { editorialStatus } from '@/components/admin/fields'

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
  />
}
