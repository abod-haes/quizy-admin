import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'
import { PagesTable, PagesTableColumns } from '@/modules/pages/components/pages.table.component'
import { usePagesList, usePagesCrudMutations } from '@/modules/pages/hooks/use-pages-crud.hook'
import type { PagesEntity } from '@/modules/pages/types/pages.type'
import { useCrudTableSettings } from '@/shared/lib/use-crud-table-settings'
import { Button, ColumnsVisibilityMenu, FiltersDialog, Input, PageHeader } from '@/shared/ui'

const defaultSearchValues: Record<string, string> = {
  "slug": '',
  "is_published": '',
  "created_by": '',
  "updated_by": '',
  "translations": '',
  "created_at": '',
  "updated_at": '',
}

export default function PagesPage() {
  const { t } = useTranslation('pages')
  const navigate = useNavigate()
  const entityPlural = t('entity.plural', { defaultValue: "Pages" })
  const entitySingular = t('entity.singular', { defaultValue: "Page" })
  const { removeMutation } = usePagesCrudMutations()

  const defaultColumns = useMemo(
    () =>
      PagesTableColumns.map((column) => ({
        id: column.key,
        label: t(column.labelKey),
        visible: true,
      })),
    [t]
  )

  const tableSettings = useCrudTableSettings({
    pageKey: 'pages-table',
    defaultColumns,
    defaultSearchValues,
    defaultPagination: { pageIndex: 1, pageSize: 10 },
  })

  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(() => tableSettings.searchValues)
  const [pendingFilters, setPendingFilters] = useState<Record<string, string>>(() => tableSettings.searchValues)
  const listQuery = usePagesList(appliedFilters, {
    page: tableSettings.pagination.pageIndex,
    perPage: tableSettings.pagination.pageSize,
  })

  const activeFiltersCount = useMemo(
    () => Object.values(pendingFilters).filter((value) => String(value).trim().length > 0).length,
    [pendingFilters]
  )

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <FiltersDialog
        triggerLabel={t('common.filters.title', { ns: 'translation' })}
        title={t('common.filters.title', { ns: 'translation' })}
        activeFiltersCount={activeFiltersCount}
        applyLabel={t('common.actions.apply', { ns: 'translation' })}
        resetLabel={t('common.actions.reset', { ns: 'translation' })}
        onApply={() => {
          const nextFilters = { ...pendingFilters }
          setAppliedFilters(nextFilters)
          tableSettings.setSearchValues(nextFilters)
        }}
        onReset={() => {
          setPendingFilters(defaultSearchValues)
          setAppliedFilters(defaultSearchValues)
          tableSettings.reset()
        }}
        triggerVariant="filter"
      >
        {PagesTableColumns.map((column) => (
          <div key={column.key} className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{t(column.labelKey)}</p>
            <Input
              value={pendingFilters[column.key] ?? ''}
              onChange={(event) => setPendingFilters((previous) => ({ ...previous, [column.key]: event.target.value }))}
              variant="filter"
            />
          </div>
        ))}
      </FiltersDialog>

      <ColumnsVisibilityMenu
        columns={tableSettings.columns}
        onChange={tableSettings.setColumns}
        onReset={tableSettings.reset}
        triggerLabel={t('common.table.columns', { ns: 'translation' })}
        title={t('common.table.columns', { ns: 'translation' })}
        applyLabel={t('common.actions.apply', { ns: 'translation' })}
        resetLabel={t('common.actions.reset', { ns: 'translation' })}
      />

      <Button
        type="button"
        icon={<Plus className="size-4" />}
        onClick={() => navigate(APP_ROUTES.addPages.path)}
      >
        {t('common.actions.add', { ns: 'translation' })} {entitySingular}
      </Button>
    </div>
  )

  return (
    <section className="space-y-6 w-full">
      <PageHeader
        breadcrumbs={<AppBreadcrumbs />}
        title={entityPlural}
        description={t('page.description')}
        actions={headerActions}
      />

      <PagesTable
        rows={(listQuery.data?.items ?? []) as PagesEntity[]}
        visibleColumnKeys={tableSettings.visibleColumnKeys}
        searchValues={tableSettings.searchValues}
        page={tableSettings.pagination.pageIndex}
        pageSize={tableSettings.pagination.pageSize}
        totalItems={listQuery.data?.total}
        totalPages={listQuery.data?.lastPage}
        onPageChange={(page) =>
          tableSettings.setPagination({
            ...tableSettings.pagination,
            pageIndex: page,
          })
        }
        onPageSizeChange={(pageSize) =>
          tableSettings.setPagination({
            ...tableSettings.pagination,
            pageSize,
            pageIndex: 1,
          })
        }
        canView={true}
        canEdit={true}
        canDelete={true}
        onView={(row) => navigate(APP_ROUTES.viewPages.path.replace(':id', String((row as Record<string, unknown>).id ?? row.id ?? '')))}
        onEdit={(row) => navigate(APP_ROUTES.editPages.path.replace(':id', String((row as Record<string, unknown>).id ?? row.id ?? '')))}
        onDelete={(row) => removeMutation.mutate(String((row as Record<string, unknown>).id ?? row.id ?? ''))}
      />
    </section>
  )
}
