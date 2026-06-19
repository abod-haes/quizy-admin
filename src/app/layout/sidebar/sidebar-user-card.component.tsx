import { ChevronUp, KeyRound, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import { forgotPasswordAdmin, logoutAdmin } from '@/modules/auth/services/auth.services'
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
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false)

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

  const handleForgotPassword = async () => {
    const email = user?.email?.trim()
    if (!email) {
      toast.error(t('sidebar.user.forgotPasswordErrors.missingEmail', { defaultValue: 'No email is associated with this account.' }))
      return
    }

    await forgotPasswordAdmin({ email })
    toast.success(
      t('sidebar.user.forgotPasswordSuccess', {
        defaultValue: 'Password reset link has been sent to your email.',
      })
    )
  }

  return (
    <div className="border-t border-border bg-card px-3 pt-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="sidebar-user-row flex w-full items-center gap-3 rounded-md px-2 py-2 text-start transition-colors hover:bg-muted/65 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20"
            aria-label={t('sidebar.user.menuAriaLabel', { defaultValue: 'Open user menu' })}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-[0.72rem] font-bold text-foreground">
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
            onSelect={(event) => {
              event.preventDefault()
              setIsForgotPasswordDialogOpen(true)
            }}
            className="cursor-pointer"
          >
            <KeyRound className="size-4" />
            {t('sidebar.user.forgotPassword', { defaultValue: 'Forgot password' })}
          </DropdownMenuItem>
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
        type="info"
        open={isForgotPasswordDialogOpen}
        onOpenChange={setIsForgotPasswordDialogOpen}
        title={t('sidebar.user.forgotPasswordConfirm.title', { defaultValue: 'Send reset password link?' })}
        description={t('sidebar.user.forgotPasswordConfirm.description', {
          defaultValue: 'A reset password link will be sent to your account email.',
        })}
        confirmLabel={t('sidebar.user.forgotPasswordConfirm.confirm', { defaultValue: 'Send link' })}
        confirmingLabel={t('sidebar.user.forgotPasswordConfirm.confirming', { defaultValue: 'Sending...' })}
        cancelLabel={t('sidebar.user.forgotPasswordConfirm.cancel', { defaultValue: 'Cancel' })}
        onConfirm={handleForgotPassword}
      />

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
