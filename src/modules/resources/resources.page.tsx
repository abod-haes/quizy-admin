import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileUp, HardDrive, RefreshCcw, Trash2 } from 'lucide-react'

import {
  resourcesService,
  type AdminResource,
} from '@/modules/resources/resources.service'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CustomSelect,
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
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [page, setPage] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')

  const listQuery = useQuery({
    queryKey: ['admin-resources', page],
    queryFn: () => resourcesService.list(page, PAGE_SIZE),
  })
  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Missing file')
      return resourcesService.upload(file, visibility)
    },
    onSuccess: async () => {
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
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

  const rows = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <section className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><HardDrive className="size-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">مكتبة الملفات</h1>
            <p className="mt-1 text-sm text-muted-foreground">رفع وإدارة الملفات العامة والخاصة من نظام Resources الموحد.</p>
          </div>
        </div>
        <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void listQuery.refetch()}>تحديث</Button>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileUp className="size-5" />رفع ملف</CardTitle>
          <CardDescription>الملفات الخاصة لا تُعرض عبر `/uploads` العام، ويتم تنزيلها من endpoint محمي.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_12rem_auto] md:items-end">
          <FormField label="الملف">
            <input
              ref={fileInputRef}
              type="file"
              className="block h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </FormField>
          <FormField label="الظهور">
            <CustomSelect
              value={visibility}
              options={[
                { value: 'PUBLIC', label: 'عام' },
                { value: 'PRIVATE', label: 'خاص' },
              ]}
              onValueChange={(value) => setVisibility(value as 'PUBLIC' | 'PRIVATE')}
            />
          </FormField>
          <Button
            loading={uploadMutation.isPending}
            disabled={!file}
            icon={<FileUp className="size-4" />}
            onClick={() => uploadMutation.mutate()}
          >
            رفع
          </Button>
        </CardContent>
      </Card>

      <PaginatedDataTable<AdminResource>
        rows={rows}
        loading={listQuery.isLoading || listQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={`${totalCount} ملف`}
        emptyMessage="لا توجد ملفات بعد."
        pagination={{
          currentPage: page,
          totalPages,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
          previousLabel: 'السابق',
          nextLabel: 'التالي',
          getPageLabel: (pageNumber) => `صفحة ${pageNumber}`,
        }}
        columns={[
          {
            id: 'name',
            header: 'الملف',
            renderCell: (row) => (
              <div className="min-w-0">
                <p className="max-w-xs truncate font-semibold">{row.originalName || row.id}</p>
                <p className="text-xs text-muted-foreground">{row.mimeType || row.kind || 'FILE'}</p>
              </div>
            ),
          },
          { id: 'size', header: 'الحجم', renderCell: (row) => humanSize(row.sizeBytes) },
          {
            id: 'visibility',
            header: 'الظهور',
            renderCell: (row) => (
              <Badge variant="outline" color={row.visibility === 'PRIVATE' ? 'amber' : 'emerald'}>
                {row.visibility === 'PRIVATE' ? 'خاص' : 'عام'}
              </Badge>
            ),
          },
          { id: 'role', header: 'الاستخدام', renderCell: (row) => row.role || 'ATTACHMENT' },
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
                  تنزيل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Trash2 className="size-3.5" />}
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(row.id)}
                >
                  حذف
                </Button>
              </div>
            ),
          },
        ]}
      />
    </section>
  )
}
