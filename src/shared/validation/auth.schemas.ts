import { z } from 'zod'

import { passwordField, phoneField, requiredString } from '@/shared/validation/primitives'

export const loginSchema = z.object({
  countryCallingCode: requiredString(),
  phoneNumber: phoneField(),
  password: requiredString(),
})

export const registerSchema = z.object({
  firstName: requiredString(),
  lastName: requiredString(),
  countryCallingCode: requiredString(),
  phoneNumber: phoneField(),
  password: passwordField(),
  role: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

export const verifyRegistrationSchema = z.object({
  countryCallingCode: requiredString(),
  phoneNumber: phoneField(),
  otpCode: requiredString(),
})

export const forgotPasswordSchema = z.object({
  countryCallingCode: requiredString(),
  phoneNumber: phoneField(),
})

export const resetPasswordSchema = z.object({
  otpCode: requiredString(),
  newPassword: passwordField(),
})

export const changePasswordSchema = z.object({
  oldPassword: requiredString(),
  newPassword: passwordField(),
})
