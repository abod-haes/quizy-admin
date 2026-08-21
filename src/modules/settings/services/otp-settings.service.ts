import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export type OtpClient = {
  id: string
  name: string
  slug: string
  isActive: boolean
  hourlyOtpLimit: number
  dailyOtpLimit: number
  apiKeyCount: number
  createdAt: string
}

export type OtpApiKey = {
  id: string
  name: string
  prefix: string
  status: string
  expiresAt: string | null
  lastUsedAt: string | null
  createdAt: string
  client: { id: string; name: string; slug: string }
}

export type CreatedOtpApiKey = {
  id: string
  name: string
  clientId: string
  prefix: string
  apiKey: string
  warning?: string
}

export type OtpRequest = {
  requestId: string
  phoneNumber: string
  purpose: string
  status: string
  attempts: number
  maxAttempts: number
  failureReason?: string | null
  createdAt: string
  sentAt?: string | null
  verifiedAt?: string | null
  expiresAt?: string | null
  client?: { id: string; name: string; slug: string }
}

export type OtpDashboardSummary = {
  worker: { status: string; heartbeatAt: string | null }
  today: { sent: number; verified: number; failed: number; expired: number; successRate: number }
  recent: Array<Pick<OtpRequest, 'requestId' | 'phoneNumber' | 'purpose' | 'status' | 'createdAt'>>
}

export type CreateOtpClientPayload = {
  name: string
  slug: string
  hourlyOtpLimit?: number
  dailyOtpLimit?: number
}

export type UpdateOtpClientPayload = Partial<Pick<OtpClient, 'name' | 'isActive' | 'hourlyOtpLimit' | 'dailyOtpLimit'>>

export type CreateOtpApiKeyPayload = {
  clientId: string
  name: string
  expiresAt?: string
}

export const otpSettingsService = {
  summary: () => api.get<OtpDashboardSummary>(API_ENDPOINTS.otp.dashboardSummary),
  clients: () => api.get<OtpClient[]>(API_ENDPOINTS.otp.clients),
  createClient: (payload: CreateOtpClientPayload) => api.post<OtpClient, CreateOtpClientPayload>(API_ENDPOINTS.otp.clients, payload),
  updateClient: (id: string, payload: UpdateOtpClientPayload) => api.put<OtpClient, UpdateOtpClientPayload>(API_ENDPOINTS.otp.client(id), payload),
  apiKeys: () => api.get<OtpApiKey[]>(API_ENDPOINTS.otp.apiKeys),
  createApiKey: (payload: CreateOtpApiKeyPayload) => api.post<CreatedOtpApiKey, CreateOtpApiKeyPayload>(API_ENDPOINTS.otp.apiKeys, payload),
  revokeApiKey: (id: string) => api.post<{ message: string }, Record<string, never>>(API_ENDPOINTS.otp.revokeApiKey(id), {}),
  requests: (page = 1, perPage = 10) => api.get<PagedResponse<OtpRequest>>(API_ENDPOINTS.otp.requests, { params: { page, perPage } }),
}
