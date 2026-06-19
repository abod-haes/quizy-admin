import { BrainCircuit } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function SidebarBrand() {
  const { t } = useTranslation()

  return (
    <header className="flex items-center gap-3 border-b border-border/70 px-3 pb-4">
      <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_45%)]" />
        <BrainCircuit className="relative size-6" />
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <p className="font-[var(--font-sans)] text-[1.1rem] font-extrabold tracking-tight text-foreground">
          {t('layout.brand.name')}
        </p>
        <p className="pt-1 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-primary">
          {t('layout.brand.subtitle')}
        </p>
      </div>
    </header>
  )
}
