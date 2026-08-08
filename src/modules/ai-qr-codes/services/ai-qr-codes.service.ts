import type {
  AiPlanOption,
  CatalogOption,
  CreateUnifiedQrRequest,
  CreateUnifiedQrResponse,
  PointOfSaleOption,
  UnifiedQrListResponse,
} from '@/modules/ai-qr-codes/types/ai-qr-codes.types'
import type { PagedResponse } from '@/shared/api/api.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export const aiQrCodesService = {
  list: (page: number, perPage: number) =>
    api.get<UnifiedQrListResponse>(API_ENDPOINTS.qrCodes.list, {
      params: { page, perPage },
    }),
  create: (payload: CreateUnifiedQrRequest) =>
    api.post<CreateUnifiedQrResponse, CreateUnifiedQrRequest>(API_ENDPOINTS.qrCodes.create, payload),
  remove: (id: string) => api.delete<{ message: string }>(API_ENDPOINTS.qrCodes.remove(id)),
  pointsOfSale: () =>
    api.get<PagedResponse<PointOfSaleOption>>(API_ENDPOINTS.pointsOfSale.list, {
      params: { page: 1, perPage: 100 },
    }),
  courses: () =>
    api.get<PagedResponse<CatalogOption>>(API_ENDPOINTS.courses.list, {
      params: { page: 1, perPage: 100 },
    }),
  quizzes: () =>
    api.get<PagedResponse<CatalogOption>>(API_ENDPOINTS.quizzes.list, {
      params: { page: 1, perPage: 100 },
    }),
  plans: () => api.get<AiPlanOption[]>(API_ENDPOINTS.ai.plans, { params: { includeInactive: false } }),
}
