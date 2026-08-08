export type AiSubscriptionPlan = {
  id: string
  code: string
  name: string
  description: string | null
  tokenLimit: number
  tokenResetDays: number
  subscriptionDurationDays: number | null
  isFree: boolean
  isActive: boolean
  sortOrder: number
  createdAt?: string | null
  updatedAt?: string | null
}

export type AiPlanInput = {
  code?: string
  name: string
  description?: string
  tokenLimit: number
  tokenResetDays: number
  subscriptionDurationDays?: number | null
  isFree?: boolean
  isActive?: boolean
  sortOrder?: number
}

export type AiAnalytics = {
  range: { from: string; to: string }
  summary: {
    activeUsers: number
    conversations: number
    questions: number
    answers: number
    failedMessages: number
    totalTokens: number
  }
  feedback: {
    helpful: number
    notHelpful: number
    total: number
  }
  daily: Array<{
    day: string
    questions: number
    answers: number
    failedMessages: number
    totalTokens: number
  }>
  plans: Array<{
    planId: string
    code: string
    name: string
    isFree: boolean
    activeSubscriptions: number
    tokensUsedInCurrentPeriods: number
  }>
  topDocuments: Array<{
    documentId: string | null
    name: string | null
    selectionCount: number
  }>
}
