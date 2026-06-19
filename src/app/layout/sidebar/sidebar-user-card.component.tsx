import { ChevronUp, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import { logoutAdmin } from '@/modules/auth/services/auth.services'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function getInitials(name: string): string {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)

  if (!parts.length) {
    return 'U'
  }

  const [first = '', second = ''] = parts
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase()
}

export function SidebarUserCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const displayName = user?.name?.trim() || t('sidebar.user.guestName', { defaultValue: 'System User' })
  const displayRole = user?.role?.trim() || t('sidebar.user.guestRole', { defaultValue: 'User' })
  const userInitials = getInitials(displayName)

  const handleLogout = async () => {
    try {
      await logoutAdmin()
    } catch {
      // Continue with client-side logout even if API request fails.
    } finally {
      logout()
      navigate(APP_ROUTES.login.path, { replace: true })
    }
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="sidebar-user-row flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start transition-colors hover:bg-muted/65 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20"
            aria-label={t('sidebar.user.menuAriaLabel', { defaultValue: 'Open user menu' })}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[0.72rem] font-bold text-primary">
              {userInitials}
            </div>

            <div className="min-w-0 flex-1 text-start">
              <p className="truncate font-[var(--font-sans)] text-[0.84rem] font-bold text-foreground">
                {displayName}
              </p>
              <p className="truncate pt-0.5 text-[0.72rem] font-medium text-muted-foreground">
                {displayRole}
              </p>
            </div>

            <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="top" className="min-w-48">
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault()
              setIsLogoutDialogOpen(true)
            }}
            className="cursor-pointer"
          >
            <LogOut className="size-4" />
            {t('sidebar.user.logout', { defaultValue: 'Logout' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        type="destructive"
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        title={t('sidebar.user.logoutConfirm.title', { defaultValue: 'Confirm logout' })}
        description={t('sidebar.user.logoutConfirm.description', {
          defaultValue: 'Are you sure you want to log out from your account?',
        })}
        confirmLabel={t('sidebar.user.logoutConfirm.confirm', { defaultValue: 'Logout' })}
        confirmingLabel={t('sidebar.user.logoutConfirm.confirming', { defaultValue: 'Logging out...' })}
        cancelLabel={t('sidebar.user.logoutConfirm.cancel', { defaultValue: 'Cancel' })}
        onConfirm={handleLogout}
      />
    </div>
  )
}
