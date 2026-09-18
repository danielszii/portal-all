import { useResource } from '@/hooks/useResource'
import LoadState from '@/components/LoadState'
import { useState, useCallback } from 'react'
import { useParams, NavLink } from 'react-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { Cadeira } from '@/types'
import type { ProducaoLiteraria } from '@/types'
import { fetchCadeiraByNumber } from '@/services/api'
import MemberPhotoFrame from '@/components/MemberPhotoFrame'

function TextoLiterario({ item }: { item: ProducaoLiteraria }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="producao-item">
      <div className="producao-header" onClick={() => setAberto(o => !o)} role="button" aria-expanded={aberto} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAberto(o => !o) } }}>
        <div>
          <span className="producao-tipo">{item.tipo}</span>
          <h4 className="producao-titulo">{item.titulo}</h4>
        </div>
        <span className="producao-toggle">{aberto ? '−' : '+'}</span>
      </div>
      {aberto && (
        <div className="producao-texto">
          {item.texto.split('\n\n').map((par, i) => (
            <p key={i}>{par}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Membro() {
  const { numero } = useParams<{ numero: string }>()
  const load = useCallback((signal: AbortSignal) => fetchCadeiraByNumber(numero ?? '', signal), [numero])
  const state = useResource<Cadeira | null>(load, null)
  if (state.loading || state.error) return <main><LoadState {...state} /></main>
  const chair = state.data
  if (!chair) return <main className="wrap"><h1 className="page-title">Cadeira não encontrada</h1><NavLink className="text-link" to="/cadeiras">Voltar às cadeiras</NavLink></main>

  const isVaga = chair.status === 'Vaga'
  const isMemoriam = chair.status === 'In memoriam'

  return (
    <main>
      {/* Breadcrumb */}
      <div className="membro-breadcrumb wrap">
        <NavLink to="/cadeiras" className="back-link">
          <ArrowLeft size={14} /> Quadro de cadeiras
        </NavLink>
      </div>

      {/* Cabeçalho do perfil */}
      <section className="membro-hero wrap">
        <div className="membro-hero-inner">
          <div className="membro-photo-wrap">
            <MemberPhotoFrame
              src={chair.image}
              alt={`Retrato de ${chair.holder}`}
              status={chair.status}
              chairNumber={chair.number}
              isVaga={isVaga}
              size="lg"
            />
          </div>

          <div className="membro-hero-meta">
            <p className="eyebrow">Cadeira · {chair.number}</p>
            <h1 className="membro-name">{isVaga ? 'Cadeira Vaga' : chair.holder}</h1>
            <span className={isMemoriam || isVaga ? 'status memorial' : 'status'}>
              {chair.status}
            </span>

            <dl className="membro-dl">
              <div>
                <dt>Patrono</dt>
                <dd>{chair.patron}</dd>
              </div>
              <div>
                <dt>Fundador</dt>
                <dd>{chair.founder}</dd>
              </div>
              {chair.posse && (
                <div>
                  <dt>Posse</dt>
                  <dd>{chair.posse}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>

      {/* Corpo */}
      <section className="membro-body wrap">
        <div className="membro-content">

          {/* Biografia */}
          {!isVaga && chair.bio && (
            <div className="membro-section">
              <p className="eyebrow">Biografia</p>
              <div className="membro-text">
                <p>{chair.bio}</p>
                {chair.bioExtra && <p>{chair.bioExtra}</p>}
              </div>
            </div>
          )}

          {isVaga && (
            <div className="membro-section membro-vaga-info">
              <p className="eyebrow">Situação da cadeira</p>
              <p className="membro-text-p">
                Esta cadeira encontra-se atualmente sem titular. A Academia Limoeirense
                de Letras realizará processo de indicação e eleição conforme seu estatuto.
              </p>
              <NavLink className="text-link" to="/contato">
                Saber mais sobre indicações <ArrowUpRight size={15} />
              </NavLink>
            </div>
          )}

          {/* Produção Literária — RF10 */}
          {chair.producao && chair.producao.length > 0 && (
            <div className="membro-section">
              <p className="eyebrow">Produção literária</p>
              <div className="producao-list">
                {chair.producao.map((item, i) => (
                  <TextoLiterario key={i} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Obras */}
          {chair.obras && chair.obras.length > 0 && (
            <div className="membro-section">
              <p className="eyebrow">Obras publicadas</p>
              <ul className="membro-obras">
                {chair.obras.map(obra => (
                  <li key={obra.titulo}>
                    <strong>{obra.titulo}</strong>
                    {obra.ano && <span>{obra.ano}</span>}
                    {obra.tipo && <em>{obra.tipo}</em>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quadro de Sucessão Histórica — RF11 */}
          {chair.sucessao && chair.sucessao.length > 0 && (
            <div className="membro-section">
              <p className="eyebrow">Quadro de sucessão histórica</p>
              <div className="sucessao-table">
                <div className="sucessao-head">
                  <span>Acadêmico</span>
                  <span>Período</span>
                  <span>Situação</span>
                </div>
                {chair.sucessao.map((s, i) => (
                  <div className="sucessao-row" key={i}>
                    <span className="sucessao-nome">{s.nome}</span>
                    <span className="sucessao-periodo">{s.periodo}</span>
                    <span className={`status status-compact ${s.status !== 'Titular' ? 'memorial' : ''}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sobre o patrono */}
          <div className="membro-section membro-patrono">
            <p className="eyebrow">Patrono da cadeira</p>
            <h2 className="membro-patrono-nome">{chair.patron}</h2>
            {chair.patronoBio && <p className="membro-text-p">{chair.patronoBio}</p>}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="membro-aside">
          <div className="membro-aside-block">
            <p className="eyebrow">Informações</p>
            <dl className="membro-aside-dl">
              <div><dt>Cadeira</dt><dd>{chair.number}</dd></div>
              <div><dt>Patrono</dt><dd>{chair.patron}</dd></div>
              <div><dt>Fundador</dt><dd>{chair.founder}</dd></div>
              <div><dt>Situação</dt><dd>{chair.status}</dd></div>
              {chair.posse && <div><dt>Posse</dt><dd>{chair.posse}</dd></div>}
            </dl>
          </div>

          <div className="membro-aside-block">
            <p className="eyebrow">Navegação</p>
            <NavLink className="text-link" to="/cadeiras">
              Ver todas as cadeiras <ArrowUpRight size={14} />
            </NavLink>
            <NavLink className="text-link" to="/acervo">
              Acervo da academia <ArrowUpRight size={14} />
            </NavLink>
            <NavLink className="text-link" to="/agenda">
              Próximos eventos <ArrowUpRight size={14} />
            </NavLink>
          </div>
        </aside>
      </section>
    </main>
  )
}
