import { createElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import type { AppRole } from '@/app/auth/access-control.types'
import type { AppPermission } from '@/constants/permissions'
import { AppShellLayout } from '@/app/layout/app-shell.layout'
import { RequireAuth } from '@/app/router/require-auth.guard'
import { APP_ROUTES, type AppRouteKey } from '@/app/router/route-object.type'
import LoginPage from '@/modules/auth/pages/login.page'
import DashboardPage from '@/modules/dashboard/pages/dashboard.page'
import ModuleComingSoonPage from '@/modules/dashboard/pages/module-coming-soon.page'
import { NotFoundPage } from '@/modules/not-found/pages/not-found.page'

function withRouteAccess(routeKey: AppRouteKey, element: ReturnType<typeof createElement>) {
  const route = APP_ROUTES[routeKey]
  const requiredRoles: readonly AppRole[] | undefined =
    'roles' in route && Array.isArray(route.roles) ? (route.roles as readonly AppRole[]) : undefined
  const requiredPermissions: readonly AppPermission[] | undefined =
    'permissions' in route && Array.isArray(route.permissions)
      ? (route.permissions as readonly AppPermission[])
      : undefined
  const requireAllPermissions =
    'requireAllPermissions' in route ? Boolean(route.requireAllPermissions) : false

  if (!route.protected) {
    return element
  }

  return createElement(
    RequireAuth,
    { requiredRoles, requiredPermissions, requireAllPermissions },
    element
  )
}

const quizyModuleRoutes: AppRouteKey[] = [
  'quizBuilder',
  'quizzes',
  'lessons',
  'units',
  'teachers',
  'students',
  'reviewQueue',
  'settings',
]

export const appRouter = createBrowserRouter([
  {
    path: APP_ROUTES.login.path,
    element: createElement(LoginPage),
  },
  {
    path: APP_ROUTES.root.path,
    element: withRouteAccess('root', createElement(AppShellLayout)),
    children: [
      {
        index: true,
        element: createElement(Navigate, {
          to: APP_ROUTES.dashboard.path,
          replace: true,
        }),
      },
      {
        path: APP_ROUTES.dashboard.path,
        element: withRouteAccess('dashboard', createElement(DashboardPage)),
      },
      ...quizyModuleRoutes.map((routeKey) => ({
        path: APP_ROUTES[routeKey].path,
        element: withRouteAccess(routeKey, createElement(ModuleComingSoonPage)),
      })),
    ],
  },
  {
    path: APP_ROUTES.notFound.path,
    element: createElement(NotFoundPage),
  },
  {
    path: '*',
    element: createElement(Navigate, {
      to: APP_ROUTES.notFound.path,
      replace: true,
    }),
  },
])
