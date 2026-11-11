import AdminResourcePage from '@/components/admin/AdminResourcePage'
import { editorialStatus } from '@/components/admin/fields'

export default function AdminBiblioteca() {
  return <AdminResourcePage
    resource="biblioteca"
    defaults={{ status: 'PUBLICADO', quantidade: '1' }}
    title="Catálogo da" emphasis="biblioteca"
    description="Cadastre os livros físicos existentes na biblioteca da Academia. Este catálogo é somente informativo."
    singular="Livro físico"
    fields={[
      { name: 'titulo', label: 'Título', required: true },
      { name: 'autor', label: 'Autor ou autoria' },
      { name: 'editora', label: 'Editora' },
      { name: 'ano', label: 'Ano', type: 'number', min: 1, max: 9999 },
      { name: 'tombo', label: 'Número de tombo / identificação' },
      { name: 'localizacao', label: 'Localização na biblioteca', placeholder: 'Ex.: Estante 2, prateleira B' },
      { name: 'quantidade', label: 'Quantidade de exemplares', type: 'number', min: 1, max: 100000, required: true },
      editorialStatus,
      { name: 'observacoes', label: 'Observações', type: 'textarea', maxLength: 5000 },
    ]}
    relatedActions={[{ label: 'Publicações digitais', to: '/admin/acervo' }]}
  />
}
