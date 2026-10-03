import { useEffect } from 'react'
import { useLocation } from 'react-router'

const siteName = 'Academia Limoeirense de Letras'
const descriptions: Record<string, [string, string]> = {
  '/': ['Academia Limoeirense de Letras | A.L.L.', 'Portal oficial da Academia Limoeirense de Letras: memória, literatura e cultura do Vale do Jaguaribe.'],
  '/academia': ['A Academia | A.L.L.', 'Conheça a história, a missão e a diretoria da Academia Limoeirense de Letras.'],
  '/cadeiras': ['Cadeiras e acadêmicos | A.L.L.', 'Conheça as cadeiras, os patronos e os acadêmicos da Academia Limoeirense de Letras.'],
  '/acervo': ['Acervo digital | A.L.L.', 'Consulte livros, revistas, discursos e outras publicações do acervo da Academia.'],
  '/agenda': ['Agenda e eventos | A.L.L.', 'Acompanhe solenidades, palestras, posses e eventos da Academia Limoeirense de Letras.'],
  '/noticias': ['Notícias | A.L.L.', 'Acompanhe notícias e comunicados da Academia Limoeirense de Letras.'],
  '/contato': ['Contato | A.L.L.', 'Entre em contato com a Academia Limoeirense de Letras.'],
  '/busca': ['Busca | A.L.L.', 'Pesquise conteúdos no portal da Academia Limoeirense de Letras.'],
  '/login': ['Área administrativa | A.L.L.', 'Acesso restrito à administração do portal.'],
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

export default function PageMetadata() {
  const location = useLocation()
  useEffect(() => {
    const basePath = location.pathname.startsWith('/cadeiras/') ? '/cadeiras' : location.pathname.startsWith('/admin') ? '/login' : location.pathname
    const [title, description] = descriptions[basePath] ?? ['Página não encontrada | A.L.L.', 'O endereço acessado não existe no portal da Academia Limoeirense de Letras.']
    const canonical = new URL(location.pathname, window.location.origin).href
    const image = new URL('/images/social-share.jpg', window.location.origin).href
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', siteName)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMeta('meta[property="og:image"]', 'property', 'og:image', image)
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.append(link) }
    link.href = canonical
  }, [location.pathname])
  return null
}
