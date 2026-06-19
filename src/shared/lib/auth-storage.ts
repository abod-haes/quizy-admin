import { APP_ROLES, type AppRole } from '@/app/auth/access-control.types'
import type { AuthUser } from '@/app/auth/auth-user.type'
import type { AppPermission } from '@/constants/permissions'

const AUTH_TOKEN_KEY = 'app.auth.token'
const AUTH_ROLES_KEY = 'app.auth.roles'
const AUTH_PERMISSIONS_KEY = 'app.auth.permissions'
const AUTH_USER_KEY = 'app.auth.user'

function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && APP_ROLES.includes(value as AppRole)
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  return value as Record<string, unknown>
}

function getNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed || null
}

function extractRoleDisplayName(value: unknown): string | null {
  const directRole = getNullableString(value)
  if (directRole) {
    return directRole
  }

  const roleRecord = toRecord(value)
  if (!roleRecord) {
    return null
  }

  return (
    getNullableString(roleRecord.name) ??
    getNullableString(roleRecord.label) ??
    getNullableString(roleRecord.code) ??
    getNullableString(roleRecord.slug) ??
    null
  )
}

function normalizeAuthUser(rawValue: unknown): AuthUser | null {
  const record = toRecord(rawValue)
  if (!record) {
    return null
  }

  const fallbackId = getNullableString(record.email) ?? getNullableString(record.name)
  const id =
    typeof record.id === 'string' || typeof record.id === 'number'
      ? record.id
      : fallbackId

  if (!id) {
    return null
  }

  const name =
    getNullableString(record.name) ??
    getNullableString(record.email) ??
    'Unknown user'
  const email = getNullableString(record.email) ?? ''

  return {
    ...record,
    id,
    name,
    email,
    role: extractRoleDisplayName(record.role),
    profilePhotoPath:
      getNullableString(record.profilePhotoPath) ??
      getNullableString(record.profile_photo_path),
    profilePhotoUrl:
      getNullableString(record.profilePhotoUrl) ??
      getNullableString(record.profile_photo_url),
  } as AuthUser
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getAuthRoles(): AppRole[] {
  const rawValue = localStorage.getItem(AUTH_ROLES_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isAppRole)
  } catch {
    return []
  }
}

export function setAuthRoles(roles: readonly AppRole[]): void {
  localStorage.setItem(AUTH_ROLES_KEY, JSON.stringify(Array.from(new Set(roles))))
}

export function clearAuthRoles(): void {
  localStorage.removeItem(AUTH_ROLES_KEY)
}

export function getAuthPermissions(): AppPermission[] {
  const rawValue = localStorage.getItem(AUTH_PERMISSIONS_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

export function setAuthPermissions(permissions: readonly AppPermission[]): void {
  localStorage.setItem(
    AUTH_PERMISSIONS_KEY,
    JSON.stringify(Array.from(new Set(permissions)))
  )
}

export function clearAuthPermissions(): void {
  localStorage.removeItem(AUTH_PERMISSIONS_KEY)
}

export function getAuthUser(): AuthUser | null {
  const rawValue = localStorage.getItem(AUTH_USER_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown
    return normalizeAuthUser(parsed)
  } catch {
    return null
  }
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_USER_KEY)
}
