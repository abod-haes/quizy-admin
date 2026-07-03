import { api } from '@/shared/api/api-client'
import type { PagedResponse, UUID } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export type ContentResource = {
  id: UUID
  entityId?: UUID | null
  url?: string | null
  filePath?: string | null
  isImage?: boolean | null
}

type ApiEnvelope<T> = T | { data: T }

type ResourcesPayload = PagedResponse<ContentResource> | ContentResource[]

const DEFAULT_RESOURCE_PAGE_SIZE = 20

export function unwrapApiPayload<T>(payload: ApiEnvelope<T>): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data
  }

  return payload as T
}

function createImageResourceFormData(entityId: string | null | undefined, file: File): FormData {
  const formData = new FormData()

  if (entityId) {
    formData.append('EntityId', entityId)
    formData.append('IsImage', 'true')
  }

  formData.append('File', file)

  return formData
}

function normalizeResourcesResponse(payload: ResourcesPayload): PagedResponse<ContentResource> {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      totalCount: payload.length,
      pageNumber: 1,
      pageSize: payload.length,
    }
  }

  return payload
}

export async function getContentResourcesByEntity(
  entityId: string,
): Promise<PagedResponse<ContentResource>> {
  const response = await api.get<ApiEnvelope<ResourcesPayload>>(
    API_ENDPOINTS.resources.byEntity(entityId),
    { params: { Page: 1, PerPage: DEFAULT_RESOURCE_PAGE_SIZE } },
  )

  return normalizeResourcesResponse(unwrapApiPayload(response))
}

export async function uploadContentResource(payload: {
  entityId: string
  file: File
}): Promise<ContentResource> {
  const response = await api.upload<ApiEnvelope<ContentResource>>(
    API_ENDPOINTS.resources.upload,
    createImageResourceFormData(payload.entityId, payload.file),
  )

  return unwrapApiPayload(response)
}

export async function updateContentResourceFile(payload: {
  id: string
  entityId?: string | null
  file: File
}): Promise<ContentResource> {
  const response = await api.put<ApiEnvelope<ContentResource>, FormData>(
    API_ENDPOINTS.resources.update(payload.id),
    createImageResourceFormData(payload.entityId, payload.file),
  )

  return unwrapApiPayload(response)
}

export async function deleteContentResource(id: string): Promise<void> {
  await api.delete<void>(API_ENDPOINTS.resources.remove(id))
}
