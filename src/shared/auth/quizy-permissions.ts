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
  ],
  Teacher: [
    'dashboard.view',
    'lessons.manage',
    'quizzes.manage',
    'questions.manage',
    'resources.manage',
    'courses.manage',
    'reviewQueue.manage',
  ],
  Student: ['dashboard.view'],
}

export function getPermissionsForRoles(roles: readonly AppRole[]): QuizyPermission[] {
  return Array.from(new Set(roles.flatMap((role) => rolePermissions[role] ?? [])))
}
