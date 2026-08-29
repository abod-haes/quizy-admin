import type { AppRole } from '@/app/auth/access-control.types'

export const ADMIN_PERMISSION_CODES = [
  'employees.manage',
  'content.manage',
  'quizzes.manage',
  'resources.manage',
  'courses.manage',
  'ai.manage',
  'qr.manage',
  'notifications.manage',
] as const

export type AdminPermissionCode = (typeof ADMIN_PERMISSION_CODES)[number]

const ROLE_UI_PERMISSIONS = {
  SuperAdmin: ADMIN_PERMISSION_CODES,
  AdminEmployee: ADMIN_PERMISSION_CODES,
  Teacher: [],
} satisfies Record<AppRole, readonly AdminPermissionCode[]>

/**
 * Admin route visibility is derived locally from the authenticated role so login never
 * depends on a separate permissions bootstrap request. The backend remains the source
 * of truth for AdminEmployee authorization and validates granular permissions on every
 * protected API request.
 */
export function getAdminUiPermissionsForRole(role: AppRole): AdminPermissionCode[] {
  return [...ROLE_UI_PERMISSIONS[role]]
}

export function isAdminPermissionCode(value: unknown): value is AdminPermissionCode {
  return (
    typeof value === 'string' &&
    (ADMIN_PERMISSION_CODES as readonly string[]).includes(value)
  )
}
