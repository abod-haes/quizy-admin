import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Pencil, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  pointsOfSaleService,
  type PointOfSale,
  type PointOfSaleInput,
} from '@/modules/points-of-sale/points-of-sale.service'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  PaginatedDataTable,
} from '@/shared/ui'

const PAGE_SIZE = 20
const EMPTY_FORM: PointOfSaleInput = { name: '', location: '' }

export default function PointsOfSaleManagementPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [form, setForm] = useState<PointOfSaleInput>(EMPTY_FORM)
  const [editing, setEditing] = useState<PointOfSale | null>(null)

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
  const createMutation = useMutation({
    mutationFn: pointsOfSaleService.create,
    onSuccess: async () => {
      setForm(EMPTY_FORM)
      setCreateDialogOpen(false)
      await invalidate()
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PointOfSaleInput }) =>
      pointsOfSaleService.update(id, payload),
    onSuccess: async () => {
      setEditing(null)
      await invalidate()
    },
  })
  const removeMutation = useMutation({
    mutationFn: pointsOfSaleService.remove,
    onSuccess: invalidate,
  })

  const rows = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const resetCreate = () => {
    setForm(EMPTY_FORM)
    createMutation.reset()
  }

  const openCreateDialog = () => {
    resetCreate()
    setCreateDialogOpen(true)
  }

  const closeCreateDialog = () => {
    if (createMutation.isPending) return
    setCreateDialogOpen(false)
    resetCreate()
  }

  const create = () => {
    if (!form.name.trim()) return
    createMutation.mutate({ name: form.name.trim(), location: form.location?.trim() || null })
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('pointsOfSale.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('pointsOfSale.description')}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void listQuery.refetch()}>
            {t('common.refresh')}
          </Button>
          <Button icon={<Plus className="size-4" />} onClick={openCreateDialog}>{t('common.create')}</Button>
        </div>
      </div>

      {editing ? (
        <Card className="rounded-3xl border-primary/20">
          <CardHeader><CardTitle>{t('pointsOfSale.editTitle')}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
            <FormField label={t('pointsOfSale.name')}><Input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></FormField>
            <FormField label={t('pointsOfSale.location')}><Input value={editing.location ?? ''} onChange={(event) => setEditing({ ...editing, location: event.target.value })} /></FormField>
            <div className="flex gap-2">
              <Button variant="outline" icon={<X className="size-4" />} onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
              <Button
                icon={<Save className="size-4" />}
                loading={updateMutation.isPending}
                disabled={!editing.name.trim()}
                onClick={() => updateMutation.mutate({ id: editing.id, payload: { name: editing.name.trim(), location: editing.location?.trim() || null } })}
              >
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Input
        value={search}
        placeholder={t('pointsOfSale.searchPlaceholder')}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
      />

      <PaginatedDataTable<PointOfSale>
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
          { id: 'name', header: t('pointsOfSale.name'), renderCell: (row) => <span className="font-semibold">{row.name}</span> },
          { id: 'location', header: t('pointsOfSale.location'), renderCell: (row) => row.location || '—' },
          { id: 'qrs', header: t('pointsOfSale.qrCount'), renderCell: (row) => <Badge variant="outline" color="primary">{row.qrCodeCount ?? 0}</Badge> },
          {
            id: 'actions',
            header: '',
            renderCell: (row) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" icon={<Pencil className="size-3.5" />} onClick={() => setEditing({ ...row })}>{t('common.edit')}</Button>
                <ConfirmDialog
                  title={t('common.delete')}
                  confirmLabel={t('common.delete')}
                  confirmingLabel={t('common.delete')}
                  cancelLabel={t('common.cancel')}
                  onConfirm={() => removeMutation.mutateAsync(row.id)}
                  trigger={
                    <Button size="sm" variant="outline" icon={<Trash2 className="size-3.5" />} disabled={removeMutation.isPending}>
                      {t('common.delete')}
                    </Button>
                  }
                />
              </div>
            ),
          },
        ]}
      />

      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (open) setCreateDialogOpen(true); else closeCreateDialog() }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" />{t('pointsOfSale.createTitle')}</DialogTitle>
            <DialogDescription>{t('pointsOfSale.createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('pointsOfSale.name')}>
              <Input autoFocus value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </FormField>
            <FormField label={t('pointsOfSale.location')}>
              <Input value={form.location ?? ''} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={createMutation.isPending} onClick={closeCreateDialog}>{t('common.cancel')}</Button>
            <Button type="button" loading={createMutation.isPending} disabled={!form.name.trim()} onClick={create}>{t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
