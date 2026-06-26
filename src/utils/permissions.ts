import { normalizeAppRole, type AppRole } from '@/app/auth/access-control.types'
import type { AuthUser } from '@/app/auth/auth-user.type'
import type { AppPermission } from '@/constants/permissions'

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function getString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function uniqueStrings<T extends string>(items: readonly T[]): T[] {
  return Array.from(new Set(items))
}

function toArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  return value == null ? [] : [value]
}

function normalizeRoleName(rawValue: string): AppRole | null {
  const directRole = normalizeAppRole(rawValue)
  if (directRole) {
    return directRole
  }

  const normalized = rawValue.trim().toLowerCase()
  if (normalized === 'admin' || normalized === 'manager') {
    return 'SuperAdmin'
  }

  if (normalized === 'employee' || normalized === 'viewer') {
    return 'Student'
  }

  return null
}

function normalizePermissionEntry(value: unknown): AppPermission | null {
  const directValue = getString(value)
  if (directValue) {
    return directValue
  }

  const record = toRecord(value)
  if (!record) {
    return null
  }

  const candidates = [
    record.permission,
    record.permissions,
    record.code,
    record.key,
    record.value,
    record.slug,
    record.name,
  ]

  for (const candidate of candidates) {
    const parsed = getString(candidate)
    if (parsed) {
      return parsed
    }
  }

  const section = getString(record.section)
  const action = getString(record.action)
  const type = getString(record.type)

  if (section && type && action) {
    return `${section}.${type}.${action}`
  }

  if (section && action) {
    return `${section}.global.${action}`
  }

  return null
}

function normalizeRoleEntry(value: unknown): AppRole | null {
  const directValue = getString(value)
  if (directValue) {
    return normalizeRoleName(directValue)
  }

  const record = toRecord(value)
  if (!record) {
    return null
  }

  const candidates = [record.role, record.name, record.code, record.slug]

  for (const candidate of candidates) {
    const parsed = getString(candidate)
    if (!parsed) {
      continue
    }

    const normalized = normalizeRoleName(parsed)
    if (normalized) {
      return normalized
    }
  }

  return null
}

function extractRoleDisplayName(value: unknown): string | null {
  const directRole = getString(value)
  if (directRole) {
    return directRole
  }

  const roleRecord = toRecord(value)
  if (!roleRecord) {
    return null
  }

  return (
    getString(roleRecord.name) ??
    getString(roleRecord.label) ??
    getString(roleRecord.code) ??
    getString(roleRecord.slug) ??
    null
  )
}

export function normalizePermissions(input: unknown): AppPermission[] {
  const permissions = toArray(input)
    .map(normalizePermissionEntry)
    .filter((permission): permission is AppPermission => Boolean(permission))

  return uniqueStrings(permissions)
}

export function normalizeRoles(input: unknown): AppRole[] {
  const roles = toArray(input)
    .map(normalizeRoleEntry)
    .filter((role): role is AppRole => Boolean(role))

  return uniqueStrings(roles)
}

export function hasPermission(
  currentPermissions: readonly AppPermission[],
  requiredPermission: AppPermission | null | undefined
) {
  if (!requiredPermission) {
    return true
  }

  return currentPermissions.includes(requiredPermission)
}

export function hasAnyPermission(
  currentPermissions: readonly AppPermission[],
  requiredPermissions: readonly AppPermission[] | undefined,
  requireAll = false
) {
  if (!requiredPermissions?.length) {
    return true
  }

  if (requireAll) {
    return requiredPermissions.every((permission) =>
      currentPermissions.includes(permission)
    )
  }

  return requiredPermissions.some((permission) =>
    currentPermissions.includes(permission)
  )
}

function extractPermissionsFromUserRecord(user: Record<string, unknown>): AppPermission[] {
  const userPermissions = normalizePermissions(user.permissions)
  if (userPermissions.length) {
    return userPermissions
  }

  const roleRecord = toRecord(user.role)
  if (!roleRecord) {
    return []
  }

  return normalizePermissions(roleRecord.permissions)
}

