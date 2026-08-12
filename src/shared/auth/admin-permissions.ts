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

export function isAdminPermissionCode(value: unknown): value is AdminPermissionCode {
  return (
    typeof value === 'string' &&
    (ADMIN_PERMISSION_CODES as readonly string[]).includes(value)
  )
}
