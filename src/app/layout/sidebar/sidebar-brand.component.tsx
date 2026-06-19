import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function SidebarBrand() {
  const { t } = useTranslation()

  return (
    <header className="flex items-center gap-3 border-b border-border px-3 pb-3">
      <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Building2 className="size-5" />
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <p className="font-[var(--font-sans)] text-[1.05rem] font-bold tracking-tight text-foreground">
          {t('layout.brand.name')}
        </p>
        <p className="pt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t('layout.brand.subtitle')}
        </p>
      </div>
    </header>
  )
}
