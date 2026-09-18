import { useResource } from '@/hooks/useResource'
import { fetchInstituicao } from '@/services/api'
import { useState } from 'react'
import { ArrowUpRight, MapPin, Mail, Clock } from 'lucide-react'
import { postContato } from '@/services/api'

export default function Contato() {
  const institution = useResource(fetchInstituicao, { info: null, gestao: null })
  const info = institution.data.info
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' })
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const resposta = await postContato(form)
      if (!resposta.sucesso) throw new Error('Não foi possível confirmar o envio.')
      setEnviado(true)
      setForm({ nome: '', email: '', assunto: '', mensagem: '' })
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar mensagem. Tente novamente.')
      setEnviado(false)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main>
      <section className="page-hero wrap">
        <h1 className="page-title"><em>Contato</em></h1>
        <p className="page-lede">
          A Academia Limoeirense de Letras está aberta a pesquisadores, escritores,
          estudantes e à comunidade em geral.
        </p>
      </section>

      <section className="contato-section wrap">
        {institution.error && <p role="status">Não foi possível carregar os dados institucionais. <button type="button" className="text-link" onClick={institution.retry}>Tentar novamente</button></p>}
        <div className="contact-grid">
          {/* Endereço */}
          <article>
            <MapPin size={24} strokeWidth={1.5} />
            <h2>Visite-nos</h2>
            <p className="eyebrow">Endereço</p>
            <p>{info?.endereco ?? 'Endereço ainda não disponibilizado.'}</p>
            <a className="text-link contact-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info?.endereco ?? 'Academia Limoeirense de Letras')}`} target="_blank" rel="noopener noreferrer">
              Ver no mapa <ArrowUpRight size={14} />
            </a>
          </article>

          {/* Email */}
          <article>
            <Mail size={24} strokeWidth={1.5} />
            <h2>Escreva</h2>
            <p className="eyebrow">E-mail institucional</p>
            <p>{info?.email ?? 'E-mail ainda não disponibilizado.'}</p>
            <p className="eyebrow contact-subheading">Imprensa</p>
            <p>{info?.email ?? 'Use o formulário abaixo.'}</p>
          </article>

          {/* Horário */}
          <article>
            <Clock size={24} strokeWidth={1.5} />
            <h2>Horários</h2>
            <p className="eyebrow">Atendimento</p>
            <p>{info?.horarioAtendimento ?? 'Consulte a secretaria.'}</p>
            <p className="eyebrow contact-subheading">Sessões abertas</p>
            <p>Consulte a agenda de eventos</p>
          </article>
        </div>

        {/* Formulário */}
        <div className="contato-form-wrap">
          <div className="section-rule form-section-rule"><span>—</span><span>Formulário de contato</span><span>—</span></div>

          {enviado ? (
            <div className="form-sucesso">
              <p className="eyebrow">Mensagem enviada</p>
              <h2>Recebemos sua <em>mensagem</em></h2>
              <p>Nossa secretaria retornará em até 3 dias úteis. Obrigado pelo contato.</p>
              <button className="text-link text-link-button" onClick={() => setEnviado(false)}>
                Enviar outra mensagem <ArrowUpRight size={15} />
              </button>
            </div>
          ) : (
            <form className="contato-form" onSubmit={submit}>
              {erro && <p role="alert">{erro}</p>}
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="nome">Nome completo</label>
                  <input id="nome" name="nome" type="text" maxLength={120} required value={form.nome} onChange={handle} placeholder="Seu nome" />
                </div>
                <div className="form-field">
                  <label htmlFor="email">E-mail</label>
                  <input id="email" name="email" type="email" maxLength={254} required value={form.email} onChange={handle} placeholder="seu@email.com" />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="assunto">Assunto</label>
                <select id="assunto" name="assunto" required value={form.assunto} onChange={handle}>
                  <option value="">Selecione um assunto</option>
                  <option>Informações institucionais</option>
                  <option>Publicações e acervo</option>
                  <option>Associação e cadeiras</option>
                  <option>Imprensa e mídia</option>
                  <option>Outros</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="mensagem">Mensagem</label>
                <textarea id="mensagem" name="mensagem" maxLength={5000} required rows={6} value={form.mensagem} onChange={handle} placeholder="Escreva sua mensagem…" />
              </div>
              <button type="submit" className="form-submit" disabled={enviando}>
                {enviando ? 'Enviando mensagem...' : <>Enviar mensagem <ArrowUpRight size={15} /></>}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
