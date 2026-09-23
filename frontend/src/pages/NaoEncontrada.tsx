import { NavLink } from 'react-router'

export default function NaoEncontrada() {
  return <main>
    <section className="page-hero wrap not-found-content">
      <h1 className="page-title">Página <em>não encontrada</em></h1>
      <p className="page-lede">O endereço acessado não existe ou o conteúdo foi movido.</p>
      <NavLink className="text-link" to="/">Voltar ao início</NavLink>
    </section>
  </main>
}
