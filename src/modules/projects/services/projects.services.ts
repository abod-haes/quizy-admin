import { httpClient } from '@/core/api/http.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { unwrapItem, unwrapPaginatedList, type PaginatedListResult } from '@/shared/lib/api/unwrap-api-payload'
import { toAdminListQueryParams, type AdminListFilters, type AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'
import type { ProjectsEntity, ProjectsCreatePayload, ProjectsUpdatePayload } from '@/modules/projects/types/projects.type'

export async function listProjects(
  filters: AdminListFilters = {},
  pagination: AdminListPagination = {}
): Promise<PaginatedListResult<ProjectsEntity>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.projects.list, {
    params: toAdminListQueryParams(filters, pagination),
  })
  return unwrapPaginatedList<ProjectsEntity>(response.data)
}

export async function getProjects(identifier: string | number): Promise<ProjectsEntity> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.projects.detail.replace(':id', String(identifier)))
  return unwrapItem<ProjectsEntity>(response.data)
}

export async function createProjects(payload: ProjectsCreatePayload): Promise<ProjectsEntity> {
  const response = await httpClient.post<unknown>(API_ENDPOINTS.projects.create, payload)
  return unwrapItem<ProjectsEntity>(response.data)
}

export async function updateProjects(identifier: string | number, payload: ProjectsUpdatePayload): Promise<ProjectsEntity> {
  const response = await httpClient.patch<unknown>(API_ENDPOINTS.projects.update.replace(':id', String(identifier)), payload)
  return unwrapItem<ProjectsEntity>(response.data)
}

export async function replaceProjects(identifier: string | number, payload: ProjectsUpdatePayload): Promise<ProjectsEntity> {
  const response = await httpClient.put<unknown>(API_ENDPOINTS.projects.update.replace(':id', String(identifier)), payload)
  return unwrapItem<ProjectsEntity>(response.data)
}

export async function reorderProjects(items: Array<{ id: number; sort_order: number }>): Promise<void> {
  await httpClient.patch(API_ENDPOINTS.projects.reorder, { items })
}

export async function removeProjects(identifier: string | number): Promise<void> {
  await httpClient.delete(API_ENDPOINTS.projects.remove.replace(':id', String(identifier)))
}

export async function addProjectsMedia(
  identifier: string | number,
  payload: { file: File; collection: string; name: string }
): Promise<ProjectsEntity> {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('collection', payload.collection)
  formData.append('name', payload.name)

  const response = await httpClient.post<unknown>(
    API_ENDPOINTS.projects.addMedia.replace(':id', String(identifier)),
    formData
  )
  return unwrapItem<ProjectsEntity>(response.data)
}

export async function removeProjectsMedia(
  identifier: string | number,
  mediaId: string | number
): Promise<void> {
  await httpClient.delete(
    API_ENDPOINTS.projects.removeMedia
      .replace(':id', String(identifier))
      .replace(':mediaId', String(mediaId))
  )
}
