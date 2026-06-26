import { httpClient } from '@/core/api/http.services'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type {
  QuizyAuthResponse,
  QuizyForgotPasswordRequest,
  QuizyLoginRequest,
  QuizyMessageResponse,
  QuizyRegisterRequest,
  QuizyRegisterVerifyRequest,
  QuizyResendPasswordOtpRequest,
  QuizyResetPasswordRequest,
} from '@/modules/auth/types/quizy-auth.type'
import { cleanPhoneNumber } from '@/modules/auth/utils/quizy-phone.utils'

function unwrapPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.data && typeof record.data === 'object') return record.data as T
    if (record.item && typeof record.item === 'object') return record.item as T
  }

  return payload as T
}

function withCleanPhone<T extends { phoneNumber: string; countryCallingCode?: string }>(payload: T): T {
  return {
    ...payload,
    phoneNumber: cleanPhoneNumber(payload.phoneNumber, payload.countryCallingCode),
  }
}

export async function loginQuizy(payload: QuizyLoginRequest): Promise<QuizyAuthResponse> {
  const response = await httpClient.post<unknown>(
    API_ENDPOINTS.quizyAuth.login,
    withCleanPhone(payload)
  )
  return unwrapPayload<QuizyAuthResponse>(response.data)
}

export async function registerQuizy(payload: QuizyRegisterRequest): Promise<QuizyAuthResponse> {
  const response = await httpClient.post<unknown>(
    API_ENDPOINTS.quizyAuth.register,
    withCleanPhone(payload)
  )
  return unwrapPayload<QuizyAuthResponse>(response.data)
}

export async function verifyRegisterQuizy(
  payload: QuizyRegisterVerifyRequest
): Promise<QuizyAuthResponse> {
  const response = await httpClient.post<unknown>(
    API_ENDPOINTS.quizyAuth.registerVerify,
    withCleanPhone(payload)
  )
  return unwrapPayload<QuizyAuthResponse>(response.data)
}

export async function forgotPasswordQuizy(
  payload: QuizyForgotPasswordRequest
): Promise<QuizyMessageResponse> {
  const response = await httpClient.post<unknown>(API_ENDPOINTS.quizyAuth.forgotPassword, {
    phoneNumber: cleanPhoneNumber(payload.phoneNumber),
  })
  return unwrapPayload<QuizyMessageResponse>(response.data)
}

export async function resetPasswordQuizy(
  payload: QuizyResetPasswordRequest
): Promise<QuizyMessageResponse> {
  const response = await httpClient.post<unknown>(API_ENDPOINTS.quizyAuth.resetPassword, payload)
  return unwrapPayload<QuizyMessageResponse>(response.data)
}

export async function resendPasswordOtpQuizy(
  payload: QuizyResendPasswordOtpRequest
): Promise<QuizyMessageResponse> {
  const response = await httpClient.post<unknown>(
    API_ENDPOINTS.quizyAuth.resendPasswordOtp,
    withCleanPhone(payload)
  )
  return unwrapPayload<QuizyMessageResponse>(response.data)
}
