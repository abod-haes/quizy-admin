import type { AppRole } from '@/app/auth/access-control.types'
import { PERMISSIONS, type AppPermission } from '@/constants/permissions'

export const APP_ROUTES = {
  login: {
    key: 'login',
    path: '/login',
    protected: false,
    breadcrumbKeys: [],
  },
  register: {
    key: 'register',
    path: '/register',
    protected: false,
    breadcrumbKeys: [],
  },
  forgotPassword: {
    key: 'forgotPassword',
    path: '/forgot-password',
    protected: false,
    breadcrumbKeys: [],
  },
  root: {
    key: 'root',
    path: '/',
    protected: true,
    breadcrumbKeys: [PERMISSIONS.employees.view],
  },
  projects: {
    key: 'projects',
    path: '/projects',
    protected: true,
    permissions: [PERMISSIONS.projects.list],
    breadcrumbKeys: [],
  },
  addProjects: {
    key: 'addProjects',
    path: '/projects/add',
    protected: true,
    permissions: [PERMISSIONS.projects.create],
    breadcrumbKeys: [],
  },
  editProjects: {
    key: 'editProjects',
    path: '/projects/edit/:id',
    protected: true,
    permissions: [PERMISSIONS.projects.update],
    breadcrumbKeys: [],
  },
  viewProjects: {
    key: 'viewProjects',
    path: '/projects/view/:id',
    protected: true,
    permissions: [PERMISSIONS.projects.view],
    breadcrumbKeys: [],
  },
    pages: {
    key: 'pages',
    path: '/pages',
    protected: true,
    breadcrumbKeys: [],
  },
  addPages: {
    key: 'addPages',
    path: '/pages/add',
    protected: true,
    breadcrumbKeys: [],
  },
  editPages: {
    key: 'editPages',
    path: '/pages/edit/:id',
    protected: true,
    breadcrumbKeys: [],
  },
  viewPages: {
    key: 'viewPages',
    path: '/pages/view/:id',
    protected: true,
    breadcrumbKeys: [],
  },

  faqs: {
    key: 'faqs',
    path: '/faqs',
    protected: true,
    breadcrumbKeys: [],
  },
  addFaqs: {
    key: 'addFaqs',
    path: '/faqs/add',
    protected: true,
    breadcrumbKeys: [],
  },
  editFaqs: {
    key: 'editFaqs',
    path: '/faqs/edit/:id',
    protected: true,
    breadcrumbKeys: [],
  },
  viewFaqs: {
    key: 'viewFaqs',
    path: '/faqs/view/:id',
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
