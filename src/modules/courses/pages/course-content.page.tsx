import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, ExternalLink, FileVideo, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/shared/api/api-client'
import type { PagedResponse, UUID } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Textarea,
} from '@/shared/ui'

type NamedItem = { id: UUID; title?: string | null; name?: string | null }
type UploadedResource = string | { id?: UUID; entityId?: UUID | null; filePath?: string | null; isImage?: boolean }
type Material = { id: UUID; title?: string | null; description?: string | null; materialType?: number | null; resourceId?: UUID | null; order?: number | null }
type TextRecord = { id: UUID; content?: string | null; authorRole?: string | null }
type TabKey = 'materials' | 'comments' | 'notes'
type DialogKind = 'material' | 'comment' | 'note'

type MaterialForm = {
  courseId: string
  sessionId: string
  title: string
  description: string
  materialType: string
  file: File | null
  order: number
}

type TextForm = {
  courseId: string
  sessionId: string
  content: string
}

type DialogState = {
  open: boolean
  kind: DialogKind
  item: Material | TextRecord | null
  material: MaterialForm
  text: TextForm
}

const PAGE_SIZE = 1000

const createEmptyMaterial = (courseId = '', sessionId = ''): MaterialForm => ({
  courseId,
  sessionId,
  title: '',
  description: '',
  materialType: '1',
  file: null,
  order: 0,
})

const createEmptyText = (courseId = '', sessionId = ''): TextForm => ({ courseId, sessionId, content: '' })

function labelOf(item: NamedItem) {
  return item.title?.trim() || item.name?.trim() || '-'
}

function extractResourceId(response: UploadedResource): string | null {
  if (typeof response === 'string' && response.trim()) return response
  if (response && typeof response === 'object' && typeof response.id === 'string' && response.id.trim()) return response.id
  return null
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'تعذر تنفيذ الطلب'
}

