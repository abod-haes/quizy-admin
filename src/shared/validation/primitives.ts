import { z } from 'zod'

export const requiredString = (message = 'validation.required') =>
  z.string().trim().min(1, message)

export const optionalString = () =>
  z.string().trim().optional().or(z.literal(''))

export const uuidField = (message = 'validation.uuid') =>
  z.string().trim().uuid(message)

export const positiveInt = (message = 'validation.positiveInt') =>
  z.coerce.number().int(message).positive(message)

export const nonNegativeInt = (message = 'validation.nonNegativeInt') =>
  z.coerce.number().int(message).min(0, message)

export const pageField = () => z.coerce.number().int().min(1).default(1)

export const perPageField = () => z.coerce.number().int().min(1).max(1000).default(20)

export const phoneField = (message = 'validation.phone') =>
  z.string().trim().min(6, message).max(20, message)

export const passwordField = (message = 'validation.password') =>
  z.string().min(6, message)

export const priceField = (message = 'validation.price') =>
  z.coerce.number().min(0, message)

export const booleanField = () => z.coerce.boolean()

export const arrayOfUuid = () => z.array(uuidField()).default([])

export const paginationSchema = z.object({
  Page: pageField(),
  PerPage: perPageField(),
})
