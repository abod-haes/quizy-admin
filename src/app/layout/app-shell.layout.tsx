import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'

import { AppShellHeader } from '@/app/layout/app-shell-header.component'
import { AppSidebar } from '@/app/layout/sidebar/app-sidebar.component'
import { MobileSidebarDrawer } from '@/app/layout/sidebar/mobile-sidebar-drawer.component'
import { cn } from '@/lib/utils'

const moduleTranslationKeys: Record<string, string> = {
  dashboard: 'dashboard',
  'quiz-builder': 'quizBuilder',
  quizzes: 'quizzes',
  questions: 'questions',
  classes: 'classes',
  subjects: 'subjects',
  units: 'units',
  lessons: 'lessons',
  teachers: 'teachers',
  students: 'students',
  courses: 'courses',
  resources: 'resources',
}

const moduleTitleFallbacks: Record<string, string> = {
  courses: 'Courses',
  courseSessions: 'Sessions',
  resources: 'Resources',
}

const FIXED_TABLE_PATHS = new Set([
  '/quizzes',
  '/questions',
  '/classes',
  '/subjects',
  '/units',
  '/lessons',
  '/teachers',
  '/students',
  '/management-users',
  '/courses',
  '/courses/sessions',
  '/courses/purchases',
  '/resources',
  '/ads',
  '/points-of-sale',
  '/qr-codes',
  '/notifications',
  '/page-contents',
  '/ai-chat/subscriptions',
  '/ai-chat/documents',
  '/ai-chat/qr-codes',
])

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized || '/'
}

export function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const { i18n, t } = useTranslation()
  const location = useLocation()

  const isRtl = i18n.dir() === 'rtl'
  const directionClass = isRtl ? 'app-dir-rtl' : 'app-dir-ltr'
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0] ?? 'dashboard'
  const secondSegment = pathSegments[1]
  const normalizedPathname = normalizePathname(location.pathname)
  const shouldLockPageScroll = FIXED_TABLE_PATHS.has(normalizedPathname)

  const pageTitle = useMemo(() => {
    const brandName = t('layout.brand.name')

    if (firstSegment === 'login') return brandName + ' - ' + t('layout.meta.login')
    if (firstSegment === 'not-found') return brandName + ' - ' + t('layout.meta.notFound')
    if (firstSegment === 'courses' && secondSegment === 'sessions') return brandName + ' - ' + t('layout.meta.courseSessions.plural', { defaultValue: moduleTitleFallbacks.courseSessions })

    const moduleKey = moduleTranslationKeys[firstSegment]
    if (!moduleKey) return brandName

    return brandName + ' - ' + t('layout.meta.' + moduleKey + '.plural', { defaultValue: moduleTitleFallbacks[moduleKey] ?? brandName })
  }, [firstSegment, secondSegment, t])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = pageTitle
  }, [pageTitle])

  return (
    <div className={cn('app-shell-root h-dvh min-h-screen w-full min-w-0 overflow-hidden bg-background', directionClass)}>
      <div className="app-shell-frame min-w-0">
        <div className="hidden shrink-0 md:block">
          <AppSidebar className="h-dvh rounded-none border-y-0 border-s-0 shadow-none" />
        </div>

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <AppShellHeader onOpenMobileMenu={() => setMobileOpen(true)} />

          <main
            className={cn(
              'flex min-h-0 min-w-0 w-full flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6 2xl:px-8',
              shouldLockPageScroll
                ? 'admin-fixed-table-page overflow-hidden'
                : 'overflow-y-auto overflow-x-hidden'
            )}
          >
            <div className={cn('min-h-0 min-w-0 w-full flex-1', shouldLockPageScroll && 'h-full overflow-hidden')}>
              <Outlet />
            </div>
          </main>
        </section>
      </div>

      <MobileSidebarDrawer open={mobileOpen} onOpenChange={setMobileOpen} isRtl={isRtl} />
    </div>
  )
}