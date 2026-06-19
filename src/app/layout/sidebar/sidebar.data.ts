import { Folder } from 'lucide-react'


import type { SidebarItem } from '@/app/layout/sidebar/sidebar.types'
import { APP_ROUTES } from '@/app/router/route-object.type'

export const primarySidebarItems: SidebarItem[] = [
  {
    id: 'pages',
    labelKey: 'sidebar.items.pages',
    to: APP_ROUTES.pages.path,
    icon: Folder,
    end: true,
    activeMatch: {
      include: [APP_ROUTES.pages.path + '/add', APP_ROUTES.pages.path + '/view/:id', APP_ROUTES.pages.path + '/edit/:id'],
    },
  },

  {
    id: 'faqs',
    labelKey: 'sidebar.items.faqs',
    to: APP_ROUTES.faqs.path,
    icon: Folder,
    end: true,
    activeMatch: {
      include: [APP_ROUTES.faqs.path + '/add', APP_ROUTES.faqs.path + '/view/:id', APP_ROUTES.faqs.path + '/edit/:id'],
    },
  },
]

export const secondarySidebarItems: SidebarItem[] = []
