import { fetchPortalContent } from '@/services/api'
import { useResource } from './useResource'

export function usePortalContent() {
  return useResource(fetchPortalContent, null)
}
