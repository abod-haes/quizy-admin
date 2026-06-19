import { httpClient } from '@/core/api/http.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { unwrapItem } from '@/shared/lib/api/unwrap-api-payload'

export type AdminLoginRequest = {
  email: string
  password: string
  device_name?: string
}

export type AdminLoginUser = {
  id: number | string
  name: string
  email: string
  is_active: boolean
}

export type AdminLoginResponse = {
  token: string
  token_type: 'Bearer'
  user: AdminLoginUser
}

export async function loginAdmin(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
  const response = await httpClient.post(API_ENDPOINTS.auth.login, payload)
  return unwrapItem<AdminLoginResponse>(response.data)
}
