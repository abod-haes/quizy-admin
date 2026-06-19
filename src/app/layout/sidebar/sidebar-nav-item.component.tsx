import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { NavLink, matchPath, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import {
  isSidebarGroupItem,
  type SidebarItem,
  type SidebarLinkItem,
} from '@/app/layout/sidebar/sidebar.types'

type SidebarNavItemProps = {
  item: SidebarItem
  onNavigate?: () => void
}

function matchesBasePath(item: SidebarLinkItem, pathname: string): boolean {
  if (item.end) {
    return Boolean(matchPath({ path: item.to, end: true }, pathname))
  }

  return Boolean(
    matchPath({ path: item.to, end: true }, pathname) ||
      matchPath({ path: `${item.to}/*`, end: false }, pathname)
  )
}

function matchesAnyPattern(
  patterns: readonly string[] | undefined,
  pathname: string
): boolean {
  if (!patterns?.length) {
    return false
  }

  return patterns.some((pattern) =>
    Boolean(matchPath({ path: pattern, end: true }, pathname))
  )
}

function resolveSidebarLinkActiveState(
  item: SidebarLinkItem,
  pathname: string,
  navLinkIsActive?: boolean
): boolean {
  const isExcluded = matchesAnyPattern(item.activeMatch?.exclude, pathname)
  if (isExcluded) {
    return false
  }

  const isIncluded = matchesAnyPattern(item.activeMatch?.include, pathname)
  const baseActive = navLinkIsActive ?? matchesBasePath(item, pathname)

  return baseActive || isIncluded
}

export function SidebarNavItem({ item, onNavigate }: SidebarNavItemProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const isGroupItem = isSidebarGroupItem(item)
  const isChildActive = (child: SidebarLinkItem) =>
    resolveSidebarLinkActiveState(child, location.pathname)
  const hasActiveChild = isGroupItem
    ? item.children.some((child) => isChildActive(child))
    : false
  const [manualOpenOverride, setManualOpenOverride] = useState<boolean | null>(
    isGroupItem && item.defaultOpen ? true : null
  )
  const isOpen = manualOpenOverride ?? hasActiveChild

  if (!isGroupItem) {
    return <SidebarNavLink item={item} onNavigate={onNavigate} />
  }

  const Icon = item.icon

  return (
    <div className="space-y-1">
      <button
        type="button"
        className={cn(
          'sidebar-nav-link group flex w-full min-w-0 items-center gap-3 rounded-md px-3 py-2 text-start transition-colors',
          'hover:bg-muted/65 hover:text-foreground',
          hasActiveChild ? 'bg-muted text-foreground' : 'text-muted-foreground'
        )}
        onClick={() =>
          setManualOpenOverride((current) => (current === null ? !isOpen : !current))
        }
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            'flex size-7 items-center justify-center rounded-md transition-colors',
            hasActiveChild
              ? 'bg-primary/12 text-primary'
              : 'bg-transparent text-muted-foreground group-hover:text-foreground'
          )}
        >
          <Icon className="size-4 stroke-[2.2]" />
        </span>

        <span className="min-w-0 flex-1 truncate font-[var(--font-sans)] text-[0.97rem] font-semibold tracking-tight">
          {t(item.labelKey)}
        </span>

        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="sidebar-group-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ms-6 space-y-1 border-s border-border/60 ps-2">
              {item.children.map((child) => (
                <SidebarNavLink key={child.id} item={child} onNavigate={onNavigate} nested />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

type SidebarNavLinkProps = {
  item: SidebarLinkItem
  onNavigate?: () => void
  nested?: boolean
}

function SidebarNavLink({ item, onNavigate, nested = false }: SidebarNavLinkProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive: navLinkIsActive }) => {
        const isActive = resolveSidebarLinkActiveState(
          item,
          location.pathname,
          navLinkIsActive
        )

        return cn(
          'sidebar-nav-link group flex w-full min-w-0 items-center gap-3 text-start transition-colors',
          nested ? 'rounded-md px-2 py-1.5' : 'rounded-md px-3 py-2',
          'hover:bg-muted/65 hover:text-foreground',
          isActive && 'bg-muted text-foreground',
          !isActive && 'text-muted-foreground'
        )
      }}
    >
      {({ isActive: navLinkIsActive }) => {
        const isActive = resolveSidebarLinkActiveState(
          item,
          location.pathname,
          navLinkIsActive
        )

        return (
          <>
            <span
              className={cn(
                'flex items-center justify-center rounded-md transition-colors',
                nested ? 'size-6' : 'size-7',
                isActive
                  ? 'bg-primary/12 text-primary'
                  : 'bg-transparent text-muted-foreground group-hover:text-foreground'
              )}
            >
              <Icon className={cn(nested ? 'size-3.5 stroke-[2.1]' : 'size-4 stroke-[2.2]')} />
            </span>

            <span
              className={cn(
                'min-w-0 flex-1 truncate font-[var(--font-sans)] tracking-tight',
                nested ? 'text-[0.92rem] font-medium' : 'text-[0.97rem] font-semibold'
              )}
            >
              {t(item.labelKey)}
            </span>

            {item.badge ? (
              <span
                className={cn(
                  'ms-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.7rem] font-semibold text-primary'
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </>
        )
      }}
    </NavLink>
  )
}
