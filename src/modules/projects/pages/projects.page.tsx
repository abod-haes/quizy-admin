import { ArrowDownUp, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/shared/lib/toast'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'
import { ProjectsTable } from '@/modules/projects/components/projects.table.component'
import { ProjectsTableColumns } from '@/modules/projects/components/projects.table-columns'
import { useProjectsList, useProjectsCrudMutations } from '@/modules/projects/hooks/use-projects-crud.hook'
import type { ProjectsEntity } from '@/modules/projects/types/projects.type'
import { useReorderableList } from '@/shared/lib/use-reorderable-list'
import { useCrudTableSettings } from '@/shared/lib/use-crud-table-settings'
import { Button, ColumnsVisibilityMenu, PageHeader } from '@/shared/ui'

export default function ProjectsPage() {
  const { t } = useTranslation('projects')
  const navigate = useNavigate()
  const entityPlural = t('entity.plural', { defaultValue: "Projects" })
  const entitySingular = t('entity.singular', { defaultValue: "Project" })
  const { removeMutation, reorderMutation } = useProjectsCrudMutations()

  const defaultColumns = useMemo(
    () =>
      ProjectsTableColumns.map((column) => ({
        id: column.key,
        label: t(column.labelKey),
        visible: true,
      })),
    [t]
  )

  const tableSettings = useCrudTableSettings({
    pageKey: 'projects-table',
    defaultColumns,
    defaultSearchValues: {},
    defaultPagination: { pageIndex: 1, pageSize: 10 },
  })
  const [appliedFilters] = useState<Record<string, string>>(() => tableSettings.searchValues)
  const listQuery = useProjectsList(appliedFilters, {
    page: tableSettings.pagination.pageIndex,
    perPage: tableSettings.pagination.pageSize,
    sort: tableSettings.pagination.sort,
  })
  useEffect(() => {
    const serverPage = listQuery.data?.currentPage
    const serverPerPage = listQuery.data?.perPage
    if (!serverPage || !serverPerPage) return

    if (
      serverPage !== tableSettings.pagination.pageIndex ||
      serverPerPage !== tableSettings.pagination.pageSize
    ) {
      tableSettings.setPagination({
        ...tableSettings.pagination,
        pageIndex: serverPage,
        pageSize: serverPerPage,
      })
    }
  }, [listQuery.data?.currentPage, listQuery.data?.perPage, tableSettings])
  const sourceRows = useMemo(
    () => [...((listQuery.data?.items ?? []) as ProjectsEntity[])].sort((a, b) => a.sort_order - b.sort_order),
    [listQuery.data]
  )
  const { isOrderingMode, isOrderingLoading, displayedRows, setOrderedRows, handleOrderingClick } = useReorderableList<ProjectsEntity>({
    rows: sourceRows,
    pageOrderStart:
      (Math.max(1, listQuery.data?.currentPage ?? tableSettings.pagination.pageIndex) - 1) *
        Math.max(1, listQuery.data?.perPage ?? tableSettings.pagination.pageSize) +
      1,
    onSave: (items) => reorderMutation.mutateAsync(items),
    onAfterSave: async () => {
      await listQuery.refetch()
    },
    onEnterOrderingMode: () =>
      toast.info(t('page.orderingTitle', { defaultValue: 'Display Ordering' }), {
        description: t('page.orderingDescription', {
          defaultValue: 'Drag rows using the grip handle, then click Save ordering when you finish.',
        }),
      }),
  })

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
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
        variant={isOrderingMode ? 'default' : 'outline'}
        icon={<ArrowDownUp className="size-4" />}
        loading={isOrderingLoading}
        onClick={() => void handleOrderingClick()}
      >
        {isOrderingMode
          ? t('common.actions.saveOrdering', { ns: 'translation' })
          : t('common.actions.displayOrdering', { ns: 'translation' })}
      </Button>

      <Button
        type="button"
        icon={<Plus className="size-4" />}
        onClick={() => navigate(APP_ROUTES.addProjects.path)}
      >
        {t('common.actions.add', { ns: 'translation' })} {entitySingular}
      </Button>
    </div>
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden">
      <PageHeader
        breadcrumbs={<AppBreadcrumbs />}
        title={entityPlural}
        description={t('page.description')}
        actions={headerActions}
      />

      <ProjectsTable
        rows={displayedRows}
        visibleColumnKeys={tableSettings.visibleColumnKeys}
        searchValues={{}}
        page={tableSettings.pagination.pageIndex}
        pageSize={tableSettings.pagination.pageSize}
        sort={tableSettings.pagination.sort}
        onSortChange={(nextSort) =>
          tableSettings.setPagination({
            ...tableSettings.pagination,
            sort: nextSort,
            pageIndex: 1,
          })
        }
        totalItems={listQuery.data?.total}
        totalPages={listQuery.data?.lastPage}
        isLoading={listQuery.isLoading}
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
        isOrderingEnabled={isOrderingMode}
        onReorderRows={setOrderedRows}
        onView={(row) => navigate(APP_ROUTES.viewProjects.path.replace(':id', String((row as Record<string, unknown>).id ?? row.id ?? '')))}
        onEdit={(row) => navigate(APP_ROUTES.editProjects.path.replace(':id', String((row as Record<string, unknown>).id ?? row.id ?? '')))}
        onDelete={(row) => removeMutation.mutateAsync(String((row as Record<string, unknown>).id ?? row.id ?? ''))}
      />
    </section>
  )
}


