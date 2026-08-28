import { api } from '@/shared/api/api-client'
import type { DashboardOverview } from './dashboard.types'

const DASHBOARD_OVERVIEW_ENDPOINT = '/api/v1/admin/dashboard/overview'

export async function getDashboardOverview(days = 30): Promise<DashboardOverview> {
  const normalizedDays = Math.min(90, Math.max(7, Math.trunc(days)))
  return api.get<DashboardOverview>(`${DASHBOARD_OVERVIEW_ENDPOINT}?days=${normalizedDays}`)
}
