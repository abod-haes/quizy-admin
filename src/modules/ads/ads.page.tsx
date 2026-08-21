import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageIcon, Megaphone, Pencil, Plus, RefreshCcw, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { adsService, type AdminAd, type AdInput } from '@/modules/ads/ads.service'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  CustomFileInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  PaginatedDataTable,
  Textarea,
} from '@/shared/ui'
import { generateFileUrl } from '@/shared/utils/file-url'

const PAGE_SIZE = 20
const EMPTY_FORM: AdInput = { title: '', description: '' }

function imageSource(ad: AdminAd) {
  const value = ad.image?.url ?? ad.image?.thumbnailUrl ?? ad.image?.filePath
  return value ? generateFileUrl(value) : null
}

export default function AdsManagementPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [form, setForm] = useState<AdInput>(EMPTY_FORM)
  const [createImage, setCreateImage] = useState<File | null>(null)
  const [editing, setEditing] = useState<AdminAd | null>(null)
  const [editImage, setEditImage] = useState<File | null>(null)

  const listQuery = useQuery({
    queryKey: ['admin-ads', page],
    queryFn: () => adsService.list(page, PAGE_SIZE),
  })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] })
  const createMutation = useMutation({
    mutationFn: () => adsService.create({ title: form.title.trim(), description: form.description?.trim() || null }, createImage),
    onSuccess: async () => {
      setForm(EMPTY_FORM)
      setCreateImage(null)
      setCreateDialogOpen(false)
      await invalidate()
    },
  })
  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('Missing ad')
      return adsService.update(
        editing,
        { title: editing.title.trim(), description: editing.description?.trim() || null },
        editImage,
      )
    },
    onSuccess: async () => {
      setEditing(null)
      setEditImage(null)
      await invalidate()
    },
  })
  const removeMutation = useMutation({ mutationFn: adsService.remove, onSuccess: invalidate })

  const resetCreate = () => {
    setForm(EMPTY_FORM)
    setCreateImage(null)
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

  const rows = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Megaphone className="size-6" /></div>
          <div><h1 className="text-2xl font-bold">{t('ads.title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('ads.description')}</p></div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void listQuery.refetch()}>{t('common.refresh')}</Button>
          <Button icon={<Plus className="size-4" />} onClick={openCreateDialog}>{t('ads.add')}</Button>
        </div>
      </div>

      {editing ? (
        <Card className="rounded-3xl border-primary/20">
          <CardHeader><CardTitle>{t('ads.editTitle')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField label={t('ads.titleField')}><Input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></FormField>
            <FormField label={t('ads.replaceImage')}>
              <CustomFileInput
                value={editImage?.name ?? ''}
                previewSrc={imageSource(editing) ?? undefined}
                uploadLabel={t('ads.replaceImage')}
                removeLabel={t('common.delete')}
                disabled={updateMutation.isPending}
                onFileSelect={setEditImage}
                onClear={() => setEditImage(null)}
              />
            </FormField>
            <FormField label={t('ads.descriptionField')}><Textarea value={editing.description ?? ''} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></FormField>
            <div className="flex justify-end gap-2"><Button variant="outline" icon={<X className="size-4" />} onClick={() => { setEditing(null); setEditImage(null) }}>{t('common.cancel')}</Button><Button loading={updateMutation.isPending} disabled={!editing.title.trim()} onClick={() => updateMutation.mutate()}>{t('common.save')}</Button></div>
          </CardContent>
        </Card>
      ) : null}

      <PaginatedDataTable<AdminAd>
        rows={rows}
        loading={listQuery.isLoading || listQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('ads.summary', { count: totalCount })}
        emptyMessage={t('ads.empty')}
        pagination={{ currentPage: page, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: t('common.previous'), nextLabel: t('common.next'), getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }) }}
        columns={[
          {
            id: 'image',
            header: t('ads.image'),
            renderCell: (row) => {
              const src = imageSource(row)
              return src ? <img src={src} alt="" className="h-12 w-20 rounded-xl border border-border object-cover" /> : <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground"><ImageIcon className="size-5" /></div>
            },
          },
          { id: 'title', header: t('ads.titleField'), renderCell: (row) => <span className="font-semibold">{row.title}</span> },
          { id: 'description', header: t('ads.descriptionField'), renderCell: (row) => <span className="line-clamp-2 max-w-md text-sm text-muted-foreground">{row.description || '—'}</span> },
          {
            id: 'actions',
            header: '',
            renderCell: (row) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" icon={<Pencil className="size-3.5" />} onClick={() => { setEditing({ ...row }); setEditImage(null) }}>{t('common.edit')}</Button>
                <ConfirmDialog
                  title={t('common.delete')}
                  confirmLabel={t('common.delete')}
                  confirmingLabel={t('common.delete')}
                  cancelLabel={t('common.cancel')}
                  onConfirm={() => removeMutation.mutateAsync(row)}
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="size-5 text-primary" />{t('ads.createTitle')}</DialogTitle>
            <DialogDescription>{t('ads.createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label={t('ads.titleField')}><Input autoFocus value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></FormField>
            <FormField label={t('ads.image')}>
              <CustomFileInput
                value={createImage?.name ?? ''}
                uploadLabel={t('ads.image')}
                removeLabel={t('common.delete')}
                disabled={createMutation.isPending}
                onFileSelect={setCreateImage}
                onClear={() => setCreateImage(null)}
              />
            </FormField>
            <FormField label={t('ads.descriptionField')}><Textarea value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={createMutation.isPending} onClick={closeCreateDialog}>{t('common.cancel')}</Button>
            <Button type="button" loading={createMutation.isPending} disabled={!form.title.trim()} onClick={() => createMutation.mutate()}>{t('ads.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
