import { httpClient } from '@/core/api/http.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { getAuthRefreshToken } from '@/shared/lib/auth-storage'
import { unwrapItem } from '@/shared/lib/api/unwrap-api-payload'

type AdminLogoutResponse = {
  message?: string
}

export type ForgotPasswordRequest = {
  phoneNumber: string
  countryCallingCode: string
}

export type AdminMessageResponse = {
  message?: string
  status?: string
  success?: boolean
}

export async function logoutAdmin(): Promise<AdminLogoutResponse> {
  const refreshToken = getAuthRefreshToken()
  if (!refreshToken) return { message: 'No active refresh token.' }
  const response = await httpClient.post(API_ENDPOINTS.auth.revokeToken, { refreshToken })
  return unwrapItem<AdminLogoutResponse>(response.data)
}

export async function forgotPasswordAdmin(
  payload: ForgotPasswordRequest,
): Promise<AdminMessageResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.forgotPassword, payload)
  return unwrapItem<AdminMessageResponse>(response.data)
}
