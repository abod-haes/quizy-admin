import type {
  AiAnalytics,
  AiPlanInput,
  AiSubscriptionPlan,
} from '@/modules/ai-chat/types/ai-chat-settings.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export const aiChatSettingsService = {
  plans: () => api.get<AiSubscriptionPlan[]>(API_ENDPOINTS.ai.plans, { params: { includeInactive: true } }),
  analytics: () => api.get<AiAnalytics>(API_ENDPOINTS.ai.analytics),
  createPlan: (payload: AiPlanInput & { code: string }) =>
    api.post<AiSubscriptionPlan, AiPlanInput & { code: string }>(API_ENDPOINTS.ai.plans, payload),
  updatePlan: (id: string, payload: AiPlanInput) =>
    api.patch<AiSubscriptionPlan, AiPlanInput>(API_ENDPOINTS.ai.plan(id), payload),
  removePlan: (id: string) => api.delete<{ message: string }>(API_ENDPOINTS.ai.plan(id)),
}
