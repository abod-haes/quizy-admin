import type { PagedResponse } from '@/shared/api/api.types'
import type { AdminPermissionCode } from '@/shared/auth/admin-permissions'

export type AdminEmployeeStatus = 'INVITED' | 'ACTIVE' | 'DISABLED'

export type AdminEmployee = {
  id: string
  firstName: string
  lastName: string | null
  phoneNumber: string
  countryCallingCode: string | null
  status: AdminEmployeeStatus
  permissions: AdminPermissionCode[]
  invitedAt: string | null
  activatedAt: string | null
  disabledAt: string | null
  createdAt: string
}

export type AdminEmployeePage = PagedResponse<AdminEmployee>

export type AdminPermissionOption = {
  code: AdminPermissionCode
  name: string
  description: string | null
}

export type AdminInvitationResult = {
  sent?: boolean
  requestId?: string
  expiresAt?: string
  [key: string]: unknown
}

export type CreateAdminEmployeeResponse = AdminEmployee & {
  invitation?: AdminInvitationResult | null
}

export type CreateAdminEmployeeInput = {
  firstName: string
  lastName?: string
  phoneNumber: string
  countryCallingCode: string
  permissions: AdminPermissionCode[]
  sendInvitation?: boolean
}

export type UpdateAdminEmployeeInput = {
  firstName?: string
  lastName?: string
  permissions?: AdminPermissionCode[]
}
