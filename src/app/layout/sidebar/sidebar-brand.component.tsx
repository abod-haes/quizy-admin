import { BrainCircuit } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function SidebarBrand() {
  const { t } = useTranslation()

  return (
    <header className="flex items-center gap-3 border-b border-border/70 px-2 pb-4">
      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[1.15rem] border border-primary/15 bg-white shadow-md shadow-primary/10 dark:border-white/10 dark:bg-white/95">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.18),transparent_48%)]" />
        <img src="/q-light.png" alt="" className="relative size-9 object-contain" />
        <BrainCircuit className="relative hidden size-6 text-primary" />
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-2xl font-extrabold tracking-tight text-foreground">
            كويزي
          </span>
          <span className="rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.22em] text-primary dark:border-primary/30 dark:bg-primary/15">
            Quizy
          </span>
        </div>
        <p className="pt-1 text-[0.7rem] font-bold tracking-[0.05em] text-muted-foreground">
          {t('layout.brand.subtitle')}
        </p>
      </div>
    </header>
  )
}
