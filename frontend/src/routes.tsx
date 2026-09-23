import { createBrowserRouter } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Academia from './pages/Academia'
import Cadeiras from './pages/Cadeiras'
import Membro from './pages/Membro'
import Acervo from './pages/Acervo'
import Agenda from './pages/Agenda'
import Noticias from './pages/Noticias'
import Contato from './pages/Contato'
import Busca from './pages/Busca'
import NaoEncontrada from './pages/NaoEncontrada'
import Login from './pages/Login'
import Admin from './pages/Admin'
import RequireAuth from './components/RequireAuth'
import AdminAcervo from './pages/AdminAcervo'
import AdminNoticias from './pages/AdminNoticias'
import AdminAgenda from './pages/AdminAgenda'
import AdminMembros from './pages/AdminMembros'

export const router = createBrowserRouter([
  { path: '/login', Component: Login },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'academia', Component: Academia },
      { path: 'cadeiras', Component: Cadeiras },
      { path: 'cadeiras/:numero', Component: Membro },
      { path: 'acervo', Component: Acervo },
      { path: 'agenda', Component: Agenda },
      { path: 'noticias', Component: Noticias },
      { path: 'contato', Component: Contato },
      { path: 'busca', Component: Busca },
      {
        Component: RequireAuth,
        children: [
          { path: 'admin', Component: Admin },
          { path: 'admin/acervo', Component: AdminAcervo },
          { path: 'admin/noticias', Component: AdminNoticias },
          { path: 'admin/agenda', Component: AdminAgenda },
          { path: 'admin/membros', Component: AdminMembros },
        ],
      },
      { path: '*', Component: NaoEncontrada },
    ],
  },
])
