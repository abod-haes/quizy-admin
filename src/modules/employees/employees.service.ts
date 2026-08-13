import type {
  AdminEmployee,
  AdminEmployeePage,
  AdminEmployeeStatus,
  AdminPermissionOption,
  CreateAdminEmployeeInput,
  CreateAdminEmployeeResponse,
  UpdateAdminEmployeeInput,
} from '@/modules/employees/employees.types'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

export const employeesService = {
  list: (params: { page?: number; perPage?: number; status?: AdminEmployeeStatus; search?: string }) =>
    api.get<AdminEmployeePage>(API_ENDPOINTS.employees.list, { params }),
  permissions: () => api.get<AdminPermissionOption[]>(API_ENDPOINTS.employees.permissions),
  create: (payload: CreateAdminEmployeeInput) =>
    api.post<CreateAdminEmployeeResponse, CreateAdminEmployeeInput>(API_ENDPOINTS.employees.create, payload),
  update: (id: string, payload: UpdateAdminEmployeeInput) =>
    api.patch<AdminEmployee, UpdateAdminEmployeeInput>(API_ENDPOINTS.employees.update(id), payload),
  disable: (id: string) => api.post<AdminEmployee>(API_ENDPOINTS.employees.disable(id)),
  enable: (id: string) => api.post<AdminEmployee>(API_ENDPOINTS.employees.enable(id)),
  resendInvitation: (id: string) => api.post<Record<string, unknown>>(API_ENDPOINTS.employees.resendInvitation(id)),
  remove: (id: string) => api.delete<{ message: string }>(API_ENDPOINTS.employees.remove(id)),
}
