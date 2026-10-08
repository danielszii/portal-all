import { adminRequest } from './admin.js'
import { invalidateInstituicao, type InstituicaoResponse } from './api.js'

type InstitutionInfo = NonNullable<InstituicaoResponse['info']>
export type AdminInstitution = InstitutionInfo & { id: string; atualizadoEm: string }
export type InstitutionValues = { [Field in keyof InstitutionInfo]: string }
type InstitutionResult = { info: AdminInstitution | null }

export const loadAdminInstitution = (signal?: AbortSignal) => adminRequest<InstitutionResult>('/instituicao', { signal })

export function institutionValues(info: AdminInstitution | null): InstitutionValues {
  return {
    nome: info?.nome ?? '', historia: info?.historia ?? '', missao: info?.missao ?? '',
    endereco: info?.endereco ?? '', email: info?.email ?? '', telefone: info?.telefone ?? '',
    fundacaoAno: info?.fundacaoAno == null ? '' : String(info.fundacaoAno),
    sedeTexto: info?.sedeTexto ?? '', trajetoriaTexto: info?.trajetoriaTexto ?? '', horarioAtendimento: info?.horarioAtendimento ?? '',
  }
}

export async function saveAdminInstitution(values: InstitutionValues, atualizadoEm: string | null, csrfToken: string) {
  const result = await adminRequest<{ info: AdminInstitution }>('/instituicao', {
    method: 'PUT', csrfToken,
    body: { ...values, fundacaoAno: values.fundacaoAno.trim() ? Number(values.fundacaoAno) : null, atualizadoEm },
  })
  invalidateInstituicao()
  return result
}
