import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type {
  AiQrCodesResponse,
  CreateAiQrCodesRequest,
  PointsOfSaleResponse,
} from '@/modules/ai-qr-codes/types/ai-qr-codes.types'

export const aiQrCodesService = {
  list: (page: number, perPage: number) =>
    api.get<AiQrCodesResponse>(API_ENDPOINTS.qrCodes.list, {
      params: { Page: page, PerPage: perPage, qrType: 8 },
    }),
  createBulk: (payload: CreateAiQrCodesRequest) =>
    api.post<unknown, CreateAiQrCodesRequest>(API_ENDPOINTS.qrCodes.bulk, payload),
  pointsOfSale: () =>
    api.get<PointsOfSaleResponse>(API_ENDPOINTS.pointsOfSale.list, {
      params: { Page: 1, PerPage: 200 },
    }),
}
