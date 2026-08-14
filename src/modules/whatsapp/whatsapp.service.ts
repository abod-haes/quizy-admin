import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export type WhatsAppSessionStatus = {
  sessionId: string
  status: string
  isConnected: boolean
  phoneNumber: string | null
  displayName: string | null
  lastConnectedAt: string | null
  lastDisconnectedAt: string | null
  disconnectReason: string | null
  lastError: string | null
  updatedAt: string | null
  qrDataUrl: string | null
}

export type WhatsAppReadiness = {
  status: 'ok' | 'degraded' | string
  services: {
    database: string
    redis: string
    worker: string
    whatsapp: string
    whatsappSocket: string
  }
  time: string
}

export type WhatsAppControlAction = 'start' | 'reconnect' | 'stop' | 'logout'

export type WhatsAppControlResponse = {
  accepted: boolean
  action: WhatsAppControlAction
  sessionId: string
}

export const whatsappService = {
  sessionStatus: () =>
    api.get<WhatsAppSessionStatus>(API_ENDPOINTS.whatsapp.sessionStatus),
  readiness: () =>
    api.get<WhatsAppReadiness>(API_ENDPOINTS.health.ready),
  control: (action: WhatsAppControlAction) =>
    api.post<WhatsAppControlResponse>(API_ENDPOINTS.whatsapp[action]),
}
