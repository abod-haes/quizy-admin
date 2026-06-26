import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type {
  QuizyAuthResponse,
  QuizyForgotPasswordRequest,
  QuizyMessageResponse,
  QuizyRegisterRequest,
  QuizyRegisterVerifyRequest,
  QuizyResetPasswordRequest,
} from '@/modules/auth/types/quizy-auth-flow.type'
import { cleanPhoneNumber } from '@/modules/auth/utils/quizy-auth-flow.utils'

function withCleanPhone<T extends { phoneNumber: string; countryCallingCode?: string }>(payload: T): T {
  return { ...payload, phoneNumber: cleanPhoneNumber(payload.phoneNumber, payload.countryCallingCode) }
}

export async function registerQuizy(payload: QuizyRegisterRequest): Promise<QuizyAuthResponse> {
  return api.post<QuizyAuthResponse, QuizyRegisterRequest>(API_ENDPOINTS.auth.register, withCleanPhone(payload))
}

export async function verifyRegisterQuizy(payload: QuizyRegisterVerifyRequest): Promise<QuizyAuthResponse> {
  return api.post<QuizyAuthResponse, QuizyRegisterVerifyRequest>(API_ENDPOINTS.auth.verifyRegistration, withCleanPhone(payload))
}

export async function requestAccountResetQuizy(payload: QuizyForgotPasswordRequest): Promise<QuizyMessageResponse> {
  return api.post<QuizyMessageResponse, QuizyForgotPasswordRequest>(API_ENDPOINTS.auth.forgotPassword, {
    phoneNumber: cleanPhoneNumber(payload.phoneNumber),
  })
}

export async function completeAccountResetQuizy(payload: QuizyResetPasswordRequest): Promise<QuizyMessageResponse> {
  return api.post<QuizyMessageResponse, QuizyResetPasswordRequest>(API_ENDPOINTS.auth.resetPassword, payload)
}
