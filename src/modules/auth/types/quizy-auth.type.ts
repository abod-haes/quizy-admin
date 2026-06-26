export type QuizyRegisterRequest = {
  firstName: string
  lastName: string
  phoneNumber: string
  password: string
  role: number
  countryCallingCode: string
}

export type QuizyLoginRequest = {
  phoneNumber: string
  password: string
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

export type QuizyAuthResponse = {
  message?: string
  isAuthenticated?: boolean
  requiresVerification?: boolean
  userId?: string
  token?: string
  phoneNumber?: string
  email?: string
  firstName?: string
  lastName?: string
  role?: string
}

export type QuizyMessageResponse = {
  message?: string
}
