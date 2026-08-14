import type {
  AiAnalytics,
  AiSubscriptionPlan,
  CreateAiPlanInput,
  UpdateAiPlanInput,
} from '@/modules/ai-chat/types/ai-chat-settings.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export const aiChatSettingsService = {
  plans: () => api.get<AiSubscriptionPlan[]>(API_ENDPOINTS.ai.plans, { params: { includeInactive: true } }),
  analytics: () => api.get<AiAnalytics>(API_ENDPOINTS.ai.analytics),
  createPlan: (payload: CreateAiPlanInput) =>
    api.post<AiSubscriptionPlan, CreateAiPlanInput>(API_ENDPOINTS.ai.plans, payload),
  updatePlan: (id: string, payload: UpdateAiPlanInput) =>
    api.patch<AiSubscriptionPlan, UpdateAiPlanInput>(API_ENDPOINTS.ai.plan(id), payload),
  removePlan: (id: string) => api.delete<{ message: string }>(API_ENDPOINTS.ai.plan(id)),
}
