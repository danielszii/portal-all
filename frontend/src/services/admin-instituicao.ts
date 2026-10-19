import { adminRequest } from './admin.js'
import { invalidateInstituicao, type InstituicaoResponse } from './api.js'

type InstitutionInfo = NonNullable<InstituicaoResponse['info']>
export type AdminInstitution = InstitutionInfo & { id: string; atualizadoEm: string }
type InstitutionTextField = Exclude<keyof InstitutionInfo, 'redesSociais'>
export type InstitutionValues = { [Field in InstitutionTextField]-?: string } & {
  redesSociais: NonNullable<InstitutionInfo['redesSociais']>
}
type InstitutionResult = { info: AdminInstitution | null }

export const loadAdminInstitution = (signal?: AbortSignal) => adminRequest<InstitutionResult>('/instituicao', { signal })

export function institutionValues(info: AdminInstitution | null): InstitutionValues {
  return {
    nome: info?.nome ?? '', historia: info?.historia ?? '', missao: info?.missao ?? '',
    endereco: info?.endereco ?? '', email: info?.email ?? '', telefone: info?.telefone ?? '',
    fundacaoAno: info?.fundacaoAno == null ? '' : String(info.fundacaoAno),
    sedeTexto: info?.sedeTexto ?? '', trajetoriaTexto: info?.trajetoriaTexto ?? '', horarioAtendimento: info?.horarioAtendimento ?? '',
    emailImprensa: info?.emailImprensa ?? '', mapaUrl: info?.mapaUrl ?? '', redesSociais: info?.redesSociais ?? [],
  }
}

export async function saveAdminInstitution(values: InstitutionValues, atualizadoEm: string | null, csrfToken: string) {
  const result = await adminRequest<{ info: AdminInstitution }>('/instituicao', {
    method: 'PUT', csrfToken,
    body: {
      ...values,
      fundacaoAno: values.fundacaoAno.trim() ? Number(values.fundacaoAno) : null,
      redesSociais: values.redesSociais.filter(link => link.nome.trim() || link.url.trim()),
      atualizadoEm,
    },
  })
  invalidateInstituicao()
  return result
}
