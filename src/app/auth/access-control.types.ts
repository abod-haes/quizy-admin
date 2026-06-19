export const APP_ROLES = ['Teacher', 'Student', 'SuperAdmin'] as const

export type AppRole = (typeof APP_ROLES)[number]

export type CrudAction = 'list' | 'view' | 'create' | 'update' | 'delete'

export type CrudAccessMatrix = Record<CrudAction, readonly AppRole[]>

export const SUPER_ADMIN_ROLES: readonly AppRole[] = ['SuperAdmin']
export const CONTENT_MANAGER_ROLES: readonly AppRole[] = ['Teacher', 'SuperAdmin']
export const AUTHENTICATED_ROLES: readonly AppRole[] = APP_ROLES

export const DEFAULT_CRUD_ACCESS: CrudAccessMatrix = {
  list: CONTENT_MANAGER_ROLES,
  view: CONTENT_MANAGER_ROLES,
  create: CONTENT_MANAGER_ROLES,
  update: CONTENT_MANAGER_ROLES,
  delete: SUPER_ADMIN_ROLES,
}

export function normalizeAppRole(value: unknown): AppRole | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === 'teacher') return 'Teacher'
  if (normalized === 'student') return 'Student'
  if (normalized === 'superadmin' || normalized === 'super_admin' || normalized === 'super-admin') {
    return 'SuperAdmin'
  }

  return null
}

export function hasAnyRole(
  userRoles: readonly AppRole[],
  requiredRoles: readonly AppRole[] | undefined
) {
  if (!requiredRoles?.length) {
    return true
  }

  return requiredRoles.some((role) => userRoles.includes(role))
}
