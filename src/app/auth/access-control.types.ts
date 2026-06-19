export const APP_ROLES = ['admin', 'manager', 'editor', 'viewer'] as const

export type AppRole = (typeof APP_ROLES)[number]

export type CrudAction = 'list' | 'view' | 'create' | 'update' | 'delete'

export type CrudAccessMatrix = Record<CrudAction, readonly AppRole[]>

export const DEFAULT_CRUD_ACCESS: CrudAccessMatrix = {
  list: ['admin', 'manager', 'editor', 'viewer'],
  view: ['admin', 'manager', 'editor', 'viewer'],
  create: ['admin', 'manager', 'editor'],
  update: ['admin', 'manager', 'editor'],
  delete: ['admin', 'manager'],
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
