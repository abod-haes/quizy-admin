import type { PagedResponse } from '@/shared/api/api.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export type AdminResource = {
  id: string
  entityId: string | null
  role: string | null
  kind: string | null
  visibility: 'PUBLIC' | 'PRIVATE' | string | null
  status: string | null
  originalName: string | null
  extension: string | null
  mimeType: string | null
  sizeBytes: number | null
  url: string | null
  thumbnailUrl: string | null
  contentUrl: string | null
  filePath: string | null
  isImage: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export const resourcesService = {
  list: (page: number, perPage: number) =>
    api.get<PagedResponse<AdminResource>>(API_ENDPOINTS.resources.list, {
      params: { Page: page, PerPage: perPage },
    }),
  upload: (file: File, visibility: 'PUBLIC' | 'PRIVATE') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('visibility', visibility)
    return api.upload<AdminResource>(API_ENDPOINTS.resources.upload, formData)
  },
  remove: (id: string) => api.delete<{ message: string }>(API_ENDPOINTS.resources.remove(id)),
  download: (id: string) => api.downloadBlob(API_ENDPOINTS.resources.content(id)),
}
