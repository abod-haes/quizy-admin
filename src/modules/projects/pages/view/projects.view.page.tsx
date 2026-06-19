import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'
import { useProjectsById } from '@/modules/projects/hooks/use-projects-crud.hook'
import { toDateLabel } from '@/shared/lib/data-value.helpers'
import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'
import { formatTranslationForLocale } from '@/shared/lib/translation-display.helpers'
import { Badge, Button, Card, CardContent, DetailsField, PageHeader, Skeleton } from '@/shared/ui'

export default function ProjectsViewPage() {
  const { t, i18n } = useTranslation('projects')
  const entityPlural = t('entity.plural', { defaultValue: 'Projects' })
  const { id } = useParams()
  const detailQuery = useProjectsById(id ?? '', Boolean(id))
  const project = detailQuery.data

  if (detailQuery.isLoading) {
    return (
      <section className="space-y-6 w-full">
        <PageHeader breadcrumbs={<AppBreadcrumbs />} title={t('view.title')} />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="rounded-md border border-border bg-card lg:col-span-2">
            <CardContent className="space-y-4 p-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card className="rounded-md border border-border bg-card">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 w-full">
      <PageHeader breadcrumbs={<AppBreadcrumbs />} title={t('view.title')} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-md border border-border bg-card lg:col-span-2">
          <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <DetailsField label={t('table.columns.translations')} value={formatTranslationForLocale(project?.translations, i18n.language, ['title', 'short_description', 'location_name'])} />
            <DetailsField
              label={t('table.columns.status')}
              value={t(`table.values.status.${String(project?.status ?? '').toLowerCase()}`, {
                defaultValue: formatUiDisplayValue(project?.status_label ?? project?.status),
              })}
            />
            <DetailsField label={t('table.columns.lat', { defaultValue: 'Latitude' })} value={formatUiDisplayValue(project?.lat)} />
            <DetailsField label={t('table.columns.lng', { defaultValue: 'Longitude' })} value={formatUiDisplayValue(project?.lng)} />
            <DetailsField
              label={t('table.columns.isFeatured')}
              value={
                <Badge variant="outline" color={project?.is_featured ? 'blue' : 'slate'}>
                  {project?.is_featured
                    ? t('table.values.featured', { defaultValue: 'Featured' })
                    : t('table.values.notFeatured', { defaultValue: 'Not Featured' })}
                </Badge>
              }
            />
            <DetailsField
              label={t('table.columns.isActive')}
              value={
                <Badge variant="outline" color={project?.is_active ? 'emerald' : 'rose'}>
                  {project?.is_active
                    ? t('table.values.active', { defaultValue: 'Active' })
                    : t('table.values.inactive', { defaultValue: 'Inactive' })}
                </Badge>
              }
            />
            <DetailsField label={t('table.columns.createdAt')} value={toDateLabel(project?.created_at, { locale: i18n.language })} />
            <DetailsField label={t('table.columns.updatedAt')} value={toDateLabel(project?.updated_at, { locale: i18n.language })} />
          </CardContent>
        </Card>

        <Card className="rounded-md border border-border bg-card">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-foreground">{t('table.columns.translations')}</p>
            {(project?.translations ?? []).map((entry) => (
              <div key={`${entry.lang}-${entry.title}`} className="rounded-md border border-border/70 bg-muted/20 p-3">
                <p className="text-xs font-semibold text-muted-foreground">{entry.lang.toUpperCase()}</p>
                <p className="text-sm font-medium text-foreground">{entry.title || '-'}</p>
                <p className="text-xs text-muted-foreground">{entry.short_description || '-'}</p>
                <p className="text-xs text-muted-foreground">{entry.location_name || '-'}</p>
              </div>
            ))}
            {(project?.media ?? []).length ? (
              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold text-foreground">{t('table.columns.media')}</p>
                <div className="grid grid-cols-1 gap-3">
                  {(project?.media ?? []).map((item) => (
                    <img key={item.id} src={item.thumb_url || item.url} alt={item.name || item.file_name} className="h-40 w-full rounded-md border border-border/70 object-cover" />
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="outline" className="min-w-36 rounded-md border-border/80 bg-background/70 px-5 font-medium transition-colors hover:bg-accent/60">
          <Link to={APP_ROUTES.projects.path}>{t('common.actions.back', { ns: 'translation' })} {entityPlural}</Link>
        </Button>
      </div>
    </section>
  )
}

