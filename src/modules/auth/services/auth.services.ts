import { httpClient } from '@/core/api/http.services'
import type { AdminLoginResponse } from '@/modules/auth/services/login.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { unwrapItem } from '@/shared/lib/api/unwrap-api-payload'

type AdminLogoutResponse = {
  logged_out: boolean
}

export type AdminRegisterRequest = Record<string, unknown>

export type AdminRegisterResponse = Partial<AdminLoginResponse> & {
  message?: string
  status?: string
  success?: boolean
}

export type ForgotPasswordRequest = {
  email: string
}

export type AdminMessageResponse = {
  message?: string
  status?: string
  success?: boolean
}

export async function logoutAdmin(): Promise<AdminLogoutResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.logout)
  return unwrapItem<AdminLogoutResponse>(response.data)
}

export async function registerAdmin(
  payload: AdminRegisterRequest
): Promise<AdminRegisterResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.register, payload)
  return unwrapItem<AdminRegisterResponse>(response.data)
}

export async function forgotPasswordAdmin(
  payload: ForgotPasswordRequest
): Promise<AdminMessageResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.forgotPassword, payload)
  return unwrapItem<AdminMessageResponse>(response.data)
}
