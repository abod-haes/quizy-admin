import type { PagedResponse } from '@/shared/api/api.types'

export type AdminEmployeeStatus = 'INVITED' | 'ACTIVE' | 'DISABLED'

export type AdminEmployee = {
  id: string
  firstName: string
  lastName: string | null
  phoneNumber: string
  countryCallingCode: string | null
  status: AdminEmployeeStatus
  permissions: string[]
  invitedAt: string | null
  activatedAt: string | null
  disabledAt: string | null
  createdAt: string
}

export type AdminEmployeePage = PagedResponse<AdminEmployee>

export type AdminPermissionOption = {
  id: string
  code: string
  name: string
  description: string | null
}

export type CreateAdminEmployeeInput = {
  firstName: string
  lastName?: string
  phoneNumber: string
  countryCallingCode: string
  permissions: string[]
  sendInvitation?: boolean
}

export type UpdateAdminEmployeeInput = {
  firstName?: string
  lastName?: string
  permissions?: string[]
}
