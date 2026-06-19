import { httpClient } from '@/core/api/http.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { unwrapItem } from '@/shared/lib/api/unwrap-api-payload'

type AdminLogoutResponse = {
  logged_out: boolean
}

type ForgotPasswordRequest = {
  email: string
}

type ForgotPasswordResponse = {
  status: 'ok'
}

export async function logoutAdmin(): Promise<AdminLogoutResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.logout)
  return unwrapItem<AdminLogoutResponse>(response.data)
}

export async function forgotPasswordAdmin(
  payload: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.forgotPassword, payload)
  return unwrapItem<ForgotPasswordResponse>(response.data)
}

