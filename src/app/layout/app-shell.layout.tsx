import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'

import { AppShellHeader } from '@/app/layout/app-shell-header.component'
import { AppSidebar } from '@/app/layout/sidebar/app-sidebar.component'
import { MobileSidebarDrawer } from '@/app/layout/sidebar/mobile-sidebar-drawer.component'
import { cn } from '@/lib/utils'

export function AppShellLayout() {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const { i18n, t } = useTranslation()
  const location = useLocation()

  const isRtl = i18n.dir() === 'rtl'
  const directionClass = isRtl ? 'app-dir-rtl' : 'app-dir-ltr'
  const pageTitle = useMemo(() => {
    const brandName = t('layout.brand.name')
    const segments = location.pathname.split('/').filter(Boolean)
    const firstSegment = segments[0] ?? 'dashboard'

    const moduleMap: Record<string, string> = {
      dashboard: t('layout.meta.dashboard.plural'),
      quizzes: t('layout.meta.quizzes.plural'),
      questions: t('layout.meta.questions.plural'),
      teachers: t('layout.meta.teachers.plural'),
      students: t('layout.meta.students.plural'),
      units: t('layout.meta.units.plural'),
      lessons: t('layout.meta.lessons.plural'),
    }

    if (firstSegment === 'login') {
      return `${brandName} - ${t('layout.meta.login')}`
    }

    if (firstSegment === 'not-found') {
      return `${brandName} - ${t('layout.meta.notFound')}`
    }

    return `${brandName} - ${moduleMap[firstSegment] ?? moduleMap.dashboard}`
  }, [location.pathname, t])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = pageTitle
  }, [pageTitle])

  return (
    <div className={cn('app-shell-root h-screen bg-background', directionClass)}>
      <div className="app-shell-frame">
        <div className="hidden md:block">
          <AppSidebar className="h-screen rounded-none border-y-0 border-s-0 shadow-none" />
        </div>

        <section className="relative flex min-h-[70vh] flex-1 flex-col overflow-hidden bg-transparent">
          <AppShellHeader onOpenMobileMenu={() => setMobileOpen(true)} />

          <main className="flex w-full flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </section>
      </div>

      <MobileSidebarDrawer open={mobileOpen} onOpenChange={setMobileOpen} isRtl={isRtl} />
    </div>
  )
}
