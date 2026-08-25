import {
  useState } from 'react'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import { MapPin,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  pointsOfSaleService,
  type PointOfSale,
  type PointOfSaleInput,
  } from '@/modules/points-of-sale/points-of-sale.service'
import {
  Badge,
  Button,
  ConfirmDialog,
  FormField,
  Input,
  PaginatedDataTable,
  PageHeader,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui'

const PAGE_SIZE = 20
const EMPTY_FORM: PointOfSaleInput = { name: '', location: '' }
type PointOfSaleDialogMode = 'create' | 'edit'

export default function PointsOfSaleManagementPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<PointOfSaleDialogMode>('create')
  const [form, setForm] = useState<PointOfSaleInput>(EMPTY_FORM)
  const [editingPointOfSale, setEditingPointOfSale] = useState<PointOfSale | null>(null)

  const listQuery = useQuery({
    queryKey: ['points-of-sale', page, search],
    queryFn: () =>
      pointsOfSaleService.list({
        page,
        perPage: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['points-of-sale'] })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: PointOfSaleInput = {
        name: form.name.trim(),
        location: form.location.trim(),
      }

      if (dialogMode === 'create') return pointsOfSaleService.create(payload)
      if (!editingPointOfSale) throw new Error('Missing point of sale')
      return pointsOfSaleService.update(editingPointOfSale.id, payload)
    },
    onSuccess: async () => {
      setDialogOpen(false)
      setForm(EMPTY_FORM)
      setEditingPointOfSale(null)
      await invalidate()
    },
  })

  const removeMutation = useMutation({
    mutationFn: pointsOfSaleService.remove,
    onSuccess: invalidate,
  })

  const openCreateDialog = () => {
    saveMutation.reset()
    setDialogMode('create')
    setEditingPointOfSale(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEditDialog = (pointOfSale: PointOfSale) => {
    saveMutation.reset()
    setDialogMode('edit')
    setEditingPointOfSale(pointOfSale)
    setForm({ name: pointOfSale.name, location: pointOfSale.location ?? '' })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    if (saveMutation.isPending) return
    setDialogOpen(false)
    setForm(EMPTY_FORM)
    setEditingPointOfSale(null)
    saveMutation.reset()
  }

  const rows = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const canSave = Boolean(form.name.trim() && form.location.trim())

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<MapPin />}
        title={t('pointsOfSale.title')}
        description={t('pointsOfSale.description')}
        search={{
          value: search,
          placeholder: t('pointsOfSale.searchPlaceholder'),
          onChange: (value) => { setSearch(value); setPage(1) },
        }}
        actions={
          <>
            <Button variant="outline" icon={<RefreshCcw />} onClick={() => void listQuery.refetch()}>{t('common.refresh')}</Button>
            <Button icon={<Plus />} onClick={openCreateDialog}>{t('common.create')}</Button>
          </>
        }
      />

      <PaginatedDataTable<PointOfSale>
        className="min-h-0 flex-1"
        rows={rows}
        loading={listQuery.isLoading || listQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('pointsOfSale.summary', { count: totalCount })}
        emptyMessage={t('pointsOfSale.empty')}
        pagination={{
          currentPage: page,
          totalPages,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
          previousLabel: t('common.previous'),
          nextLabel: t('common.next'),
          getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }),
        }}
        columns={[
          {
            id: 'name',
            header: t('pointsOfSale.name'),
            renderCell: (row) => <span className="font-semibold">{row.name}</span>,
          },
          {
            id: 'location',
            header: t('pointsOfSale.location'),
            renderCell: (row) => row.location || '—',
          },
          {
            id: 'qrs',
            header: t('pointsOfSale.qrCount'),
            renderCell: (row) => (
              <Badge variant="outline" color="primary">
                {row.qrCodeCount ?? 0}
              </Badge>
            ),
          },
          {
            id: 'actions',
            header: '',
            renderCell: (row) => (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Pencil className="size-3.5" />}
                  onClick={() => openEditDialog(row)}
                >
                  {t('common.edit')}
                </Button>
                <ConfirmDialog
                  title={t('common.delete')}
                  confirmLabel={t('common.delete')}
                  confirmingLabel={t('common.delete')}
                  cancelLabel={t('common.cancel')}
                  onConfirm={async () => { await removeMutation.mutateAsync(row.id) }}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Trash2 className="size-3.5" />}
                      disabled={removeMutation.isPending}
                    >
                      {t('common.delete')}
                    </Button>
                  }
                />
              </div>
            ),
          },
        ]}
      />

      <Sheet
        open={dialogOpen}
        onOpenChange={(open) => {
          if (open) setDialogOpen(true)
          else closeDialog()
        }}
      >
        <SheetContent className="max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {dialogMode === 'create' ? (
                <Plus className="size-5 text-primary" />
              ) : (
                <Pencil className="size-5 text-primary" />
              )}
              {t(
                dialogMode === 'create'
                  ? 'pointsOfSale.createTitle'
                  : 'pointsOfSale.editTitle',
              )}
            </SheetTitle>
            <SheetDescription>
              {t(
                dialogMode === 'create'
                  ? 'pointsOfSale.createDescription'
                  : 'pointsOfSale.editDescription',
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={
                <>
                  {t('pointsOfSale.name')} <span className="text-destructive">*</span>
                </>
              }
            >
              <Input
                required
                autoFocus
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </FormField>
            <FormField
              label={
                <>
                  {t('pointsOfSale.location')} <span className="text-destructive">*</span>
                </>
              }
            >
              <Input
                required
                value={form.location}
                onChange={(event) =>
                  setForm((current) => ({ ...current, location: event.target.value }))
                }
              />
            </FormField>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={closeDialog}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              loading={saveMutation.isPending}
              disabled={!canSave}
              onClick={() => saveMutation.mutate()}
            >
              {t(dialogMode === 'create' ? 'common.create' : 'common.save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  )
}
