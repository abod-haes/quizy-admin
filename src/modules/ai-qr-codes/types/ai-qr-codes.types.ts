import type { PagedResponse, UUID } from '@/shared/api/api.types'

export const AiSubscriptionPlan = {
  Plus: 1,
  Pro: 2,
  Ultra: 3,
} as const

export type AiSubscriptionPlan =
  (typeof AiSubscriptionPlan)[keyof typeof AiSubscriptionPlan]

export type AiQrCode = {
  id: UUID
  code?: string | null
  qrCode?: string | null
  aiSubscriptionPlan?: AiSubscriptionPlan | null
  pointOfSaleId?: UUID | null
  pointOfSaleName?: string | null
  pointOfSale?: { id?: UUID; name?: string | null } | null
  studentId?: UUID | null
  studentName?: string | null
  isAssigned?: boolean | null
  isActive?: boolean | null
  createdAt?: string | null
}

export type PointOfSaleOption = {
  id: UUID
  name?: string | null
  title?: string | null
  code?: string | null
}

export type CreateAiQrCodesRequest = {
  count: number
  subjectId: UUID
  pointOfSaleId: UUID
  qrType: 8
  aiSubscriptionPlan: AiSubscriptionPlan
}

export type AiQrCodesResponse = PagedResponse<AiQrCode>
export type PointsOfSaleResponse = PagedResponse<PointOfSaleOption>
