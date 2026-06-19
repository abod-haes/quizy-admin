import { useTranslation } from 'react-i18next'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { Button } from '@/shared/ui'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-lg rounded-md border border-border bg-card p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t('notFound.code')}</p>
        <h1 className="pt-2 font-[var(--font-sans)] text-3xl font-semibold tracking-tight text-foreground">
          {t('notFound.title')}
        </h1>
        <p className="pt-3 text-sm font-medium text-muted-foreground">{t('notFound.description')}</p>
        <Button
          href={APP_ROUTES.root.path}
          className="mt-6 h-10 rounded-md px-5 text-sm"
        >
          {t('notFound.goHome')}
        </Button>
      </section>
    </main>
  )
}

