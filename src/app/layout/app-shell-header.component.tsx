import { Check, Languages, Menu, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

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

const pageLabelBySegment: Record<string, string> = {
  dashboard: 'sidebar.items.dashboard',
  'quiz-builder': 'sidebar.items.quizBuilder',
  quizzes: 'sidebar.items.quizzes',
  questions: 'sidebar.items.questions',
  classes: 'sidebar.items.classes',
  subjects: 'sidebar.items.subjects',
  units: 'sidebar.items.units',
  lessons: 'sidebar.items.lessons',
  teachers: 'sidebar.items.teachers',
  students: 'sidebar.items.students',
  courses: 'sidebar.items.courses',
  resources: 'sidebar.items.resources',
}

export function AppShellHeader({ onOpenMobileMenu }: AppShellHeaderProps) {
  const { t, i18n } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const location = useLocation()
  const isRtl = i18n.dir() === 'rtl'
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language).split('-')[0]
  const isDark = resolvedTheme === 'dark'
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const currentSegment = pathSegments[0] ?? 'dashboard'
  const pageLabelKey = currentSegment === 'courses' && pathSegments[1] === 'sessions'
    ? 'sidebar.items.courseSessions'
    : pageLabelBySegment[currentSegment] ?? 'sidebar.items.dashboard'

  const changeLanguage = (language: 'ar' | 'en') => {
    if (activeLanguage === language) return
    void i18n.changeLanguage(language)
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/80 bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('layout.mobile.openNavigation')}
        className="app-shell-mobile-menu text-muted-foreground hover:bg-muted/60 hover:text-foreground md:hidden"
        onClick={onOpenMobileMenu}
      >
        <Menu className="size-4" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t('layout.brand.name')}
        </p>
        <h2 className="truncate text-base font-bold text-foreground sm:text-lg">
          {t(pageLabelKey)}
        </h2>
      </div>

      <div className="ms-auto flex items-center gap-1.5">
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
      </div>
    </header>
  )
}
