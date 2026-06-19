import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  hasAnyRole as hasAnyRoleInList,
  type AppRole,
} from '@/app/auth/access-control.types'
import type { AuthUser } from '@/app/auth/auth-user.type'
import type { AppPermission } from '@/constants/permissions'
import {
  clearAuthPermissions,
  clearAuthRoles,
  clearAuthToken,
  clearAuthUser,
  getAuthPermissions,
  getAuthRoles,
  getAuthToken,
  getAuthUser,
  setAuthPermissions,
  setAuthRoles,
  setAuthToken,
  setAuthUser,
} from '@/shared/lib/auth-storage'
import {
  hasAnyPermission as hasAnyPermissionInList,
  hasPermission as hasPermissionInList,
  parseBackendAuthSession,
} from '@/utils/permissions'

type AuthContextValue = {
  isAuthenticated: boolean
  token: string | null
  user: AuthUser | null
  roles: AppRole[]
  permissions: AppPermission[]
  login: (
    token: string,
    roles?: AppRole[],
    permissions?: AppPermission[],
    user?: AuthUser | null
  ) => void
  loginFromBackend: (payload: unknown) => void
  logout: () => void
  setUser: (user: AuthUser | null) => void
  setRoles: (roles: AppRole[]) => void
  setPermissions: (permissions: AppPermission[]) => void
  hasRole: (role: AppRole) => boolean
  hasAnyRole: (roles: readonly AppRole[] | undefined) => boolean
  hasPermission: (permission: AppPermission | null | undefined) => boolean
  hasAnyPermission: (
    permissions: readonly AppPermission[] | undefined,
    requireAll?: boolean
  ) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [user, setUserState] = useState<AuthUser | null>(() => getAuthUser())
  const [roles, setRolesState] = useState<AppRole[]>(() => getAuthRoles())
  const [permissions, setPermissionsState] = useState<AppPermission[]>(() =>
    getAuthPermissions()
  )

  const setUser = useCallback((nextUser: AuthUser | null) => {
    if (!nextUser) {
      clearAuthUser()
      setUserState(null)
      return
    }

    setAuthUser(nextUser)
    setUserState(nextUser)
  }, [])

  const setRoles = useCallback((nextRoles: AppRole[]) => {
    setAuthRoles(nextRoles)
    setRolesState(Array.from(new Set(nextRoles)))
  }, [])

  const setPermissions = useCallback((nextPermissions: AppPermission[]) => {
    setAuthPermissions(nextPermissions)
    setPermissionsState(Array.from(new Set(nextPermissions)))
  }, [])

  const login = useCallback(
    (
      nextToken: string,
      nextRoles?: AppRole[],
      nextPermissions?: AppPermission[],
      nextUser?: AuthUser | null
    ) => {
      setAuthToken(nextToken)
      setToken(nextToken)

      if (nextRoles) {
        setRoles(nextRoles)
      }

      if (nextPermissions) {
        setPermissions(nextPermissions)
      }

      if (nextUser) {
        setUser(nextUser)
      }
    },
    [setPermissions, setRoles, setUser]
  )

  const loginFromBackend = useCallback(
    (payload: unknown) => {
      const parsedSession = parseBackendAuthSession(payload)

      if (parsedSession.token) {
        setAuthToken(parsedSession.token)
        setToken(parsedSession.token)
      }
      setRoles(parsedSession.roles)
      setPermissions(parsedSession.permissions)
      setUser(parsedSession.user)
    },
    [setPermissions, setRoles, setUser]
  )

  const logout = useCallback(() => {
    clearAuthPermissions()
    clearAuthRoles()
    clearAuthToken()
    clearAuthUser()
    setToken(null)
    setUserState(null)
    setRolesState([])
    setPermissionsState([])
  }, [])

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles])

  const hasAnyRole = useCallback(
    (requiredRoles: readonly AppRole[] | undefined) =>
      hasAnyRoleInList(roles, requiredRoles),
    [roles]
  )

  const hasPermission = useCallback(
    (requiredPermission: AppPermission | null | undefined) =>
      hasPermissionInList(permissions, requiredPermission),
    [permissions]
  )

  const hasAnyPermission = useCallback(
    (
      requiredPermissions: readonly AppPermission[] | undefined,
      requireAll = false
    ) => hasAnyPermissionInList(permissions, requiredPermissions, requireAll),
    [permissions]
  )

  useEffect(() => {
    const onUnauthorized = () => logout()

    window.addEventListener('auth:unauthorized', onUnauthorized)

    return () => {
      window.removeEventListener('auth:unauthorized', onUnauthorized)
    }
  }, [logout])

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      user,
      roles,
      permissions,
      login,
      loginFromBackend,
      logout,
      setUser,
      setRoles,
      setPermissions,
      hasRole,
      hasAnyRole,
      hasPermission,
      hasAnyPermission,
    }),
    [
      hasAnyPermission,
      hasAnyRole,
      hasPermission,
      hasRole,
      login,
      loginFromBackend,
      logout,
      permissions,
      roles,
      setUser,
      setPermissions,
      setRoles,
      token,
      user,
    ]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