function extractToken(payload: Record<string, unknown>): string | null {
  const directToken = getString(payload.token) ?? getString(payload.accessToken)
  if (directToken) {
    return directToken
  }

  const data = toRecord(payload.data)
  if (!data) {
    return null
  }

  return getString(data.token) ?? getString(data.accessToken)
}

function extractPermissions(payload: Record<string, unknown>): AppPermission[] {
  const directPermissions = normalizePermissions(payload.permissions)
  if (directPermissions.length) {
    return directPermissions
  }

  const user = toRecord(payload.user)
  if (user) {
    const userPermissions = extractPermissionsFromUserRecord(user)
    if (userPermissions.length) {
      return userPermissions
    }
  }

  const data = toRecord(payload.data)
  if (!data) {
    return []
  }

  const dataPermissions = normalizePermissions(data.permissions)
  if (dataPermissions.length) {
    return dataPermissions
  }

  const dataUser = toRecord(data.user)
  if (dataUser) {
    const dataUserPermissions = extractPermissionsFromUserRecord(dataUser)
    if (dataUserPermissions.length) {
      return dataUserPermissions
    }
  }

  const dataRole = toRecord(data.role)
  if (dataRole) {
    const dataRolePermissions = normalizePermissions(dataRole.permissions)
    if (dataRolePermissions.length) {
      return dataRolePermissions
    }
  }

  return []
}

function extractRoles(payload: Record<string, unknown>): AppRole[] {
  const directRoles = normalizeRoles(payload.roles)
  if (directRoles.length) {
    return directRoles
  }

  const user = toRecord(payload.user)
  if (user) {
    const userRoles = normalizeRoles(user.roles)
    if (userRoles.length) {
      return userRoles
    }

    const singleRole = normalizeRoles(user.role)
    if (singleRole.length) {
      return singleRole
    }
  }

  const data = toRecord(payload.data)
  if (data) {
    const dataRoles = normalizeRoles(data.roles)
    if (dataRoles.length) {
      return dataRoles
    }

    const singleDataRole = normalizeRoles(data.role)
    if (singleDataRole.length) {
      return singleDataRole
    }

    const dataUser = toRecord(data.user)
    if (dataUser) {
      const dataUserRoles = normalizeRoles(dataUser.roles)
      if (dataUserRoles.length) {
        return dataUserRoles
      }

      const singleDataUserRole = normalizeRoles(dataUser.role)
      if (singleDataUserRole.length) {
        return singleDataUserRole
      }
    }
  }

  return []
}

function normalizeUser(value: unknown): AuthUser | null {
  const record = toRecord(value)
  if (!record) {
    return null
  }

  const fallbackId = getString(record.email) ?? getString(record.name)
  const id =
    typeof record.id === 'string' || typeof record.id === 'number'
      ? record.id
      : fallbackId

  if (!id) {
    return null
  }

  return {
    ...record,
    id,
    name: getString(record.name) ?? getString(record.email) ?? 'Unknown user',
    email: getString(record.email) ?? '',
    role: extractRoleDisplayName(record.role),
    profilePhotoPath:
      getString(record.profilePhotoPath) ?? getString(record.profile_photo_path),
    profilePhotoUrl:
      getString(record.profilePhotoUrl) ?? getString(record.profile_photo_url),
  } as AuthUser
}

function extractUser(payload: Record<string, unknown>): AuthUser | null {
  const directUser = normalizeUser(payload.user)
  if (directUser) {
    return directUser
  }

  const data = toRecord(payload.data)
  if (!data) {
    return null
  }

  return normalizeUser(data.user)
}

export type BackendAuthSession = {
  token: string | null
  roles: AppRole[]
  permissions: AppPermission[]
  user: AuthUser | null
}

export function parseBackendAuthSession(payload: unknown): BackendAuthSession {
  const record = toRecord(payload)

  if (!record) {
    return {
      token: null,
      user: null,
      roles: [],
      permissions: [],
    }
  }

  return {
    token: extractToken(record),
    roles: extractRoles(record),
    permissions: extractPermissions(record),
    user: extractUser(record),
  }
}
