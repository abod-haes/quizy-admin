import type { ComponentPropsWithoutRef } from 'react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SidebarBrand } from '@/app/layout/sidebar/sidebar-brand.component'
import {
  primarySidebarItems,
  secondarySidebarItems,
} from '@/app/layout/sidebar/sidebar.data'
import { SidebarNavItem } from '@/app/layout/sidebar/sidebar-nav-item.component'
import {
  isSidebarGroupItem,
} from '@/app/layout/sidebar/sidebar.types'
import { SidebarUserCard } from '@/app/layout/sidebar/sidebar-user-card.component'

type AppSidebarProps = ComponentPropsWithoutRef<'aside'> & {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate, className, ...props }: AppSidebarProps) {
  const location = useLocation()

  const allowedPrimaryItems = useMemo(
    () => primarySidebarItems,
    []
  )
  const allowedSecondaryItems = useMemo(
    () => secondarySidebarItems,
    []
  )

  return (
    <aside
      {...props}
      className={cn(
        'flex h-full w-72 min-h-0 flex-col overflow-hidden border-e border-border/80 bg-card p-4',
        className
      )}
    >
      <SidebarBrand />

      <div className="min-h-0 flex-1 overflow-y-auto pe-1">
        <nav className="space-y-2 pt-3">
          {allowedPrimaryItems.map((item) => (
            <SidebarNavItem
              key={isSidebarGroupItem(item) ? `${item.id}:${location.pathname}` : item.id}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>

      <div className="mt-4 shrink-0 rounded-2xl border border-border/70 bg-background/70 p-2 shadow-sm backdrop-blur">
        <nav className="space-y-1">
          {allowedSecondaryItems.map((item) => (
            <SidebarNavItem
              key={isSidebarGroupItem(item) ? `${item.id}:${location.pathname}` : item.id}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <Separator className="my-3 bg-border/70" />

        <SidebarUserCard />
      </div>
    </aside>
  )
}
