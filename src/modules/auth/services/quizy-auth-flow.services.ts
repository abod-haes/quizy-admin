import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type {
  QuizyAuthResponse,
  QuizyMessageResponse,
  QuizyRecoverRequest,
  QuizyRegisterRequest,
  QuizyResetRequest,
  QuizyVerifyRequest,
} from '@/modules/auth/types/quizy-auth-flow.type'
import { trimCountryCode } from '@/modules/auth/utils/quizy-auth-flow.utils'

function withPhone<T extends { phoneNumber: string; countryCallingCode?: string }>(payload: T): T {
  return { ...payload, phoneNumber: trimCountryCode(payload.phoneNumber, payload.countryCallingCode) }
}

export async function registerQuizy(payload: QuizyRegisterRequest): Promise<QuizyAuthResponse> {
  return api.post<QuizyAuthResponse, QuizyRegisterRequest>(API_ENDPOINTS.auth.register, withPhone(payload))
}

export async function verifyQuizy(payload: QuizyVerifyRequest): Promise<QuizyAuthResponse> {
  return api.post<QuizyAuthResponse, QuizyVerifyRequest>(API_ENDPOINTS.auth.verifyRegistration, withPhone(payload))
}

export async function requestRecoverQuizy(payload: QuizyRecoverRequest): Promise<QuizyMessageResponse> {
  return api.post<QuizyMessageResponse, QuizyRecoverRequest>(API_ENDPOINTS.auth.forgotPassword, {
    phoneNumber: trimCountryCode(payload.phoneNumber),
  })
}

export async function resetQuizy(payload: QuizyResetRequest): Promise<QuizyMessageResponse> {
  return api.post<QuizyMessageResponse, QuizyResetRequest>(API_ENDPOINTS.auth.resetPassword, payload)
}
