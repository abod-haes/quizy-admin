import type { AppRole } from '@/app/auth/access-control.types'
import type { AppPermission } from '@/constants/permissions'

export const APP_ROUTES = {
  login: {
    key: 'login',
    path: '/login',
    protected: false,
    breadcrumbKeys: [],
  },
  root: {
    key: 'root',
    path: '/',
    protected: true,
    breadcrumbKeys: [],
  },
  dashboard: {
    key: 'dashboard',
    path: '/dashboard',
    protected: true,
    breadcrumbKeys: [],
  },
  notFound: {
    key: 'notFound',
    path: '/not-found',
    protected: true,
    breadcrumbKeys: [],
  },
} as const

export type AppRouteKey = keyof typeof APP_ROUTES
export type AppRoutes = (typeof APP_ROUTES)[AppRouteKey]['path']
export type AppRouteConfig = {
  key: AppRouteKey
  path: AppRoutes
  protected: boolean
  roles?: readonly AppRole[]
  permissions?: readonly AppPermission[]
  requireAllPermissions?: boolean
  breadcrumbKeys: readonly string[]
}
