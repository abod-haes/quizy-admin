export type QuizyRegisterRequest = {
  firstName: string
  lastName: string
  phoneNumber: string
  password: string
  role: number
  countryCallingCode: string
}

export type QuizyRegisterVerifyRequest = {
  phoneNumber: string
  otpCode: string
  countryCallingCode: string
}

export type QuizyForgotPasswordRequest = {
  phoneNumber: string
}

export type QuizyResetPasswordRequest = {
  otpCode: string
  newPassword: string
}

export type QuizyResendPasswordOtpRequest = {
  phoneNumber: string
  countryCallingCode: string
}

export type QuizyAuthResponse = Record<string, string | boolean | null | undefined>

export type QuizyMessageResponse = {
  message?: string | null
}
