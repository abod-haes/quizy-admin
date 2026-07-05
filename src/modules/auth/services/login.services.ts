import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { normalizeCountryCallingCode, trimCountryCode } from '@/modules/auth/utils/quizy-auth-flow.utils'

export type AdminLoginUser = {
  id: number | string
  name: string
  email: string
  is_active?: boolean
} & Record<string, unknown>

export type LoginRequest = {
  phoneNumber: string
  password: string
  countryCallingCode?: string
}

export type LoginResponse = {
  message?: string | null
  isAuthenticated: boolean
  requiresVerification: boolean
  userId: string
  token?: string | null
  phoneNumber?: string | null
  countryCallingCode?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  user?: AdminLoginUser | null
}

export type AdminLoginResponse = LoginResponse

export async function loginAdmin(payload: LoginRequest): Promise<LoginResponse> {
  const countryCallingCode = normalizeCountryCallingCode(payload.countryCallingCode)
  return api.post<LoginResponse, LoginRequest>(API_ENDPOINTS.auth.login, {
    ...payload,
    phoneNumber: trimCountryCode(payload.phoneNumber, countryCallingCode),
    countryCallingCode,
  })
}
