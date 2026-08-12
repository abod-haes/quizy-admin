import { api } from '@/shared/api/api-client'
import { normalizeCountryCallingCode, trimCountryCode } from '@/modules/auth/utils/quizy-auth-flow.utils'

const ADMIN_LOGIN_ENDPOINT = '/api/v1/admin/auth/login'

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
  return api.post<LoginResponse, LoginRequest>(ADMIN_LOGIN_ENDPOINT, {
    ...payload,
    phoneNumber: trimCountryCode(payload.phoneNumber, countryCallingCode),
    countryCallingCode,
  })
}
