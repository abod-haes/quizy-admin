import { useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
          if (!open) setPendingConfirmAction(null)
        }}
        title={confirmConfig?.title ?? t('common.actions.confirmDeleteTitle', { ns: 'translation', defaultValue: 'Confirm deletion' })}
        description={confirmConfig?.description ?? t('common.actions.confirmDeleteDescription', { ns: 'translation', defaultValue: 'Are you sure you want to delete this item?' })}
        confirmLabel={confirmConfig?.confirmLabel ?? pendingConfirmAction?.label ?? t('common.actions.delete', { ns: 'translation', defaultValue: 'Delete' })}
        confirmingLabel={confirmConfig?.confirmingLabel ?? t('common.actions.deleting', { ns: 'translation', defaultValue: 'Deleting...' })}
        cancelLabel={confirmConfig?.cancelLabel ?? t('common.actions.cancel', { ns: 'translation', defaultValue: 'Cancel' })}
        onConfirm={() => pendingConfirmAction?.onClick(row)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-xl text-muted-foreground hover:bg-primary/8 hover:text-foreground data-[state=open]:bg-primary/10 data-[state=open]:text-primary"
            aria-label={triggerAriaLabel}
            disabled={!hasActions}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        {hasActions ? (
          <DropdownMenuContent
            align={contentAlign}
            sideOffset={8}
            className="w-52 min-w-52 rounded-xl border border-primary/10 bg-popover p-1.5 shadow-[var(--quizy-popup-shadow)]"
          >
            {actions.map((action, index) => {
              const shouldConfirm =
                action.confirm !== false &&
                (action.confirm !== undefined || (action.variant ?? 'default') === 'destructive')

              return (
                <DropdownMenuItem
                  key={action.key ?? `row-action-${index}`}
                  disabled={action.disabled}
                  variant={action.variant ?? 'default'}
                  className="min-h-10 gap-2 rounded-lg px-3 text-sm font-medium"
                  onSelect={() => {
                    if (shouldConfirm) {
                      setPendingConfirmAction(action)
                      return
                    }
                    void action.onClick(row)
                  }}
                >
                  {action.icon ? (
                    <span className="shrink-0 text-muted-foreground [&_svg]:size-4">{action.icon}</span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-start">{action.label}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        ) : null}
      </DropdownMenu>
    </>
  )
}
