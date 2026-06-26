export type QuizyRegisterRequest = {
  firstName: string
  lastName: string
  phoneNumber: string
  password: string
  role: number
  countryCallingCode: string
}

export type QuizyVerifyRequest = {
  phoneNumber: string
  otpCode: string
  countryCallingCode: string
}

export type QuizyRecoverRequest = {
  phoneNumber: string
}

export type QuizyResetRequest = {
  otpCode: string
  newPassword: string
}

export type QuizyAuthResponse = {
  message?: string | null
  isAuthenticated?: boolean
  requiresVerification?: boolean
  userId?: string
  token?: string | null
  phoneNumber?: string | null
  countryCallingCode?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
}

export type QuizyMessageResponse = {
  message?: string | null
}
