import {
  useState } from 'react'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import { ImageIcon,
  Megaphone,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { adsService,
  type AdminAd,
  type AdInput } from '@/modules/ads/ads.service'
import type { PagedResponse } from '@/shared/api/api.types'
import {
  Button,
  ConfirmDialog,
  CustomFileInput,
  FormField,
  Input,
  PaginatedDataTable,
  PageHeader,
  Textarea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui'
import { generateFileUrl } from '@/shared/utils/file-url'

const PAGE_SIZE = 20
const EMPTY_FORM: AdInput = { title: '', description: '' }
type AdDialogMode = 'create' | 'edit'

function imageSource(ad: AdminAd) {
  const value = ad.image?.url ?? ad.image?.thumbnailUrl ?? ad.image?.filePath
  if (!value) return null

  const url = generateFileUrl(value)
  if (!ad.updatedAt) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${encodeURIComponent(ad.updatedAt)}`
}

function nullableText(value: string | null | undefined) {
  return value?.trim() || null
}

export default function AdsManagementPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<AdDialogMode>('create')
  const [form, setForm] = useState<AdInput>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [editingAd, setEditingAd] = useState<AdminAd | null>(null)

  const listQuery = useQuery({
    queryKey: ['admin-ads', page, search],
    queryFn: () => adsService.list(page, PAGE_SIZE, search),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: AdInput = {
        title: nullableText(form.title),
        description: nullableText(form.description),
      }

      if (dialogMode === 'create') {
        if (!imageFile) throw new Error('Ad image is required')
        return adsService.create(payload, imageFile)
      }

      if (!editingAd) throw new Error('Missing ad')
      if (!imageFile && !editingAd.imageId) throw new Error('Ad image is required')
      return adsService.update(editingAd, payload, imageFile)
    },
    onMutate: async () => {
      if (dialogMode === 'edit') {
        await queryClient.cancelQueries({ queryKey: ['admin-ads'] })
      }
    },
    onSuccess: async (savedAd) => {
      if (dialogMode === 'edit') {
        queryClient.setQueriesData<PagedResponse<AdminAd>>(
          { queryKey: ['admin-ads'] },
          (current) => {
            if (!current) return current
            return {
              ...current,
              items: current.items.map((item) =>
                item.id === savedAd.id ? { ...item, ...savedAd } : item,
              ),
            }
          },
        )
      } else {
        await invalidate()
      }

      setDialogOpen(false)
      setForm(EMPTY_FORM)
      setImageFile(null)
      setEditingAd(null)
    },
  })

  const removeMutation = useMutation({
    mutationFn: adsService.remove,
    onSuccess: invalidate,
  })

  const openCreateDialog = () => {
    saveMutation.reset()
    setDialogMode('create')
    setEditingAd(null)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setDialogOpen(true)
  }

  const openEditDialog = (ad: AdminAd) => {
    saveMutation.reset()
    setDialogMode('edit')
    setEditingAd(ad)
    setForm({ title: ad.title ?? '', description: ad.description ?? '' })
    setImageFile(null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    if (saveMutation.isPending) return
    setDialogOpen(false)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setEditingAd(null)
    saveMutation.reset()
  }

  const rows = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hasRequiredImage = Boolean(imageFile || editingAd?.imageId)

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<Megaphone />}
        title={t('ads.title')}
        description={t('ads.description')}
        search={{
          value: search,
          placeholder: t('common.search'),
          onChange: (value) => { setSearch(value); setPage(1) },
        }}
        actions={<><Button variant="outline" icon={<RefreshCcw />} onClick={() => void listQuery.refetch()}>{t('common.refresh')}</Button><Button icon={<Plus />} onClick={openCreateDialog}>{t('ads.add')}</Button></>}
      />

      <PaginatedDataTable<AdminAd>
        className="min-h-0 flex-1"
        rows={rows}
        loading={listQuery.isLoading || listQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('ads.summary', { count: totalCount })}
        emptyMessage={t('ads.empty')}
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
            id: 'image',
            header: t('ads.image'),
            renderCell: (row) => {
              const src = imageSource(row)
              return src ? (
                <img src={src} alt="" className="h-12 w-20 rounded-xl border border-border object-cover" />
              ) : (
                <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
                  <ImageIcon className="size-5" />
                </div>
              )
            },
          },
          {
            id: 'title',
            header: t('ads.titleField'),
            renderCell: (row) => <span className="font-semibold">{row.title || '—'}</span>,
          },
          {
            id: 'description',
            header: t('ads.descriptionField'),
            renderCell: (row) => (
              <span className="line-clamp-2 max-w-md text-sm text-muted-foreground">
                {row.description || '—'}
              </span>
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
                  onConfirm={() => removeMutation.mutateAsync(row)}
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
        <SheetContent className="max-w-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {dialogMode === 'create' ? (
                <Plus className="size-5 text-primary" />
              ) : (
                <Pencil className="size-5 text-primary" />
              )}
              {t(dialogMode === 'create' ? 'ads.createTitle' : 'ads.editTitle')}
            </SheetTitle>
            <SheetDescription>
              {t(dialogMode === 'create' ? 'ads.createDescription' : 'ads.editDescription')}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <FormField label={t('ads.titleField')}>
              <Input
                autoFocus
                value={form.title ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </FormField>

            <FormField
              label={
                <>
                  {t('ads.image')} <span className="text-destructive">*</span>
                </>
              }
            >
              <CustomFileInput
                accept="image/*"
                value={imageFile?.name ?? ''}
                previewSrc={
                  dialogMode === 'edit' && editingAd
                    ? imageSource(editingAd) ?? undefined
                    : undefined
                }
                uploadLabel={dialogMode === 'edit' ? t('ads.replaceImage') : t('ads.image')}
                removeLabel={t('common.delete')}
                disabled={saveMutation.isPending}
                onFileSelect={setImageFile}
                onClear={() => setImageFile(null)}
              />
            </FormField>

            <FormField label={t('ads.descriptionField')}>
              <Textarea
                value={form.description ?? ''}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
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
              disabled={!hasRequiredImage}
              onClick={() => saveMutation.mutate()}
            >
              {t(dialogMode === 'create' ? 'ads.add' : 'common.save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  )
}
