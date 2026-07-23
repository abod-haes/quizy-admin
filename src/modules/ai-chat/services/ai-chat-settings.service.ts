import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type { AiChatSettings } from '@/modules/ai-chat/types/ai-chat-settings.types'

export const aiChatSettingsService = {
  get: () => api.get<AiChatSettings>(API_ENDPOINTS.aiChat.settings),
  update: (payload: AiChatSettings) =>
    api.put<AiChatSettings, AiChatSettings>(API_ENDPOINTS.aiChat.settings, payload),
}
