import type { PagedResponse } from '@/shared/api/api.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export type PointOfSale = {
  id: string
  name: string
  location: string | null
  qrCodeCount: number
  createdAt?: string | null
  updatedAt?: string | null
}

export type PointOfSaleInput = {
  name: string
  location: string
}

export const pointsOfSaleService = {
  list: (params: { page?: number; perPage?: number; search?: string }) =>
    api.get<PagedResponse<PointOfSale>>(API_ENDPOINTS.pointsOfSale.list, { params }),
  create: (payload: PointOfSaleInput) =>
    api.post<PointOfSale, PointOfSaleInput>(API_ENDPOINTS.pointsOfSale.create, payload),
  update: (id: string, payload: PointOfSaleInput) =>
    api.patch<PointOfSale, PointOfSaleInput>(API_ENDPOINTS.pointsOfSale.update(id), payload),
  remove: (id: string) =>
    api.delete<{ message: string }>(API_ENDPOINTS.pointsOfSale.remove(id)),
}
