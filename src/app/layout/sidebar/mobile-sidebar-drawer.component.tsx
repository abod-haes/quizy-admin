import type { Dispatch, SetStateAction } from 'react'

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AppSidebar } from '@/app/layout/sidebar/app-sidebar.component'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MobileSidebarDrawerProps = {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  isRtl?: boolean
}

export function MobileSidebarDrawer({ open, onOpenChange, isRtl = false }: MobileSidebarDrawerProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200 md:hidden',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <button
        type="button"
        aria-label={t('sidebar.closeNavigation')}
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn('absolute inset-y-0 z-10 w-[min(22rem,85vw)] overflow-hidden transition-transform duration-200', isRtl ? 'right-0' : 'left-0', open ? 'translate-x-0' : isRtl ? 'translate-x-full' : '-translate-x-full')}
      >
        <div className={cn('absolute top-3 z-20', isRtl ? 'left-3' : 'right-3')}>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="border-border/80 bg-card/90 text-foreground hover:bg-card"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <AppSidebar
          onNavigate={() => onOpenChange(false)}
          className="h-full w-full max-w-none rounded-none border-0 pt-16"
        />
      </div>
    </div>
  )
}
