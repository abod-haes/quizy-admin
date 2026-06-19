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
    const firstSegment = segments[0] ?? ''
    const actionSegment = segments[1] ?? ''

    const moduleMap: Record<string, { plural: string; singular: string }> = {
      home: {
        plural: t('layout.meta.home.plural'),
        singular: t('layout.meta.home.singular'),
      },
      'about-us': {
        plural: t('layout.meta.aboutUs.plural'),
        singular: t('layout.meta.aboutUs.singular'),
      },
      pages: {
        plural: t('layout.meta.pages.plural'),
        singular: t('layout.meta.pages.singular'),
      },
      projects: {
        plural: t('layout.meta.projects.plural'),
        singular: t('layout.meta.projects.singular'),
      },
      'page-sections': {
        plural: t('layout.meta.pageSections.plural'),
        singular: t('layout.meta.pageSections.singular'),
      },
      'section-items': {
        plural: t('layout.meta.sectionItems.plural'),
        singular: t('layout.meta.sectionItems.singular'),
      },
      'board-members': {
        plural: t('layout.meta.boardMembers.plural'),
        singular: t('layout.meta.boardMembers.singular'),
      },
      'gallery-items': {
        plural: t('layout.meta.galleryItems.plural'),
        singular: t('layout.meta.galleryItems.singular'),
      },
      faqs: {
        plural: t('layout.meta.faqs.plural'),
        singular: t('layout.meta.faqs.singular'),
      },
      'footer-links': {
        plural: t('layout.meta.footerLinks.plural'),
        singular: t('layout.meta.footerLinks.singular'),
      },
      'contact-infos': {
        plural: t('layout.meta.contactInfos.plural'),
        singular: t('layout.meta.contactInfos.singular'),
      },
      'contact-messages': {
        plural: t('layout.meta.contactMessages.plural'),
        singular: t('layout.meta.contactMessages.singular'),
      },
    }

    if (firstSegment === 'login') {
      return `${brandName} - ${t('layout.meta.login')}`
    }

    if (firstSegment === 'not-found') {
      return `${brandName} - ${t('layout.meta.notFound')}`
    }

    const moduleTitle = moduleMap[firstSegment]
    if (!moduleTitle) {
      return brandName
    }

    if (actionSegment === 'add') {
      return `${brandName} - ${t('layout.meta.add')} ${moduleTitle.singular}`
    }

    if (actionSegment === 'edit') {
      return `${brandName} - ${t('layout.meta.edit')} ${moduleTitle.singular}`
    }

    if (actionSegment === 'view') {
      return `${brandName} - ${t('layout.meta.view')} ${moduleTitle.singular}`
    }

    return `${brandName} - ${moduleTitle.plural}`
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

        <section className="relative flex min-h-[70vh] flex-1 flex-col overflow-hidden bg-background">
          <AppShellHeader onOpenMobileMenu={() => setMobileOpen(true)} />

          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 flex w-full">
            <Outlet />
          </main>
        </section>
      </div>

      <MobileSidebarDrawer open={mobileOpen} onOpenChange={setMobileOpen} isRtl={isRtl} />
    </div>
  )
}
