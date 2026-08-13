import type { PagedResponse, UUID } from '@/shared/api/api.types'

export type QrGrantKind = 'COURSE' | 'QUIZ' | 'AI_SUBSCRIPTION'
export type QrGrantMode = 'SELECTED' | 'ALL'

export type UnifiedQrGrant = {
  kind: QrGrantKind
  mode?: QrGrantMode
  entityIds?: UUID[]
  planId?: UUID
}

export type CreateUnifiedQrRequest = {
  grants: UnifiedQrGrant[]
  count?: number
  pointOfSaleId?: UUID
  validDays?: number
}

export type UnifiedQrItem = {
  id: UUID
  code: string
  qrType?: number
  qrPayload?: string | null
  validUntil?: string | null
  createdAt?: string | null
  redeemed?: boolean | null
  pointOfSaleId?: UUID | null
  type?: { key?: string; label?: string } | null
  grants?: Array<{
    kind: QrGrantKind
    mode: QrGrantMode
    items?: Array<{ id: UUID; name?: string | null; title?: string | null }>
    plan?: { id: UUID; code?: string | null; name?: string | null } | null
  }>
  activation?: {
    kinds?: QrGrantKind[]
  } | null
}

export type CreateUnifiedQrResponse = {
  count: number
  items: UnifiedQrItem[]
}

export type UnifiedQrListResponse = PagedResponse<UnifiedQrItem>

export type PointOfSaleOption = {
  id: UUID
  name?: string | null
  location?: string | null
  qrCodeCount?: number | null
}

export type CatalogOption = {
  id: UUID
  name?: string | null
  title?: string | null
}

export type AiPlanOption = {
  id: UUID
  code: string
  name: string
  isActive?: boolean
  isFree?: boolean
}
