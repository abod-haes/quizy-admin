import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'
import { usePagesById } from '@/modules/pages/hooks/use-pages-crud.hook'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'
import { formatTranslationForLocale } from '@/shared/lib/translation-display.helpers'
import { Button, Card, CardContent, DetailsField, PageHeader } from '@/shared/ui'

export default function PagesViewPage() {
  const { t, i18n } = useTranslation('pages')
  const entityPlural = t('entity.plural', { defaultValue: "Pages" })
  const { id } = useParams()
  const detailQuery = usePagesById(id ?? '', Boolean(id))

  const detail = (detailQuery.data ?? {}) as Record<string, unknown>

  const summaryEntries = useMemo(
    () =>
      Object.entries(detail).filter(([key]) =>
        !['translations', 'media', 'map_areas'].includes(key)
      ),
    [detail]
  )

  const translations = Array.isArray(detail.translations) ? detail.translations : []

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <PageHeader breadcrumbs={<AppBreadcrumbs />} title={t('view.title')} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-md border border-border bg-card lg:col-span-2">
          <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <DetailsField
              label={t('table.columns.translations', { defaultValue: 'Translations' })}
              value={formatTranslationForLocale(translations, i18n.language, ['title', 'name', 'label', 'question'])}
            />
            {summaryEntries.map(([key, value]) => (
              <DetailsField key={key} label={key} value={formatUiDisplayValue(value)} />
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border bg-card">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-foreground">
              {t('table.columns.translations', { defaultValue: 'Translations' })}
            </p>
            {translations.length ? (
              translations.map((entry, index) => {
                const item = entry && typeof entry === 'object'
                  ? (entry as Record<string, unknown>)
                  : {}
                const lang = String(item.lang ?? '-').toUpperCase()
                const title = String(item.title ?? item.name ?? item.label ?? item.question ?? '-').trim() || '-'
                const description = String(item.description ?? item.subtitle ?? item.answer ?? item.short_description ?? '-').trim() || '-'

                return (
                  <div key={String(item.lang ?? index) + '-' + String(index)} className="rounded-md border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">{lang}</p>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link to={APP_ROUTES.pages.path}>{t('common.actions.back', { ns: 'translation' })} {entityPlural}</Link>
        </Button>
      </div>
    </section>
  )
}
