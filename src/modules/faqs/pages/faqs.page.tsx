import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'
import { FaqsTable, FaqsTableColumns } from '@/modules/faqs/components/faqs.table.component'
import { useFaqsList, useFaqsCrudMutations } from '@/modules/faqs/hooks/use-faqs-crud.hook'
import type { FaqsEntity } from '@/modules/faqs/types/faqs.type'
import { useCrudTableSettings } from '@/shared/lib/use-crud-table-settings'
import { Button, ColumnsVisibilityMenu, FiltersDialog, Input, PageHeader } from '@/shared/ui'

const defaultSearchValues: Record<string, string> = {
  "section_id": '',
  "sort_order": '',
  "is_active": '',
  "translations": '',
  "created_at": '',
  "updated_at": '',
}

export default function FaqsPage() {
  const { t } = useTranslation('faqs')
  const navigate = useNavigate()
  const entityPlural = t('entity.plural', { defaultValue: "Faqs" })
  const entitySingular = t('entity.singular', { defaultValue: "Faq" })
  const { removeMutation } = useFaqsCrudMutations()

  const defaultColumns = useMemo(
    () =>
      FaqsTableColumns.map((column) => ({
        id: column.key,
        label: t(column.labelKey),
        visible: true,
      })),
    [t]
  )

  const tableSettings = useCrudTableSettings({
    pageKey: 'faqs-table',
    defaultColumns,
    defaultSearchValues,
    defaultPagination: { pageIndex: 1, pageSize: 10 },
  })

  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(() => tableSettings.searchValues)
  const [pendingFilters, setPendingFilters] = useState<Record<string, string>>(() => tableSettings.searchValues)
  const listQuery = useFaqsList(appliedFilters, {
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
        {FaqsTableColumns.map((column) => (
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
        onClick={() => navigate(APP_ROUTES.addFaqs.path)}
      >
        {t('common.actions.add', { ns: 'translation' })} {entitySingular}
      </Button>
    </div>
  )

  return (
    <section className="space-y-6 w-full flex flex-col">
      <PageHeader
        breadcrumbs={<AppBreadcrumbs />}
        title={entityPlural}
        description={t('page.description')}
        actions={headerActions}
      />

      <FaqsTable
        rows={(listQuery.data?.items ?? []) as FaqsEntity[]}
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
        onView={(row) => navigate(APP_ROUTES.viewFaqs.path.replace(':id', String((row as Record<string, unknown>).id ?? row.id ?? '')))}
        onEdit={(row) => navigate(APP_ROUTES.editFaqs.path.replace(':id', String((row as Record<string, unknown>).id ?? row.id ?? '')))}
        onDelete={(row) => removeMutation.mutate(String((row as Record<string, unknown>).id ?? row.id ?? ''))}
      />
    </section>
  )
}
