import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import type { AppRole } from '@/app/auth/access-control.types'
import type { AppPermission } from '@/constants/permissions'
import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'

type RequireAuthProps = {
  children?: ReactNode
  requiredRoles?: readonly AppRole[]
  requiredPermissions?: readonly AppPermission[]
  requireAllPermissions?: boolean
}

export function RequireAuth({
  children,
  requiredRoles: _requiredRoles,
  requiredPermissions: _requiredPermissions,
  requireAllPermissions: _requireAllPermissions = false,
}: RequireAuthProps) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const fromPath = `${location.pathname}${location.search}${location.hash}`

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to={APP_ROUTES.login.path}
        state={{ from: fromPath }}
      />
    )
  }

  return <>{children}</>
}
