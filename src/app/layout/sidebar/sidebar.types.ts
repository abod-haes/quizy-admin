import type { LucideIcon } from 'lucide-react'

import type { AppRole } from '@/app/auth/access-control.types'
import type { AppPermission } from '@/constants/permissions'

type SidebarAccessConfig = {
  roles?: readonly AppRole[]
  permissions?: readonly AppPermission[]
  requireAllPermissions?: boolean
}

type SidebarActiveMatchConfig = {
  include?: readonly string[]
  exclude?: readonly string[]
}

export type SidebarLinkItem = SidebarAccessConfig & {
  id: string
  labelKey: string
  to: string
  icon: LucideIcon
  end?: boolean
  badge?: string
  activeMatch?: SidebarActiveMatchConfig
}

export type SidebarGroupItem = SidebarAccessConfig & {
  id: string
  labelKey: string
  icon: LucideIcon
  children: SidebarLinkItem[]
  defaultOpen?: boolean
}

export type SidebarItem = SidebarLinkItem | SidebarGroupItem

export function isSidebarGroupItem(item: SidebarItem): item is SidebarGroupItem {
  return 'children' in item
}