function getBlobName(material: Material) {
  const safeTitle = material.title?.trim() || 'course-material'
  return safeTitle.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function CourseContentPage() {
  const queryClient = useQueryClient()
  const [courseId, setCourseId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [tab, setTab] = useState<TabKey>('materials')
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    kind: 'material',
    item: null,
    material: createEmptyMaterial(),
    text: createEmptyText(),
  })

  const dialogCourseId = dialog.kind === 'material' ? dialog.material.courseId : dialog.text.courseId

  const coursesQuery = useQuery({
    queryKey: ['course-content', 'courses'],
    queryFn: () => api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.courses.list, { params: { Page: 1, PerPage: PAGE_SIZE } }),
  })

  const sessionsQuery = useQuery({
    queryKey: ['course-content', 'sessions', courseId],
    queryFn: () => api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.courses.sessions(courseId), { params: { Page: 1, PerPage: PAGE_SIZE } }),
    enabled: Boolean(courseId),
  })

  const dialogSessionsQuery = useQuery({
    queryKey: ['course-content', 'dialog-sessions', dialogCourseId],
    queryFn: () => api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.courses.sessions(dialogCourseId), { params: { Page: 1, PerPage: PAGE_SIZE } }),
    enabled: Boolean(dialog.open && dialogCourseId),
  })

  const materialsQuery = useQuery({
    queryKey: ['course-content', 'materials', sessionId],
    queryFn: () => api.get<PagedResponse<Material>>(API_ENDPOINTS.courseSessions.materials(sessionId), { params: { Page: 1, PerPage: PAGE_SIZE } }),
    enabled: Boolean(sessionId),
  })

  const commentsQuery = useQuery({
    queryKey: ['course-content', 'comments', sessionId],
    queryFn: () => api.get<PagedResponse<TextRecord>>(API_ENDPOINTS.courseSessions.comments(sessionId), { params: { Page: 1, PerPage: PAGE_SIZE } }),
    enabled: Boolean(sessionId),
  })

  const notesQuery = useQuery({
    queryKey: ['course-content', 'notes', sessionId],
    queryFn: () => api.get<PagedResponse<TextRecord>>(API_ENDPOINTS.courseSessions.notes(sessionId), { params: { Page: 1, PerPage: PAGE_SIZE } }),
    enabled: Boolean(sessionId),
  })

  const courseOptions = useMemo(() => (coursesQuery.data?.items ?? []).map((item) => ({ value: item.id, label: labelOf(item) })), [coursesQuery.data?.items])
  const sessionOptions = useMemo(() => (sessionsQuery.data?.items ?? []).map((item) => ({ value: item.id, label: labelOf(item) })), [sessionsQuery.data?.items])
  const dialogSessionOptions = useMemo(() => (dialogSessionsQuery.data?.items ?? []).map((item) => ({ value: item.id, label: labelOf(item) })), [dialogSessionsQuery.data?.items])

  const invalidateCurrent = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-content', 'materials', sessionId] })
    await queryClient.invalidateQueries({ queryKey: ['course-content', 'comments', sessionId] })
    await queryClient.invalidateQueries({ queryKey: ['course-content', 'notes', sessionId] })
  }

  const uploadResource = async (material: MaterialForm) => {
    if (!material.file) throw new Error('اختر ملفًا أو فيديو من الفورم')

    const formData = new FormData()
    formData.append('file', material.file)
    formData.append('entityId', material.courseId)
    formData.append('isImage', String(material.file.type.startsWith('image/')))

    const resource = await api.upload<UploadedResource>(API_ENDPOINTS.resources.upload, formData)
    const resourceId = extractResourceId(resource)
    if (!resourceId) throw new Error('تم رفع الملف لكن لم يرجع resourceId من السيرفر')
    return resourceId
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (dialog.kind === 'material') {
        const targetSessionId = dialog.material.sessionId
        if (!dialog.material.courseId) throw new Error('اختر الكورس داخل الفورم')
        if (!targetSessionId) throw new Error('اختر الجلسة داخل الفورم')
        if (!dialog.material.title.trim()) throw new Error('اكتب عنوان المادة')

        const resourceId = await uploadResource(dialog.material)
        const body = {
          title: dialog.material.title.trim(),
          description: dialog.material.description.trim(),
          materialType: Number(dialog.material.materialType),
          resourceId,
          order: Number(dialog.material.order) || 0,
        }

        if (dialog.item?.id) return api.patch(API_ENDPOINTS.courseMaterials.update(dialog.item.id), body)
        return api.post(API_ENDPOINTS.courseSessions.materials(targetSessionId), body)
      }

      const targetSessionId = dialog.text.sessionId
      if (!dialog.text.courseId) throw new Error('اختر الكورس داخل الفورم')
      if (!targetSessionId) throw new Error('اختر الجلسة داخل الفورم')
      if (!dialog.text.content.trim()) throw new Error('اكتب المحتوى')

      const body = { content: dialog.text.content.trim() }
      if (dialog.kind === 'comment') {
        if (dialog.item?.id) return api.patch(API_ENDPOINTS.courseComments.update(dialog.item.id), body)
        return api.post(API_ENDPOINTS.courseSessions.comments(targetSessionId), body)
      }
      if (dialog.item?.id) return api.patch(API_ENDPOINTS.courseTeacherNotes.update(dialog.item.id), body)
      return api.post(API_ENDPOINTS.courseSessions.notes(targetSessionId), body)
    },
    onSuccess: async () => {
      toast.success('تم الحفظ')
      setDialog((current) => ({ ...current, open: false }))
      await invalidateCurrent()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const removeMutation = useMutation({
    mutationFn: async (item: Material | TextRecord) => {
      if (tab === 'materials') return api.delete(API_ENDPOINTS.courseMaterials.remove(item.id))
      if (tab === 'comments') return api.delete(API_ENDPOINTS.courseComments.remove(item.id))
      return api.delete(API_ENDPOINTS.courseTeacherNotes.remove(item.id))
    },
    onSuccess: invalidateCurrent,
    onError: (error) => toast.error(errorMessage(error)),
  })

  const downloadMutation = useMutation({
    mutationFn: async (material: Material) => api.downloadBlob(API_ENDPOINTS.courseMaterials.download(material.id)),
    onSuccess: (blob, material) => downloadBlob(blob, getBlobName(material)),
    onError: (error) => toast.error(errorMessage(error)),
  })

  const openCreate = (kind: DialogKind) => {
    setDialog({
      open: true,
      kind,
      item: null,
      material: createEmptyMaterial(courseId, sessionId),
      text: createEmptyText(courseId, sessionId),
    })
  }

  const openMaterial = (item: Material) => setDialog({
    open: true,
    kind: 'material',
    item,
    material: {
      ...createEmptyMaterial(courseId, sessionId),
      title: item.title ?? '',
      description: item.description ?? '',
      materialType: String(item.materialType ?? 1),
      order: item.order ?? 0,
    },
    text: createEmptyText(courseId, sessionId),
  })

  const openText = (kind: 'comment' | 'note', item: TextRecord) => setDialog({
    open: true,
    kind,
    item,
    material: createEmptyMaterial(courseId, sessionId),
    text: { ...createEmptyText(courseId, sessionId), content: item.content ?? '' },
  })

  const activeItems = tab === 'materials' ? (materialsQuery.data?.items ?? []) : tab === 'comments' ? (commentsQuery.data?.items ?? []) : (notesQuery.data?.items ?? [])
  const activeLoading = tab === 'materials' ? materialsQuery.isLoading : tab === 'comments' ? commentsQuery.isLoading : notesQuery.isLoading

  return (
    <section className="flex min-h-0 w-full flex-col gap-3 overflow-hidden">
      <div className="rounded-[1.4rem] border border-primary/10 bg-card/95 px-4 py-3 shadow-sm sm:px-5">
        <Badge variant="outline" color="primary" className="mb-2 rounded-full px-3">Courses</Badge>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">إدارة محتوى الكورسات</h1>
        <p className="mt-1 text-sm text-muted-foreground">اعرض مواد الجلسة من CourseMaterials، وأضف الملفات عبر رفع مباشر من الفورم فقط.</p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col rounded-3xl shadow-sm">
        <CardHeader className="shrink-0 space-y-3 px-4 py-3 sm:px-5">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>الكورس للعرض</Label>
              <CustomSelect value={courseId || undefined} placeholder="اختر الكورس" options={courseOptions} onValueChange={(value) => { setCourseId(value); setSessionId('') }} />
            </div>
            <div className="space-y-2">
              <Label>الجلسة للعرض</Label>
              <CustomSelect value={sessionId || undefined} placeholder="اختر الجلسة" disabled={!courseId} options={sessionOptions} onValueChange={setSessionId} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={tab === 'materials' ? 'default' : 'outline'} onClick={() => setTab('materials')}>المواد والفيديوهات</Button>
              <Button type="button" variant={tab === 'comments' ? 'default' : 'outline'} onClick={() => setTab('comments')}>التعليقات</Button>
              <Button type="button" variant={tab === 'notes' ? 'default' : 'outline'} onClick={() => setTab('notes')}>ملاحظات المدرس</Button>
            </div>
            <Button type="button" onClick={() => openCreate(tab === 'materials' ? 'material' : tab === 'comments' ? 'comment' : 'note')}>
              <Plus className="size-4" /> إضافة
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 sm:px-5">
          {!sessionId ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center text-muted-foreground">اختر كورسًا وجلسة لعرض المحتوى، أو اضغط إضافة واخترهم داخل الفورم.</div>
          ) : activeLoading ? (
            <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-14 rounded-2xl" />)}</div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-background/70 p-3">
              <div className="grid gap-3">
                {activeItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">لا توجد بيانات</div>
                ) : activeItems.map((item) => {
                  const material = item as Material
                  const textRecord = item as TextRecord

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{tab === 'materials' ? (material.title || '-') : (textRecord.content || '-')}</p>
                        <p className="text-sm text-muted-foreground">{tab === 'materials' ? (Number(material.materialType) === 2 ? 'فيديو' : 'ملف') : (textRecord.authorRole || '-')}</p>
                      </div>
                      <div className="flex gap-2">
                        {tab === 'materials' ? (
                          <>
                            <Button size="icon-sm" variant="outline" title="تنزيل" disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate(material)}><Download className="size-4" /></Button>
                            <Button size="icon-sm" variant="outline" title="عرض" onClick={() => window.open(API_ENDPOINTS.courseMaterials.stream(material.id), '_blank', 'noopener,noreferrer')}><ExternalLink className="size-4" /></Button>
                          </>
                        ) : null}
                        <Button size="icon-sm" variant="outline" onClick={() => tab === 'materials' ? openMaterial(material) : openText(tab === 'comments' ? 'comment' : 'note', textRecord)}><Pencil className="size-4" /></Button>
                        <Button size="icon-sm" variant="outline" className="text-destructive" onClick={() => removeMutation.mutate(item)}><Trash2 className="size-4" /></Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{dialog.item ? 'تعديل' : 'إضافة'}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[68vh] overflow-y-auto px-1 pb-1">
            {dialog.kind === 'material' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 lg:col-span-1">
                  <Label>الكورس</Label>
                  <CustomSelect value={dialog.material.courseId || undefined} placeholder="اختر الكورس" options={courseOptions} onValueChange={(value) => setDialog((current) => ({ ...current, material: { ...current.material, courseId: value, sessionId: '' } }))} />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <Label>الجلسة</Label>
                  <CustomSelect value={dialog.material.sessionId || undefined} placeholder="اختر الجلسة" disabled={!dialog.material.courseId} options={dialogSessionOptions} onValueChange={(value) => setDialog((current) => ({ ...current, material: { ...current.material, sessionId: value } }))} />
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <Label>النوع</Label>
                  <CustomSelect value={dialog.material.materialType} options={[{ value: '1', label: 'ملف' }, { value: '2', label: 'فيديو' }]} onValueChange={(value) => setDialog((current) => ({ ...current, material: { ...current.material, materialType: value } }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>العنوان</Label>
                  <Input value={dialog.material.title} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, title: event.target.value } }))} />
                </div>
                <div className="space-y-2">
                  <Label>الترتيب</Label>
                  <Input type="number" value={String(dialog.material.order)} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, order: Number(event.target.value) } }))} />
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <Label>الملف / الفيديو</Label>
                  <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">رفع مباشر فقط</p>
                        <p className="text-xs text-muted-foreground">لا يتم استخدام GET /api/Resources. يرفع الملف ثم يرسل resourceId إلى CourseMaterials.</p>
                      </div>
                      <Input type="file" accept={dialog.material.materialType === '2' ? 'video/*' : undefined} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, file: event.target.files?.[0] ?? null } }))} className="max-w-sm" />
                    </div>
                    {dialog.material.file ? <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><FileVideo className="size-4" /> {dialog.material.file.name}</p> : null}
                  </div>
                </div>
                <div className="space-y-2 lg:col-span-3">
                  <Label>الوصف</Label>
                  <Textarea value={dialog.material.description} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, description: event.target.value } }))} />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>الكورس</Label>
                  <CustomSelect value={dialog.text.courseId || undefined} placeholder="اختر الكورس" options={courseOptions} onValueChange={(value) => setDialog((current) => ({ ...current, text: { ...current.text, courseId: value, sessionId: '' } }))} />
                </div>
                <div className="space-y-2">
                  <Label>الجلسة</Label>
                  <CustomSelect value={dialog.text.sessionId || undefined} placeholder="اختر الجلسة" disabled={!dialog.text.courseId} options={dialogSessionOptions} onValueChange={(value) => setDialog((current) => ({ ...current, text: { ...current.text, sessionId: value } }))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>المحتوى</Label>
                  <Textarea value={dialog.text.content} onChange={(event) => setDialog((current) => ({ ...current, text: { ...current.text, content: event.target.value } }))} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog((current) => ({ ...current, open: false }))}>إلغاء</Button>
            <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
