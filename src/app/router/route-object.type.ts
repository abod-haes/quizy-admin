import type { AppRole } from '@/app/auth/access-control.types'
import type { AppPermission } from '@/constants/permissions'

const CONTENT = ['content.manage'] as const
const QUIZZES = ['quizzes.manage'] as const
const EMPLOYEES = ['employees.manage'] as const
const COURSES = ['courses.manage'] as const
const RESOURCES = ['resources.manage'] as const
const NOTIFICATIONS = ['notifications.manage'] as const
const AI = ['ai.manage'] as const
const QR = ['qr.manage'] as const

export const APP_ROUTES = {
  login: { key: 'login', path: '/login', protected: false, breadcrumbKeys: [] },
  root: { key: 'root', path: '/', protected: true, breadcrumbKeys: [] },
  dashboard: { key: 'dashboard', path: '/dashboard', protected: true, breadcrumbKeys: [] },
  quizBuilder: { key: 'quizBuilder', path: '/quiz-builder', protected: true, permissions: QUIZZES, breadcrumbKeys: [] },
  quizzes: { key: 'quizzes', path: '/quizzes', protected: true, permissions: QUIZZES, breadcrumbKeys: [] },
  questions: { key: 'questions', path: '/questions', protected: true, permissions: QUIZZES, breadcrumbKeys: [] },
  questionDetail: { key: 'questionDetail', path: '/questions/:questionId', protected: true, permissions: QUIZZES, breadcrumbKeys: [] },
  classes: { key: 'classes', path: '/classes', protected: true, permissions: CONTENT, breadcrumbKeys: [] },
  subjects: { key: 'subjects', path: '/subjects', protected: true, permissions: CONTENT, breadcrumbKeys: [] },
  lessons: { key: 'lessons', path: '/lessons', protected: true, permissions: CONTENT, breadcrumbKeys: [] },
  units: { key: 'units', path: '/units', protected: true, permissions: CONTENT, breadcrumbKeys: [] },
  teachers: { key: 'teachers', path: '/teachers', protected: true, permissions: CONTENT, breadcrumbKeys: [] },
  students: { key: 'students', path: '/students', protected: true, permissions: CONTENT, breadcrumbKeys: [] },
  managementUsers: { key: 'managementUsers', path: '/management-users', protected: true, permissions: EMPLOYEES, breadcrumbKeys: [] },
  courses: { key: 'courses', path: '/courses', protected: true, permissions: COURSES, breadcrumbKeys: [] },
  courseDetail: { key: 'courseDetail', path: '/courses/:courseId', protected: true, permissions: COURSES, breadcrumbKeys: [] },
  courseSessions: { key: 'courseSessions', path: '/courses/sessions', protected: true, permissions: COURSES, breadcrumbKeys: [] },
  coursePurchases: { key: 'coursePurchases', path: '/courses/purchases', protected: true, permissions: COURSES, breadcrumbKeys: [] },
  courseSessionDetail: { key: 'courseSessionDetail', path: '/courses/:courseId/sessions/:sessionId/:contentTab?', protected: true, permissions: COURSES, breadcrumbKeys: [] },
  courseContent: { key: 'courseContent', path: '/courses/content', protected: true, permissions: COURSES, breadcrumbKeys: [] },
  resources: { key: 'resources', path: '/resources', protected: true, permissions: RESOURCES, breadcrumbKeys: [] },
  ads: { key: 'ads', path: '/ads', protected: true, permissions: CONTENT, breadcrumbKeys: [] },
  pointsOfSale: { key: 'pointsOfSale', path: '/points-of-sale', protected: true, permissions: QR, breadcrumbKeys: [] },
  qrCodes: { key: 'qrCodes', path: '/qr-codes', protected: true, permissions: QR, breadcrumbKeys: [] },
  notifications: { key: 'notifications', path: '/notifications', protected: true, permissions: NOTIFICATIONS, breadcrumbKeys: [] },
  pageContents: { key: 'pageContents', path: '/page-contents', protected: true, permissions: CONTENT, breadcrumbKeys: [] },
  whatsapp: { key: 'whatsapp', path: '/whatsapp', protected: true, roles: ['SuperAdmin'], breadcrumbKeys: [] },
  otpSettings: { key: 'otpSettings', path: '/settings/otp', protected: true, roles: ['SuperAdmin'], breadcrumbKeys: [] },
  aiChatSettings: { key: 'aiChatSettings', path: '/ai-chat/settings', protected: true, permissions: AI, breadcrumbKeys: [] },
  aiSubscriptions: { key: 'aiSubscriptions', path: '/ai-chat/subscriptions', protected: true, permissions: AI, breadcrumbKeys: [] },
  aiDocuments: { key: 'aiDocuments', path: '/ai-chat/documents', protected: true, permissions: AI, breadcrumbKeys: [] },
  aiQrCodes: { key: 'aiQrCodes', path: '/ai-chat/qr-codes', protected: true, permissions: QR, breadcrumbKeys: [] },
  notFound: { key: 'notFound', path: '/not-found', protected: true, breadcrumbKeys: [] },
} as const

export type AppRouteKey = keyof typeof APP_ROUTES
export type AppRoutes = (typeof APP_ROUTES)[AppRouteKey]['path']
export type AppRouteConfig = { key: AppRouteKey; path: AppRoutes; protected: boolean; roles?: readonly AppRole[]; permissions?: readonly AppPermission[]; requireAllPermissions?: boolean; breadcrumbKeys: readonly string[] }