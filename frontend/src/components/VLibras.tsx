import { useEffect } from 'react'

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => void
    }
    VLibrasWidget?: {
      path?: string
      open?: () => void
    }
  }
}

/**
 * Componente de integração com o VLibras oficial (gov.br).
 * Fornece tradução automática de conteúdos em português para a Língua Brasileira de Sinais (Libras)
 * através de avatar 3D (Ícaro, Hosana ou Guga), padrão nos portais governamentais e públicos federais.
 */
export default function VLibras() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const initWidget = () => {
      try {
        if (window.VLibras && typeof window.VLibras.Widget === 'function') {
          new window.VLibras.Widget('https://vlibras.gov.br/app')
        }
      } catch (err) {
        console.warn('Não foi possível inicializar o widget do VLibras:', err)
      }
    }

    if (window.VLibras) {
      initWidget()
      return
    }

    let script = document.getElementById('vlibras-plugin-script') as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = 'vlibras-plugin-script'
      script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js'
      script.async = true
      document.body.appendChild(script)
    }

    script.addEventListener('load', initWidget)
    return () => {
      script?.removeEventListener('load', initWidget)
    }
  }, [])

  return null
}
