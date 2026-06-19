import { LayoutDashboard } from 'lucide-react'

import type { SidebarItem } from '@/app/layout/sidebar/sidebar.types'
import { APP_ROUTES } from '@/app/router/route-object.type'

export const primarySidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    labelKey: 'sidebar.items.dashboard',
    to: APP_ROUTES.dashboard.path,
    icon: LayoutDashboard,
    end: true,
  },
]

export const secondarySidebarItems: SidebarItem[] = []
