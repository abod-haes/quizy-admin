import { httpClient } from '@/core/api/http.services'
import type { AdminLoginResponse } from '@/modules/auth/services/login.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { getAuthRefreshToken } from '@/shared/lib/auth-storage'
import { unwrapItem } from '@/shared/lib/api/unwrap-api-payload'

type AdminLogoutResponse = {
  message?: string
}

export type AdminRegisterRequest = Record<string, unknown>
export type AdminRegisterResponse = Partial<AdminLoginResponse> & {
  message?: string
  status?: string
  success?: boolean
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

// Retained only for old, unrouted template code while the dashboard cutover is in progress.
export async function registerAdmin(
  payload: AdminRegisterRequest,
): Promise<AdminRegisterResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.register, payload)
  return unwrapItem<AdminRegisterResponse>(response.data)
}

export async function forgotPasswordAdmin(
  payload: ForgotPasswordRequest,
): Promise<AdminMessageResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.forgotPassword, payload)
  return unwrapItem<AdminMessageResponse>(response.data)
}
