import { createElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShellLayout } from '@/app/layout/app-shell.layout'
import { RequireAuth } from '@/app/router/require-auth.guard'
import { APP_ROUTES, type AppRouteKey } from '@/app/router/route-object.type'
import LoginPage from '@/modules/auth/pages/login.page'
import { DashboardPage } from '@/modules/dashboard/pages/dashboard.page'
import { NotFoundPage } from '@/modules/not-found/pages/not-found.page'

function withRouteAccess(routeKey: AppRouteKey, element: ReturnType<typeof createElement>) {
  const route = APP_ROUTES[routeKey]

  if (!route.protected) {
    return element
  }

  return createElement(RequireAuth, {}, element)
}

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
        element: createElement(Navigate, { to: APP_ROUTES.dashboard.path, replace: true }),
      },
      {
        path: APP_ROUTES.dashboard.path,
        element: withRouteAccess('dashboard', createElement(DashboardPage)),
      },
    ],
  },
  {
    path: APP_ROUTES.notFound.path,
    element: createElement(NotFoundPage),
  },
  {
    path: '*',
    element: createElement(Navigate, { to: APP_ROUTES.notFound.path, replace: true }),
  },
])
