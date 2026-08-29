export const APP_ROLES = ['SuperAdmin', 'AdminEmployee', 'Teacher'] as const

export type AppRole = (typeof APP_ROLES)[number]

export type CrudAction = 'list' | 'view' | 'create' | 'update' | 'delete'

export type CrudAccessMatrix = Record<CrudAction, readonly AppRole[]>

export const SUPER_ADMIN_ROLES: readonly AppRole[] = ['SuperAdmin']
export const ADMIN_ROLES: readonly AppRole[] = ['SuperAdmin', 'AdminEmployee']
export const TEACHER_ROLES: readonly AppRole[] = ['Teacher']
export const DASHBOARD_ROLES: readonly AppRole[] = APP_ROLES
export const CONTENT_MANAGER_ROLES: readonly AppRole[] = ADMIN_ROLES
export const AUTHENTICATED_ROLES: readonly AppRole[] = APP_ROLES

export const DEFAULT_CRUD_ACCESS: CrudAccessMatrix = {
  list: ADMIN_ROLES,
  view: ADMIN_ROLES,
  create: ADMIN_ROLES,
  update: ADMIN_ROLES,
  delete: ADMIN_ROLES,
}

export function normalizeAppRole(value: unknown): AppRole | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (
    normalized === 'superadmin' ||
    normalized === 'super_admin' ||
    normalized === 'super-admin'
  ) {
    return 'SuperAdmin'
  }
  if (
    normalized === 'adminemployee' ||
    normalized === 'admin_employee' ||
    normalized === 'admin-employee' ||
    normalized === 'admin'
  ) {
    return 'AdminEmployee'
  }
  if (normalized === 'teacher') {
    return 'Teacher'
  }

  return null
}

export function hasAnyRole(
  userRoles: readonly AppRole[],
  requiredRoles: readonly AppRole[] | undefined,
) {
  if (!requiredRoles?.length) return true
  return requiredRoles.some((role) => userRoles.includes(role))
}
