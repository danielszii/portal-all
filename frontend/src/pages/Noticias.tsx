import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useSearchParams } from 'react-router'

const noticias = [
  { id: 1, data: '28 AGO 2026', categoria: 'Institucional', titulo: 'A.L.L. recebe novos membros em sessão solene no Teatro Municipal', lede: 'Cerimônia contou com a presença de autoridades culturais do Ceará e marcou a posse de três novos acadêmicos em cadeiras que estavam vagas desde 2021.', img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80' },
  { id: 2, data: '14 JUL 2026', categoria: 'Publicações', titulo: 'Aberta a chamada de textos para a Antologia do Vale — edição 2027', lede: 'A Academia recebe contribuições de escritores cearenses até 30 de outubro. O tema deste ano é "raízes e travessias", com foco na identidade regional.', img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80' },
  { id: 3, data: '02 JUN 2026', categoria: 'Acervo', titulo: 'Acervo digital ganha nova coleção de manuscritos inéditos do século XX', lede: 'Doação de familiares de acadêmicos fundadores amplia o arquivo histórico da instituição com cartas, rascunhos e documentos raros.', img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80' },
  { id: 4, data: '18 MAI 2026', categoria: 'Eventos', titulo: 'Seminário "Palavra e Memória" reúne pesquisadores de cinco estados', lede: 'O evento de dois dias celebrou os 28 anos da Academia com mesas redondas, lançamentos de livros e apresentações culturais no Centro Cultural de Limoeiro.', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80' },
  { id: 5, data: '03 ABR 2026', categoria: 'Publicações', titulo: 'Cadernos do Vale — Tomo VII é lançado com tiragem ampliada', lede: 'A mais recente edição da principal publicação da Academia já está disponível na sede e em bibliotecas parceiras de todo o Ceará.', img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80' },
  { id: 6, data: '10 FEV 2026', categoria: 'Institucional', titulo: 'A.L.L. firma convênio com a Universidade Regional do Cariri', lede: 'O acordo prevê intercâmbio de pesquisadores, coedição de publicações e acesso ao acervo digital para alunos de pós-graduação em Letras.', img: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80' },
]

const categorias = ['Todas', 'Institucional', 'Publicações', 'Acervo', 'Eventos']

export default function Noticias() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [cat, setCat] = useState('Todas')
  const [aberta, setAberta] = useState<number | null>(null)

  const lista = noticias.filter(n => {
    const matchCat = cat === 'Todas' || n.categoria === cat
    const matchQ = !q || [n.titulo, n.lede, n.categoria].some(v => v.toLowerCase().includes(q.toLowerCase()))
    return matchCat && matchQ
  })

  if (aberta !== null) {
    const noticia = noticias.find(n => n.id === aberta)!
    return (
      <main>
        <article className="noticia-full wrap">
          <button className="back-link" onClick={() => setAberta(null)}>← Voltar às notícias</button>
          <div className="noticia-meta-top">
            <span className="noticia-cat">{noticia.categoria}</span>
            <time>{noticia.data}</time>
          </div>
          <h1 className="page-title" style={{ marginBottom: '32px' }}>{noticia.titulo}</h1>
          <div className="noticia-img-frame">
            <img src={noticia.img} alt={noticia.titulo} />
          </div>
          <div className="noticia-body">
            <p className="lead">{noticia.lede}</p>
            <p>A Academia Limoeirense de Letras continua seu trabalho de preservação e promoção da cultura literária do Vale do Jaguaribe, fortalecendo os laços entre os intelectuais da região e a memória coletiva do Ceará.</p>
            <p>Esta iniciativa integra o programa anual de atividades da A.L.L., aprovado pela diretoria em assembleia ordinária. Para mais informações, entre em contato com a secretaria da Academia.</p>
          </div>
        </article>
      </main>
    )
  }

  return (
    <main>
      <section className="page-hero wrap">
        <p className="eyebrow">Comunicados e eventos</p>
        <h1 className="page-title"><em>Notícias</em></h1>
        {q && <p className="page-lede">Resultados para: <strong>"{q}"</strong></p>}
      </section>

      <section className="noticias-section wrap">
        <div className="cadeiras-filtros">
          {categorias.map(c => (
            <button key={c} className={`filtro-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>{c}</button>
          ))}
          <span className="filtro-count">{lista.length} notícia{lista.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Destaque — primeira notícia */}
        {lista.length > 0 && (
          <div className="noticia-destaque" onClick={() => setAberta(lista[0].id)}>
            <div className="noticia-destaque-img">
              <img src={lista[0].img} alt={lista[0].titulo} />
            </div>
            <div className="noticia-destaque-copy">
              <span className="noticia-cat">{lista[0].categoria}</span>
              <time>{lista[0].data}</time>
              <h2>{lista[0].titulo}</h2>
              <p>{lista[0].lede}</p>
              <span className="text-link" style={{ cursor: 'pointer' }}>Ler notícia <ArrowUpRight size={14} /></span>
            </div>
          </div>
        )}

        {/* Grade das demais */}
        {lista.length > 1 && (
          <div className="noticias-grid">
            {lista.slice(1).map(n => (
              <article className="noticia-card" key={n.id} onClick={() => setAberta(n.id)}>
                <div className="noticia-card-img">
                  <img src={n.img} alt={n.titulo} />
                </div>
                <div className="noticia-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="noticia-cat">{n.categoria}</span>
                    <time>{n.data}</time>
                  </div>
                  <h3>{n.titulo}</h3>
                  <p>{n.lede}</p>
                  <span className="noticia-link">Ler notícia <ArrowUpRight size={13} /></span>
                </div>
              </article>
            ))}
          </div>
        )}

        {lista.length === 0 && (
          <div className="empty-search" style={{ marginTop: '32px' }}>
            <h3>Nenhuma notícia encontrada</h3>
            <p>Tente outro filtro ou termo de busca.</p>
          </div>
        )}
      </section>
    </main>
  )
}
