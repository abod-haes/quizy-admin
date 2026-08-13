import {
  normalizeAppRole,
  type AppRole,
} from '@/app/auth/access-control.types'
import { api } from '@/shared/api/api-client'
import {
  getAdminUiPermissionsForRole,
  type AdminPermissionCode,
} from '@/shared/auth/admin-permissions'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { getAuthToken } from '@/shared/lib/auth-storage'
import {
  normalizeCountryCallingCode,
  trimCountryCode,
} from '@/modules/auth/utils/quizy-auth-flow.utils'

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
  refreshToken?: string | null
  phoneNumber?: string | null
  countryCallingCode?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  user?: AdminLoginUser | null
}

export type AdminPermissionsResponse = {
  role: AppRole
  permissions: AdminPermissionCode[]
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

function getStoredAdminRole(): AppRole | null {
  const token = getAuthToken()
  const encodedPayload = token?.split('.')[1]
  if (!encodedPayload) return null

  try {
    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as { role?: unknown }
    return normalizeAppRole(payload.role)
  } catch {
    return null
  }
}

export async function getAdminPermissions(): Promise<AdminPermissionsResponse> {
  const role = getStoredAdminRole()
  if (!role) throw new Error('Unable to derive admin role from access token')

  return {
    role,
    permissions: getAdminUiPermissionsForRole(role),
  }
}
