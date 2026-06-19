import type { ReactNode } from 'react'

import { ENABLE_ACCESS_CONTROL } from '@/app/auth/access-control.config'
import type { AppRole } from '@/app/auth/access-control.types'
import { useAuth } from '@/app/providers/auth.provider'
import type { AppPermission } from '@/constants/permissions'

type OneOrMany<T> = T | T[]

type CanProps = {
  role?: OneOrMany<AppRole>
  permission?: OneOrMany<AppPermission>
  requireAllPermissions?: boolean
  fallback?: ReactNode
  children: ReactNode
}

function toArray<T>(value: OneOrMany<T> | undefined): T[] | undefined {
  if (!value) {
    return undefined
  }

  return Array.isArray(value) ? value : [value]
}

export function Can({
  role,
  permission,
  requireAllPermissions = false,
  fallback = null,
  children,
}: CanProps) {
  const { hasAnyPermission, hasAnyRole } = useAuth()

  if (!ENABLE_ACCESS_CONTROL) {
    return <>{children}</>
  }

  const roleAllowed = hasAnyRole(toArray(role))
  const permissionAllowed = hasAnyPermission(toArray(permission), requireAllPermissions)

  return roleAllowed && permissionAllowed ? <>{children}</> : <>{fallback}</>
}

export default Can
