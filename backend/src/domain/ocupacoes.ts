type Ocupacao = {
  id?: string
  fundador?: boolean
  vigente: boolean
  inicioAno: number | null
  inicioEm?: Date | string | null
  fimAno?: number | null
  fimEm?: Date | string | null
}

function dateKey(date: Date | string | null | undefined, year: number | null | undefined) {
  return date ? (date instanceof Date ? date.toISOString() : date).slice(0, 10) : `${String(year ?? 0).padStart(4, '0')}-00-00`
}

// A mesma ordem é usada no portal, nos destaques e no painel. Não depende da
// ordem incidental do banco; datas desconhecidas precedem datas conhecidas.
export function ordenarOcupacoes<T extends Ocupacao>(ocupacoes: readonly T[]): T[] {
  return [...ocupacoes].sort((a, b) =>
    Number(a.vigente) - Number(b.vigente)
    || Number(Boolean(b.fundador)) - Number(Boolean(a.fundador))
    || dateKey(a.inicioEm, a.inicioAno).localeCompare(dateKey(b.inicioEm, b.inicioAno))
    || dateKey(a.fimEm, a.fimAno).localeCompare(dateKey(b.fimEm, b.fimAno))
    || (a.id ?? '').localeCompare(b.id ?? ''))
}

export function situacaoCadeira<T extends Ocupacao & { academico: { inMemoriam?: boolean } }>(rows: readonly T[]) {
  const ocupacoes = ordenarOcupacoes(rows)
  const atual = ocupacoes.find(o => o.vigente)
  const ultimo = ocupacoes.at(-1)
  const membro: T['academico'] | undefined = atual?.academico ?? (ultimo?.academico.inMemoriam ? ultimo.academico : undefined)
  return { ocupacoes, atual, membro, status: atual ? 'Titular em exercício' : membro?.inMemoriam ? 'In memoriam' : 'Vaga' }
}
