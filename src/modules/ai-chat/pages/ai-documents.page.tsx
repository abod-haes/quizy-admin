import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileUp, Loader2, RefreshCcw, RotateCcw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CustomFileInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PaginatedDataTable,
} from '@/shared/ui'

type AiDocumentRow = {
  id: string
  name: string
  status: string
  createdAt?: string | null
}

const PAGE_SIZE = 20

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function valueString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function normalizeDocuments(payload: unknown): AiDocumentRow[] {
  let source: unknown[] = []
  if (Array.isArray(payload)) source = payload
  const record = asRecord(payload)
  if (record) {
    for (const key of ['items', 'documents', 'data', 'results']) {
      if (Array.isArray(record[key])) {
        source = record[key] as unknown[]
        break
      }
    }
  }

  return source.flatMap((item, index) => {
    const row = asRecord(item)
    if (!row) return []
    const id = valueString(row, ['id', 'documentId', 'document_id', 'uuid'])
    if (!id) return []
    return [{
      id,
      name: valueString(row, ['name', 'fileName', 'filename', 'originalName', 'title']) || `#${index + 1}`,
      status: valueString(row, ['status', 'state', 'indexingStatus', 'index_status']) || 'unknown',
      createdAt: valueString(row, ['createdAt', 'created_at', 'uploadedAt', 'uploaded_at']) || null,
    }]
  })
}

function normalizeStatus(payload: unknown): string | null {
  const record = asRecord(payload)
  if (!record) return null
  return valueString(record, ['status', 'state', 'indexingStatus', 'index_status']) || null
}

export default function AiDocumentsPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AiDocumentRow | null>(null)
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})

  const documentsQuery = useQuery({
    queryKey: ['admin-ai', 'documents'],
    queryFn: () => api.get<unknown>(API_ENDPOINTS.ai.documents),
  })

  const documents = useMemo(() => normalizeDocuments(documentsQuery.data), [documentsQuery.data])
  const totalPages = Math.max(1, Math.ceil(documents.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const rows = documents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('missing-file')
      const formData = new FormData()
      formData.append('file', selectedFile)
      return api.upload<unknown>(API_ENDPOINTS.ai.documentUpload, formData, { params: { async: 'true' } })
    },
    onSuccess: async () => {
      toast.success(t('aiDocuments.uploaded'))
      setSelectedFile(null)
      setPage(1)
      await queryClient.invalidateQueries({ queryKey: ['admin-ai', 'documents'] })
    },
    onError: () => toast.error(t('aiDocuments.uploadError')),
  })

  const statusMutation = useMutation({
    mutationFn: (id: string) => api.get<unknown>(`${API_ENDPOINTS.ai.documents}/${encodeURIComponent(id)}/status`),
    onSuccess: (payload, id) => {
      const status = normalizeStatus(payload)
      if (status) setStatusOverrides((current) => ({ ...current, [id]: status }))
      toast.success(t('aiDocuments.statusUpdated'))
    },
    onError: () => toast.error(t('aiDocuments.statusError')),
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => api.post<unknown>(`${API_ENDPOINTS.ai.documents}/${encodeURIComponent(id)}/retry`),
    onSuccess: async (_, id) => {
      toast.success(t('aiDocuments.retryQueued'))
      setStatusOverrides((current) => ({ ...current, [id]: 'queued' }))
      await queryClient.invalidateQueries({ queryKey: ['admin-ai', 'documents'] })
    },
    onError: () => toast.error(t('aiDocuments.retryError')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${API_ENDPOINTS.ai.documents}/${encodeURIComponent(id)}`),
    onSuccess: async () => {
      toast.success(t('aiDocuments.deleted'))
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-ai', 'documents'] })
    },
    onError: () => toast.error(t('aiDocuments.deleteError')),
  })

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('aiDocuments.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('aiDocuments.description')}</p>
        </div>
        <Button variant="outline" disabled={documentsQuery.isFetching} onClick={() => void documentsQuery.refetch()}><RefreshCcw className="size-4" />{t('common.refresh')}</Button>
      </div>

      <Card className="rounded-3xl"><CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <CustomFileInput
          value={selectedFile?.name ?? ''}
          uploadLabel={t('aiDocuments.chooseFile')}
          removeLabel={t('common.delete')}
          hint={t('aiDocuments.uploadHint')}
          disabled={uploadMutation.isPending}
          onFileSelect={setSelectedFile}
          onClear={() => setSelectedFile(null)}
        />
        <Button disabled={!selectedFile || uploadMutation.isPending} onClick={() => uploadMutation.mutate()}>{uploadMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}{t('aiDocuments.upload')}</Button>
      </CardContent></Card>

      <Card className="rounded-3xl"><CardContent className="p-4">
        <PaginatedDataTable<AiDocumentRow>
          rows={rows}
          loading={documentsQuery.isLoading || documentsQuery.isFetching}
          getRowId={(row) => row.id}
          summaryText={t('aiDocuments.summary', { count: documents.length })}
          emptyMessage={documentsQuery.isError ? t('aiDocuments.serviceUnavailable') : t('aiDocuments.empty')}
          pagination={{ currentPage: safePage, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: t('common.previous'), nextLabel: t('common.next'), getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }) }}
          columns={[
            { id: 'name', header: t('aiDocuments.name'), renderCell: (row) => <span className="font-semibold">{row.name}</span> },
            { id: 'status', header: t('aiDocuments.status'), renderCell: (row) => <Badge variant="outline" color="primary">{statusOverrides[row.id] || row.status}</Badge> },
            { id: 'createdAt', header: t('aiDocuments.createdAt'), renderCell: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '-' },
            { id: 'actions', header: '', renderCell: (row) => <div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate(row.id)}><RefreshCcw className="size-4" />{t('aiDocuments.checkStatus')}</Button><Button size="sm" variant="outline" disabled={retryMutation.isPending} onClick={() => retryMutation.mutate(row.id)}><RotateCcw className="size-4" />{t('aiDocuments.retry')}</Button><Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTarget(row)}><Trash2 className="size-4" />{t('common.delete')}</Button></div> },
          ]}
        />
      </CardContent></Card>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('aiDocuments.deleteTitle')}</DialogTitle><DialogDescription>{deleteTarget ? t('aiDocuments.deleteConfirm', { name: deleteTarget.name }) : ''}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button><Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>{deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('common.delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
