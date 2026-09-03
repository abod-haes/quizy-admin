type RoutePresentation = {
  labelKey: string
  fixedTable?: boolean
}

const ROUTE_PRESENTATION: Record<string, RoutePresentation> = {
  '/dashboard': { labelKey: 'sidebar.items.dashboard' },
  '/quiz-builder': { labelKey: 'sidebar.items.quizBuilder' },
  '/quizzes': { labelKey: 'sidebar.items.quizzes', fixedTable: true },
  '/questions': { labelKey: 'sidebar.items.questions', fixedTable: true },
  '/classes': { labelKey: 'sidebar.items.classes', fixedTable: true },
  '/subjects': { labelKey: 'sidebar.items.subjects', fixedTable: true },
  '/units': { labelKey: 'sidebar.items.units', fixedTable: true },
  '/lessons': { labelKey: 'sidebar.items.lessons', fixedTable: true },
  '/teachers': { labelKey: 'sidebar.items.teachers', fixedTable: true },
  '/students': { labelKey: 'sidebar.items.students', fixedTable: true },
  '/management-users': {
    labelKey: 'content-crud:modules.managementUsers.title',
    fixedTable: true,
  },
  '/courses': { labelKey: 'sidebar.items.courses', fixedTable: true },
  '/courses/sessions': { labelKey: 'sidebar.items.courseSessions', fixedTable: true },
  '/courses/purchases': { labelKey: 'sidebar.items.coursePurchases', fixedTable: true },
  '/courses/content': { labelKey: 'sidebar.items.courseContent' },
  '/resources': { labelKey: 'content-crud:modules.resources.title', fixedTable: true },
  '/ads': { labelKey: 'content-crud:modules.ads.title', fixedTable: true },
  '/points-of-sale': {
    labelKey: 'content-crud:modules.pointsOfSale.title',
    fixedTable: true,
  },
  '/qr-codes': { labelKey: 'sidebar.items.qrCodes', fixedTable: true },
  '/notifications': {
    labelKey: 'content-crud:modules.notifications.title',
    fixedTable: true,
  },
  '/page-contents': {
    labelKey: 'content-crud:modules.pageContents.title',
    fixedTable: true,
  },
  '/whatsapp': { labelKey: 'sidebar.items.whatsappSettings' },
  '/settings/otp': { labelKey: 'sidebar.items.otpSettings' },
  '/ai-chat/settings': { labelKey: 'sidebar.items.aiChatSettings' },
  '/ai-chat/subscriptions': {
    labelKey: 'sidebar.items.aiSubscriptions',
    fixedTable: true,
  },
  '/ai-chat/documents': { labelKey: 'sidebar.items.aiDocuments', fixedTable: true },
  '/ai-chat/qr-codes': { labelKey: 'sidebar.items.qrCodes', fixedTable: true },
}

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized || '/'
}

export function getAdminRoutePresentation(pathname: string): RoutePresentation | null {
  const normalized = normalizePathname(pathname)
  const exact = ROUTE_PRESENTATION[normalized]
  if (exact) return exact

  if (normalized.startsWith('/questions/')) {
    return { labelKey: 'sidebar.items.questions' }
  }

  if (normalized.startsWith('/courses/')) {
    return { labelKey: 'sidebar.items.courses' }
  }

  return null
}

export function isFixedAdminTablePath(pathname: string) {
  return Boolean(getAdminRoutePresentation(pathname)?.fixedTable)
}
