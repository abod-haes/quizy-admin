import type { AppRole } from '@/app/auth/access-control.types'
import type { AppPermission } from '@/constants/permissions'

export const APP_ROUTES = {
  login: { key: 'login', path: '/login', protected: false, breadcrumbKeys: [] },
  root: { key: 'root', path: '/', protected: true, breadcrumbKeys: [] },
  dashboard: { key: 'dashboard', path: '/dashboard', protected: true, breadcrumbKeys: [] },
  quizBuilder: { key: 'quizBuilder', path: '/quiz-builder', protected: true, breadcrumbKeys: [] },
  quizzes: { key: 'quizzes', path: '/quizzes', protected: true, breadcrumbKeys: [] },
  questions: { key: 'questions', path: '/questions', protected: true, breadcrumbKeys: [] },
  classes: { key: 'classes', path: '/classes', protected: true, breadcrumbKeys: [] },
  subjects: { key: 'subjects', path: '/subjects', protected: true, breadcrumbKeys: [] },
  lessons: { key: 'lessons', path: '/lessons', protected: true, breadcrumbKeys: [] },
  units: { key: 'units', path: '/units', protected: true, breadcrumbKeys: [] },
  teachers: { key: 'teachers', path: '/teachers', protected: true, breadcrumbKeys: [] },
  students: { key: 'students', path: '/students', protected: true, breadcrumbKeys: [] },
  managementUsers: { key: 'managementUsers', path: '/management-users', protected: true, breadcrumbKeys: [] },
  courses: { key: 'courses', path: '/courses', protected: true, breadcrumbKeys: [] },
  courseDetail: { key: 'courseDetail', path: '/courses/:courseId', protected: true, breadcrumbKeys: [] },
  courseSessions: { key: 'courseSessions', path: '/courses/sessions', protected: true, breadcrumbKeys: [] },
  courseSessionDetail: { key: 'courseSessionDetail', path: '/courses/:courseId/sessions/:sessionId/:contentTab?', protected: true, breadcrumbKeys: [] },
  courseContent: { key: 'courseContent', path: '/courses/content', protected: true, breadcrumbKeys: [] },
  resources: { key: 'resources', path: '/resources', protected: true, breadcrumbKeys: [] },
  ads: { key: 'ads', path: '/ads', protected: true, breadcrumbKeys: [] },
  pointsOfSale: { key: 'pointsOfSale', path: '/points-of-sale', protected: true, breadcrumbKeys: [] },
  qrCodes: { key: 'qrCodes', path: '/qr-codes', protected: true, breadcrumbKeys: [] },
  notifications: { key: 'notifications', path: '/notifications', protected: true, breadcrumbKeys: [] },
  pageContents: { key: 'pageContents', path: '/page-contents', protected: true, breadcrumbKeys: [] },
  reviewQueue: { key: 'reviewQueue', path: '/review-queue', protected: true, breadcrumbKeys: [] },
  settings: { key: 'settings', path: '/settings', protected: true, breadcrumbKeys: [] },
  aiChatSettings: { key: 'aiChatSettings', path: '/ai-chat/settings', protected: true, roles: ['SuperAdmin'] as const, breadcrumbKeys: [] },
  aiQrCodes: { key: 'aiQrCodes', path: '/ai-chat/qr-codes', protected: true, roles: ['SuperAdmin'] as const, breadcrumbKeys: [] },

  projects: { key: 'projects', path: '/projects', protected: true, breadcrumbKeys: [] },
  addProjects: { key: 'addProjects', path: '/projects/add', protected: true, breadcrumbKeys: [] },
  editProjects: { key: 'editProjects', path: '/projects/edit/:id', protected: true, breadcrumbKeys: [] },
  viewProjects: { key: 'viewProjects', path: '/projects/view/:id', protected: true, breadcrumbKeys: [] },
  pages: { key: 'pages', path: '/pages', protected: true, breadcrumbKeys: [] },
  addPages: { key: 'addPages', path: '/pages/add', protected: true, breadcrumbKeys: [] },
  editPages: { key: 'editPages', path: '/pages/edit/:id', protected: true, breadcrumbKeys: [] },
  viewPages: { key: 'viewPages', path: '/pages/view/:id', protected: true, breadcrumbKeys: [] },
  faqs: { key: 'faqs', path: '/faqs', protected: true, breadcrumbKeys: [] },
  addFaqs: { key: 'addFaqs', path: '/faqs/add', protected: true, breadcrumbKeys: [] },
  editFaqs: { key: 'editFaqs', path: '/faqs/edit/:id', protected: true, breadcrumbKeys: [] },
  viewFaqs: { key: 'viewFaqs', path: '/faqs/view/:id', protected: true, breadcrumbKeys: [] },
  notFound: { key: 'notFound', path: '/not-found', protected: true, breadcrumbKeys: [] },
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
