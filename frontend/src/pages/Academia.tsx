import { NavLink } from 'react-router'
import { ArrowUpRight } from 'lucide-react'

const diretoria = [
  { cargo: 'Presidente', nome: 'Francisco de Assis Moura', posse: '2022' },
  { cargo: 'Vice-presidente', nome: 'Ana Maria de Lima', posse: '2022' },
  { cargo: 'Secretário-geral', nome: 'Raimundo Nonato de Oliveira', posse: '2022' },
  { cargo: 'Tesoureiro', nome: 'José Airton de Freitas', posse: '2022' },
]

export default function Academia() {
  return (
    <main>

      {/* ── Hero da página ── */}
      <section className="page-hero wrap">
        <p className="eyebrow">Sobre a instituição</p>
        <h1 className="page-title">A <em>Academia</em></h1>
        <p className="page-lede">
          A Academia Limoeirense de Letras existe para valorizar a língua portuguesa, celebrar
          a literatura nacional e preservar a cultura — especialmente a do Vale do Jaguaribe.
        </p>
      </section>

      {/* ── Sobre ── */}
      <section className="academia-section wrap">
        <div className="academia-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Missão</span>
          </div>
          <div className="academia-grid-body">
            <p className="academia-lead">
              Seguindo o modelo da Academia Brasileira de Letras, a A.L.L. é composta por
              40 membros vitalícios — escritores, intelectuais e amantes das letras — que se
              dedicam a promover a cultura e a história de Limoeiro do Norte e do Ceará.
            </p>
            <p>
              Nossa sede está de portas abertas para o público e para diversas entidades culturais
              da região. Realizamos sessões solenes, saraus literários, lançamentos de livros,
              exposições e premiações, sempre com o objetivo de incentivar a produção artística e
              literária do Vale do Jaguaribe.
            </p>
            <p>
              A A.L.L. reúne escritores e intelectuais de diversas áreas do conhecimento: juízes,
              historiadores, professores, jornalistas e poetas, todos com uma comprometida e bela
              produção literária. Todas as nossas atividades são abertas ao público.
            </p>
          </div>
        </div>
      </section>

      {/* ── Linha divisória ── */}
      <div className="academia-divider wrap" />

      {/* ── Fundação ── */}
      <section className="academia-section wrap">
        <div className="academia-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Fundação</span>
            <strong className="academia-ano">1998</strong>
          </div>
          <div className="academia-grid-body">
            <h2 className="academia-h2">Uma casa nascida<br /><em>da palavra</em></h2>
            <p>
              Fundada em 1998 por um grupo de escritores e intelectuais do Vale do Jaguaribe,
              a Academia Limoeirense de Letras teve sua sessão inaugural presidida pelo seu
              idealizador, reunindo os primeiros acadêmicos fundadores comprometidos com a
              preservação da memória literária do Ceará.
            </p>
            <p>
              Seguiu o modelo da Academia Brasileira de Letras, com 40 cadeiras vitalícias,
              cada uma com seu patrono — nomes que representam o cânone da literatura nacional
              e regional. As primeiras reuniões deram-se em espaços cedidos pela prefeitura
              municipal, presididas pelo fundador da casa.
            </p>
            <p>
              Desde sua origem, a A.L.L. consolidou-se como espaço de cultivo do idioma pátrio,
              difusão do saber literário, preservação do patrimônio cultural e incentivo à
              escrita e à leitura — sempre aberta à comunidade.
            </p>
          </div>
        </div>
      </section>

      <div className="academia-divider wrap" />

      {/* ── Sede ── */}
      <section className="academia-section wrap">
        <div className="academia-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Sede</span>
          </div>
          <div className="academia-grid-body">
            <h2 className="academia-h2">O lugar da<br /><em>memória</em></h2>
            <p>
              A sede própria da Academia Limoeirense de Letras está situada no coração
              histórico de Limoeiro do Norte, na Rua Coronel Serafim Chaves, 284 — Centro.
              O espaço abriga o salão nobre, a biblioteca institucional e a galeria de
              retratos dos acadêmicos fundadores.
            </p>
            <p>
              O local também recebe eventos da Secretaria Municipal de Educação e de escolas
              da região, oferecendo um ambiente propício para congressos, palestras,
              treinamentos e rodas literárias. A galeria permanente é um espaço de memória
              aberto a pesquisadores e ao público em geral.
            </p>
            <div className="academia-endereco">
              <p className="eyebrow" style={{ marginBottom: '8px' }}>Endereço</p>
              <p style={{ margin: 0 }}>
                Rua Coronel Serafim Chaves, 284<br />
                Centro · Limoeiro do Norte — CE · CEP 62930-000
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="academia-divider wrap" />

      {/* ── Trajetória ── */}
      <section className="academia-section wrap">
        <div className="academia-grid">
          <div className="academia-grid-label">
            <span className="eyebrow">Trajetória</span>
            <strong className="academia-ano">28<br /><span>anos</span></strong>
          </div>
          <div className="academia-grid-body">
            <h2 className="academia-h2">Um templo vivo<br /><em>da palavra</em></h2>
            <p>
              Ao longo de suas quase três décadas, a A.L.L. ergueu-se como espaço onde
              o silêncio nunca foi ausência, mas gestação. Cada página escrita carrega o
              sopro de acadêmicos que não permitiram que a caneta repousasse inerte sobre
              o papel — fizeram dela instrumento de inspiração em prosa e verso.
            </p>
            <p>
              Entre seus membros floresceram professores que auscultavam a alma humana,
              historiadores que resgatavam o tempo, jornalistas que dialogavam com o mundo
              e poetas que davam forma ao indizível. A A.L.L. representa não apenas a
              literatura cearense, mas o compromisso de um povo com sua própria memória.
            </p>
            <p>
              Hoje, a Academia mantém um acervo digital crescente, realiza sessões mensais
              abertas ao público, publica anualmente os Cadernos do Vale e promove o diálogo
              entre a tradição literária e as novas vozes do Nordeste.
            </p>
          </div>
        </div>
      </section>

      {/* ── Diretoria ── */}
      <section className="academia-diretoria">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Gestão 2022–2026</p>
              <h2>Diretoria <em>atual</em></h2>
            </div>
          </div>
          <div className="diretoria-grid">
            {diretoria.map(d => (
              <div className="diretoria-card" key={d.cargo}>
                <p className="meta">{d.cargo}</p>
                <h3>{d.nome}</h3>
                <p className="diretoria-posse">Posse em {d.posse}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--line)', display: 'flex', gap: '32px' }}>
            <NavLink className="text-link" to="/contato">
              Fale com a Academia <ArrowUpRight size={15} />
            </NavLink>
            <NavLink className="text-link" to="/acervo">
              Ver publicações <ArrowUpRight size={15} />
            </NavLink>
          </div>
        </div>
      </section>

    </main>
  )
}
