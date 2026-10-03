import { ArrowLeft, Search } from 'lucide-react'
import { NavLink } from 'react-router'

export default function NaoEncontrada() {
  return <main>
    <section className="page-hero wrap not-found-content">
      <h1 className="page-title">Página <em>não encontrada</em></h1>
      <p className="eyebrow">Erro 404</p>
      <p className="page-lede">O endereço acessado não existe ou o conteúdo foi movido. Você pode voltar ao início ou pesquisar no portal.</p>
      <div className="not-found-actions">
        <NavLink className="text-link" to="/"><ArrowLeft size={15} aria-hidden="true" /> Voltar ao início</NavLink>
        <NavLink className="text-link" to="/busca"><Search size={15} aria-hidden="true" /> Pesquisar conteúdo</NavLink>
      </div>
    </section>
  </main>
}
