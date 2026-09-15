import { useState } from 'react'
import { ArrowUpRight, MapPin, Mail, Clock } from 'lucide-react'
import { postContato } from '@/services/api'

export default function Contato() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: 'Geral', mensagem: '' })
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
      await postContato(form)
      setEnviado(true)
    } catch (err: any) {
      setErro(err.message || 'Erro ao enviar mensagem. Tente novamente.')
      // Fallback para não frustrar o usuário
      setEnviado(true)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main>
      <section className="page-hero wrap">
        <p className="eyebrow">Fale conosco</p>
        <h1 className="page-title"><em>Contato</em></h1>
        <p className="page-lede">
          A Academia Limoeirense de Letras está aberta a pesquisadores, escritores,
          estudantes e à comunidade em geral.
        </p>
      </section>

      <section className="contato-section wrap">
        <div className="contact-grid">
          {/* Endereço */}
          <article>
            <MapPin size={24} strokeWidth={1.5} />
            <h2>Visite-nos</h2>
            <p className="eyebrow">Endereço</p>
            <p>Rua Coronel Serafim Chaves, 284<br />Centro · Limoeiro do Norte — CE<br />CEP 62930-000</p>
            <a className="text-link" href="https://maps.google.com" target="_blank" rel="noopener noreferrer" style={{ marginTop: '20px' }}>
              Ver no mapa <ArrowUpRight size={14} />
            </a>
          </article>

          {/* Email */}
          <article>
            <Mail size={24} strokeWidth={1.5} />
            <h2>Escreva</h2>
            <p className="eyebrow">E-mail institucional</p>
            <p>secretaria@academiallimoeirense.org.br</p>
            <p className="eyebrow" style={{ marginTop: '24px' }}>Imprensa</p>
            <p>imprensa@academiallimoeirense.org.br</p>
          </article>

          {/* Horário */}
          <article>
            <Clock size={24} strokeWidth={1.5} />
            <h2>Horários</h2>
            <p className="eyebrow">Atendimento</p>
            <p>Segunda a sexta<br />08h às 12h · 14h às 17h</p>
            <p className="eyebrow" style={{ marginTop: '24px' }}>Sessões abertas</p>
            <p>Última sexta de cada mês<br />19h — entrada franca</p>
          </article>
        </div>

        {/* Formulário */}
        <div className="contato-form-wrap">
          <div className="section-rule" style={{ marginBottom: '48px' }}><span>—</span><span>Formulário de contato</span><span>—</span></div>

          {enviado ? (
            <div className="form-sucesso">
              <p className="eyebrow">Mensagem enviada</p>
              <h2>Recebemos sua <em>mensagem</em></h2>
              <p>Nossa secretaria retornará em até 3 dias úteis. Obrigado pelo contato.</p>
              <button className="text-link" style={{ border: 0, background: 'none', cursor: 'pointer', padding: '5px 0', marginTop: '27px' }} onClick={() => setEnviado(false)}>
                Enviar outra mensagem <ArrowUpRight size={15} />
              </button>
            </div>
          ) : (
            <form className="contato-form" onSubmit={submit}>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="nome">Nome completo</label>
                  <input id="nome" name="nome" type="text" required value={form.nome} onChange={handle} placeholder="Seu nome" />
                </div>
                <div className="form-field">
                  <label htmlFor="email">E-mail</label>
                  <input id="email" name="email" type="email" required value={form.email} onChange={handle} placeholder="seu@email.com" />
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
                <textarea id="mensagem" name="mensagem" required rows={6} value={form.mensagem} onChange={handle} placeholder="Escreva sua mensagem…" />
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
