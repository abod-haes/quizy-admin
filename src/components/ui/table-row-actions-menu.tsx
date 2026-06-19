import { useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type TableRowActionConfirmConfig = {
  type?: 'destructive' | 'warning' | 'success' | 'info'
  title?: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  confirmingLabel?: ReactNode
  cancelLabel?: ReactNode
}

export type TableRowActionItem<TRow> = {
  label: string
  icon?: ReactNode
  onClick: (row: TRow) => void | Promise<void>
  disabled?: boolean
  variant?: 'default' | 'destructive'
  key?: string
  /**
   * When provided, the action will require confirmation.
   * If omitted and `variant` is `destructive`, confirmation is enabled by default.
   * Set to `false` to explicitly disable confirmation.
   */
  confirm?: false | TableRowActionConfirmConfig
}

type TableRowActionsMenuProps<TRow> = {
  row: TRow
  actions: TableRowActionItem<TRow>[]
  triggerAriaLabel: string
}

export function TableRowActionsMenu<TRow>({
  row,
  actions,
  triggerAriaLabel,
}: TableRowActionsMenuProps<TRow>) {
  const { t, i18n } = useTranslation()
  const contentAlign = i18n.dir() === 'rtl' ? 'start' : 'end'

  const hasActions = actions.length > 0
  const [pendingConfirmAction, setPendingConfirmAction] = useState<TableRowActionItem<TRow> | null>(null)
  const isConfirmOpen = Boolean(pendingConfirmAction)
  const confirmConfig: TableRowActionConfirmConfig | undefined =
    pendingConfirmAction?.confirm === false ? undefined : pendingConfirmAction?.confirm

  return (
    <>
      <ConfirmDialog
        type={confirmConfig?.type ?? 'destructive'}
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setPendingConfirmAction(null)
          }
        }}
        title={
          confirmConfig?.title
            ? confirmConfig.title
            : t('common.actions.confirmDeleteTitle', { ns: 'translation', defaultValue: 'Confirm deletion' })
        }
        description={
          confirmConfig?.description
            ? confirmConfig.description
            : t('common.actions.confirmDeleteDescription', { ns: 'translation', defaultValue: 'Are you sure you want to delete this item?' })
        }
        confirmLabel={
          confirmConfig?.confirmLabel
            ? confirmConfig.confirmLabel
            : pendingConfirmAction?.label ?? t('common.actions.delete', { ns: 'translation', defaultValue: 'Delete' })
        }
        confirmingLabel={
          confirmConfig?.confirmingLabel
            ? confirmConfig.confirmingLabel
            : t('common.actions.deleting', { ns: 'translation', defaultValue: 'Deleting...' })
        }
        cancelLabel={
          confirmConfig?.cancelLabel
            ? confirmConfig.cancelLabel
            : t('common.actions.cancel', { ns: 'translation', defaultValue: 'Cancel' })
        }
        onConfirm={() => {
          const targetAction = pendingConfirmAction
          if (!targetAction) return
          return targetAction.onClick(row)
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            aria-label={triggerAriaLabel}
            disabled={!hasActions}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        {hasActions ? (
          <DropdownMenuContent align={contentAlign} sideOffset={8} className="w-48 min-w-48 rounded-md border border-border bg-card p-1">
            {actions.map((action, index) => {
              const shouldConfirm =
                action.confirm !== false &&
                (action.confirm !== undefined || (action.variant ?? 'default') === 'destructive')

              return (
                <DropdownMenuItem
                  key={action.key ?? `row-action-${index}`}
                  disabled={action.disabled}
                  variant={action.variant ?? 'default'}
                  className="h-9 gap-2 rounded-sm px-2.5 text-sm"
                  onSelect={() => {
                    if (shouldConfirm) {
                      setPendingConfirmAction(action)
                      return
                    }
                    action.onClick(row)
                  }}
                >
                  {action.icon ? <span className="text-muted-foreground [&_svg]:size-4">{action.icon}</span> : null}
                  <span className="flex-1 text-start">{action.label}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        ) : null}
      </DropdownMenu>
    </>
  )
}
