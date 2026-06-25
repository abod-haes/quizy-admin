import { createElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import type { AppRole } from '@/app/auth/access-control.types'
import type { AppPermission } from '@/constants/permissions'
import { AppShellLayout } from '@/app/layout/app-shell.layout'
import { RequireAuth } from '@/app/router/require-auth.guard'
import { APP_ROUTES, type AppRouteKey } from '@/app/router/route-object.type'
import LoginPage from '@/modules/auth/pages/login.page'
import RegisterPage from '@/modules/auth/pages/register.page'
import ResetAccessPage from '@/modules/auth/pages/reset-access.page'
import { NotFoundPage } from '@/modules/not-found/pages/not-found.page';
import PagesPage from '@/modules/pages/pages/pages.page'
import PagesFormPage from '@/modules/pages/pages/form/pages.form.page'
import PagesViewPage from '@/modules/pages/pages/view/pages.view.page'
import FaqsPage from '@/modules/faqs/pages/faqs.page'
import FaqsFormPage from '@/modules/faqs/pages/form/faqs.form.page'
import FaqsViewPage from '@/modules/faqs/pages/view/faqs.view.page'


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

export const appRouter = createBrowserRouter([
  {
    path: APP_ROUTES.login.path,
    element: createElement(LoginPage),
  },
  {
    path: APP_ROUTES.register.path,
    element: createElement(RegisterPage),
  },
  {
    path: APP_ROUTES.forgotPassword.path,
    element: createElement(ResetAccessPage),
  },
  {
    path: APP_ROUTES.root.path,
    element: withRouteAccess('root', createElement(AppShellLayout)),
    children: [
      
  
          {
        path: APP_ROUTES.pages.path,
        element: withRouteAccess('pages', createElement(PagesPage)),
      },
      {
        path: APP_ROUTES.addPages.path,
        element: withRouteAccess('addPages', createElement(PagesFormPage)),
      },
      {
        path: APP_ROUTES.editPages.path,
        element: withRouteAccess('editPages', createElement(PagesFormPage)),
      },
      {
        path: APP_ROUTES.viewPages.path,
        element: withRouteAccess('viewPages', createElement(PagesViewPage)),
      },
      {
        path: APP_ROUTES.faqs.path,
        element: withRouteAccess('faqs', createElement(FaqsPage)),
      },
      {
        path: APP_ROUTES.addFaqs.path,
        element: withRouteAccess('addFaqs', createElement(FaqsFormPage)),
      },
      {
        path: APP_ROUTES.editFaqs.path,
        element: withRouteAccess('editFaqs', createElement(FaqsFormPage)),
      },
      {
        path: APP_ROUTES.viewFaqs.path,
        element: withRouteAccess('viewFaqs', createElement(FaqsViewPage)),
      },
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
