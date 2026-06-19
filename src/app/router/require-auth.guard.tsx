import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import type { AppRole } from '@/app/auth/access-control.types'
import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { AppPermission } from '@/constants/permissions'

export type RequireAuthProps = {
  children?: ReactNode
  requiredRoles?: readonly AppRole[]
  requiredPermissions?: readonly AppPermission[]
  requireAllPermissions?: boolean
}

export function RequireAuth({
  children,
  requiredRoles,
  requiredPermissions,
  requireAllPermissions = false,
}: RequireAuthProps) {
  const { isAuthenticated, hasAnyRole, hasAnyPermission } = useAuth()
  const location = useLocation()
  const fromPath = `${location.pathname}${location.search}${location.hash}`

  if (!isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.login.path} state={{ from: fromPath }} />
  }

  if (!hasAnyRole(requiredRoles)) {
    return <Navigate replace to={APP_ROUTES.notFound.path} />
  }

  if (!hasAnyPermission(requiredPermissions, requireAllPermissions)) {
    return <Navigate replace to={APP_ROUTES.notFound.path} />
  }

  return <>{children}</>
}
