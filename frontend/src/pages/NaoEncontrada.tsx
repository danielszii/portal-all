import { NavLink } from 'react-router'

export default function NaoEncontrada() {
  return <main className="wrap">
    <h1 className="page-title">Página não encontrada</h1>
    <NavLink className="text-link" to="/">Voltar ao início</NavLink>
  </main>
}
