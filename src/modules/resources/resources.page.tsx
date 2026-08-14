import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileUp, HardDrive, RefreshCcw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  resourcesService,
  type AdminResource,
  type AdminResourceVisibility,
} from '@/modules/resources/resources.service'
import {
  Badge,
  Button,
  CustomFileInput,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  PaginatedDataTable,
} from '@/shared/ui'

const PAGE_SIZE = 20

function humanSize(bytes: number | null | undefined) {
  const value = Number(bytes ?? 0)
  if (!value) return '—'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export default function ResourcesManagementPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [visibility, setVisibility] = useState<AdminResourceVisibility>('PUBLIC')

  const listQuery = useQuery({
    queryKey: ['admin-resources', page],
    queryFn: () => resourcesService.list(page, PAGE_SIZE),
  })
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error(t('resources.missingFile'))
      return resourcesService.upload(file, visibility)
    },
    onSuccess: async () => {
      setFile(null)
      setVisibility('PUBLIC')
      setUploadDialogOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['admin-resources'] })
    },
  })
  const removeMutation = useMutation({
    mutationFn: resourcesService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-resources'] }),
  })
  const downloadMutation = useMutation({
    mutationFn: async (resource: AdminResource) => {
      const blob = await resourcesService.download(resource.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = resource.originalName || `quizy-resource-${resource.id}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    },
  })

  const resetUpload = () => {
    setFile(null)
    setVisibility('PUBLIC')
    uploadMutation.reset()
  }

  const openUploadDialog = () => {
    resetUpload()
    setUploadDialogOpen(true)
  }

  const closeUploadDialog = () => {
    if (uploadMutation.isPending) return
    setUploadDialogOpen(false)
    resetUpload()
  }

  const rows = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><HardDrive className="size-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">{t('resources.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('resources.description')}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void listQuery.refetch()}>{t('common.refresh')}</Button>
          <Button icon={<FileUp className="size-4" />} onClick={openUploadDialog}>{t('resources.upload')}</Button>
        </div>
      </div>

      <PaginatedDataTable<AdminResource>
        rows={rows}
        loading={listQuery.isLoading || listQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('resources.summary', { count: totalCount })}
        emptyMessage={t('resources.empty')}
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
            header: t('resources.file'),
            renderCell: (row) => (
              <div className="min-w-0">
                <p className="max-w-xs truncate font-semibold">{row.originalName || row.id}</p>
                <p className="text-xs text-muted-foreground">{row.mimeType || row.kind || 'FILE'}</p>
              </div>
            ),
          },
          { id: 'size', header: t('resources.size'), renderCell: (row) => humanSize(row.sizeBytes) },
          {
            id: 'visibility',
            header: t('resources.visibility'),
            renderCell: (row) => (
              <Badge variant="outline" color={row.visibility === 'PRIVATE' ? 'amber' : 'emerald'}>
                {row.visibility === 'PRIVATE' ? t('common.private') : t('common.public')}
              </Badge>
            ),
          },
          { id: 'role', header: t('resources.usage'), renderCell: (row) => row.role || 'ATTACHMENT' },
          {
            id: 'actions',
            header: '',
            renderCell: (row) => (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download className="size-3.5" />}
                  disabled={downloadMutation.isPending}
                  onClick={() => downloadMutation.mutate(row)}
                >
                  {t('common.download')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Trash2 className="size-3.5" />}
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(row.id)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { if (open) setUploadDialogOpen(true); else closeUploadDialog() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileUp className="size-5 text-primary" />{t('resources.uploadTitle')}</DialogTitle>
            <DialogDescription>{t('resources.uploadDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label={t('resources.file')}>
              <CustomFileInput
                accept="*/*"
                value={file?.name ?? ''}
                uploadLabel={t('resources.file')}
                removeLabel={t('common.delete')}
                disabled={uploadMutation.isPending}
                onFileSelect={setFile}
                onClear={() => setFile(null)}
              />
            </FormField>
            <FormField label={t('resources.visibility')}>
              <CustomSelect
                value={visibility}
                options={[
                  { value: 'PUBLIC', label: t('common.public') },
                  { value: 'PRIVATE', label: t('common.private') },
                ]}
                disabled={uploadMutation.isPending}
                onValueChange={(value) => setVisibility(value as AdminResourceVisibility)}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={uploadMutation.isPending} onClick={closeUploadDialog}>{t('common.cancel')}</Button>
            <Button type="button" loading={uploadMutation.isPending} disabled={!file} icon={<FileUp className="size-4" />} onClick={() => uploadMutation.mutate()}>{t('resources.upload')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
