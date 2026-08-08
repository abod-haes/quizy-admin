import type { ComponentPropsWithoutRef } from 'react'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
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
  type SidebarItem,
  type SidebarLinkItem,
} from '@/app/layout/sidebar/sidebar.types'
import { SidebarUserCard } from '@/app/layout/sidebar/sidebar-user-card.component'

type AppSidebarProps = ComponentPropsWithoutRef<'aside'> & {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate, className, ...props }: AppSidebarProps) {
  const location = useLocation()
  const { hasAnyRole, hasAnyPermission } = useAuth()

  const isAllowed = (item: SidebarLinkItem) =>
    hasAnyRole(item.roles) &&
    hasAnyPermission(item.permissions, item.requireAllPermissions ?? false)

  const filterItems = (items: SidebarItem[]): SidebarItem[] =>
    items.flatMap((item) => {
      if (!isSidebarGroupItem(item)) return isAllowed(item) ? [item] : []
      if (!hasAnyRole(item.roles) || !hasAnyPermission(item.permissions, item.requireAllPermissions ?? false)) {
        return []
      }
      const children = item.children.filter(isAllowed)
      return children.length ? [{ ...item, children }] : []
    })

  const allowedPrimaryItems = useMemo(
    () => filterItems(primarySidebarItems),
    // AuthProvider functions are stable callbacks and update when their backing session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasAnyRole, hasAnyPermission],
  )
  const allowedSecondaryItems = useMemo(
    () => filterItems(secondarySidebarItems),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasAnyRole, hasAnyPermission],
  )

  return (
    <aside
      {...props}
      className={cn(
        'quizy-sidebar-shell flex h-full w-72 min-h-0 flex-col overflow-hidden border-e p-4 backdrop-blur-xl',
        className,
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

      <div className="mt-4 shrink-0 rounded-2xl border border-border/70 bg-background/55 p-2 shadow-sm backdrop-blur dark:bg-white/[0.04]">
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
