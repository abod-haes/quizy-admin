import type { AppRole } from '@/app/auth/access-control.types'

export type QuizyPermission =
  | 'dashboard.view'
  | 'classes.manage'
  | 'subjects.manage'
  | 'units.manage'
  | 'lessons.manage'
  | 'teachers.manage'
  | 'students.manage'
  | 'quizzes.manage'
  | 'questions.manage'
  | 'resources.manage'
  | 'courses.manage'
  | 'reviewQueue.manage'
  | 'settings.manage'
  | 'aiChat.settings.manage'
  | 'aiQrCodes.manage'

export const rolePermissions: Record<AppRole, readonly QuizyPermission[]> = {
  SuperAdmin: [
    'dashboard.view',
    'classes.manage',
    'subjects.manage',
    'units.manage',
    'lessons.manage',
    'teachers.manage',
    'students.manage',
    'quizzes.manage',
    'questions.manage',
    'resources.manage',
    'courses.manage',
    'reviewQueue.manage',
    'settings.manage',
    'aiChat.settings.manage',
    'aiQrCodes.manage',
  ],
  // Real employee permissions are loaded from `/api/v1/admin/auth/permissions`.
  // Keep this empty so a stale/local fallback can never grant more than the server.
  AdminEmployee: [],
  // Teacher dashboard access is role-scoped and read-only; no management permission
  // should be granted through the local fallback permission map.
  Teacher: [],
}

export function getPermissionsForRoles(roles: readonly AppRole[]): QuizyPermission[] {
  return Array.from(new Set(roles.flatMap((role) => rolePermissions[role] ?? [])))
}
