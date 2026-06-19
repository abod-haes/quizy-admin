import { Bell, Check, CircleHelp, Languages, Menu, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

 type AppShellHeaderProps = {
  onOpenMobileMenu: () => void
}

export function AppShellHeader({ onOpenMobileMenu }: AppShellHeaderProps) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const isRtl = i18n.dir() === 'rtl'
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language).split('-')[0]
  const isDark = resolvedTheme === 'dark'

  const changeLanguage = (language: 'ar' | 'en') => {
    if (activeLanguage === language) return
    void i18n.changeLanguage(language)
  }

  return (
    <header className="flex items-center gap-3 border-b border-border/80 bg-card/95 px-4 py-3 backdrop-blur">
      <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Search className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t('layout.header.eyebrow')}
          </p>
          <p className="truncate text-sm font-medium text-muted-foreground">
            {t('layout.header.title')}
          </p>
        </div>
      </div>

      <div className="app-shell-header-actions ms-auto flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={isDark ? t('layout.header.switchToLight') : t('layout.header.switchToDark')}
          className="text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('layout.header.notifications')}
        >
          <Bell className="size-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('layout.header.helpCenter')}
        >
          <CircleHelp className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('layout.language.menuLabel')}
              className="text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <Languages className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isRtl ? 'start' : 'end'}
            sideOffset={8}
            className="w-40 min-w-40"
          >
            <DropdownMenuItem
              className="justify-between gap-3"
              onSelect={() => changeLanguage('ar')}
            >
              <span>{t('layout.language.arabicName')}</span>
              {activeLanguage === 'ar' ? <Check className="size-4 text-primary" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="justify-between gap-3"
              onSelect={() => changeLanguage('en')}
            >
              <span>{t('layout.language.englishName')}</span>
              {activeLanguage === 'en' ? <Check className="size-4 text-primary" /> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('layout.mobile.openNavigation')}
          className="app-shell-mobile-menu ml-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground md:hidden"
          onClick={onOpenMobileMenu}
        >
          <Menu className="size-4" />
        </Button>
      </div>
    </header>
  )
}
