import { BookOpenCheck, FileQuestion, GraduationCap, Layers3, Sparkles, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const stats = [
  { key: 'quizzes', icon: FileQuestion, value: '0', trend: '+0%' },
  { key: 'questions', icon: BookOpenCheck, value: '0', trend: '+0%' },
  { key: 'teachers', icon: GraduationCap, value: '0', trend: '+0%' },
  { key: 'students', icon: UsersRound, value: '0', trend: '+0%' },
]

const modules = ['units', 'lessons', 'quizzes', 'questions'] as const

export function DashboardPage() {
  const { t } = useTranslation()

  return (
    <section className="w-full space-y-6">
      <div className="quizy-card overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              <Sparkles className="size-4" />
              {t('dashboard.hero.badge')}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {t('dashboard.hero.title')}
              </h1>
              <p className="max-w-2xl text-base font-medium leading-8 text-muted-foreground">
                {t('dashboard.hero.description')}
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-xl shadow-primary/20">
            <p className="text-sm font-semibold opacity-85">{t('dashboard.hero.statusLabel')}</p>
            <p className="mt-2 text-2xl font-extrabold">{t('dashboard.hero.statusValue')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.key} className="quizy-card rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                  {item.trend}
                </span>
              </div>
              <p className="mt-5 text-3xl font-extrabold text-foreground">{item.value}</p>
              <p className="mt-1 text-sm font-bold text-muted-foreground">
                {t(`dashboard.stats.${item.key}`)}
              </p>
            </article>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="quizy-card rounded-[1.75rem] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-foreground">{t('dashboard.modules.title')}</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {t('dashboard.modules.description')}
              </p>
            </div>
            <Layers3 className="size-6 text-primary" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {modules.map((moduleKey) => (
              <div key={moduleKey} className="rounded-2xl border border-border bg-background/60 p-4">
                <p className="font-extrabold text-foreground">{t(`dashboard.modules.items.${moduleKey}.title`)}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t(`dashboard.modules.items.${moduleKey}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <aside className="quizy-card rounded-[1.75rem] p-5">
          <h2 className="text-xl font-extrabold text-foreground">{t('dashboard.dynamic.title')}</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('dashboard.dynamic.description')}</p>
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex gap-3 rounded-2xl bg-accent p-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-primary-foreground">
                  {step}
                </span>
                <p className="text-sm font-semibold leading-6 text-accent-foreground">
                  {t(`dashboard.dynamic.steps.${step}`)}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}
