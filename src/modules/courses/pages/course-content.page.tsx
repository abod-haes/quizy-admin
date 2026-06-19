import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/shared/api/api-client'
import type { PagedResponse, UUID } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

type NamedItem = { id: UUID; title?: string | null; name?: string | null; url?: string | null }
type Material = { id: UUID; title?: string | null; description?: string | null; materialType?: number | null; resourceId?: UUID | null; order?: number | null }
type TextRecord = { id: UUID; content?: string | null; authorRole?: string | null }
type TabKey = 'materials' | 'comments' | 'notes'
type DialogKind = 'material' | 'comment' | 'note'

type DialogState = {
  open: boolean
  kind: DialogKind
  item: Material | TextRecord | null
  material: { title: string; description: string; materialType: string; resourceId: string; order: number }
  text: { content: string }
}

const PAGE_SIZE = 1000
const emptyMaterial = { title: '', description: '', materialType: '1', resourceId: '', order: 0 }
const emptyText = { content: '' }

function labelOf(item: NamedItem) {
  return item.title?.trim() || item.name?.trim() || item.url?.trim() || '-'
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'Request failed'
}

export default function CourseContentPage() {
  const queryClient = useQueryClient()
  const [courseId, setCourseId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [tab, setTab] = useState<TabKey>('materials')
  const [dialog, setDialog] = useState<DialogState>({ open: false, kind: 'material', item: null, material: emptyMaterial, text: emptyText })

  const coursesQuery = useQuery({
    queryKey: ['course-content', 'courses'],
    queryFn: () => api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.courses.list, { params: { Page: 1, PerPage: PAGE_SIZE } }),
  })
  const sessionsQuery = useQuery({
    queryKey: ['course-content', 'sessions', courseId],
    queryFn: () => api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.courses.sessions(courseId), { params: { Page: 1, PerPage: PAGE_SIZE } }),
    enabled: Boolean(courseId),
  })
  const resourcesQuery = useQuery({
    queryKey: ['course-content', 'resources'],
    queryFn: () => api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.resources.list, { params: { Page: 1, PerPage: PAGE_SIZE } }),
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
  const resourceOptions = useMemo(() => (resourcesQuery.data?.items ?? []).map((item) => ({ value: item.id, label: labelOf(item) })), [resourcesQuery.data?.items])

  const invalidateCurrent = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-content', tab, sessionId] })
    await queryClient.invalidateQueries({ queryKey: ['course-content', 'materials', sessionId] })
    await queryClient.invalidateQueries({ queryKey: ['course-content', 'comments', sessionId] })
    await queryClient.invalidateQueries({ queryKey: ['course-content', 'notes', sessionId] })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (dialog.kind === 'material') {
        const body = { title: dialog.material.title, description: dialog.material.description, materialType: Number(dialog.material.materialType), resourceId: dialog.material.resourceId, order: Number(dialog.material.order) }
        if (dialog.item?.id) return api.patch(API_ENDPOINTS.courseMaterials.update(dialog.item.id), body)
        return api.post(API_ENDPOINTS.courseSessions.materials(sessionId), body)
      }
      const body = { content: dialog.text.content }
      if (dialog.kind === 'comment') {
        if (dialog.item?.id) return api.patch(API_ENDPOINTS.courseComments.update(dialog.item.id), body)
        return api.post(API_ENDPOINTS.courseSessions.comments(sessionId), body)
      }
      if (dialog.item?.id) return api.patch(API_ENDPOINTS.courseTeacherNotes.update(dialog.item.id), body)
      return api.post(API_ENDPOINTS.courseSessions.notes(sessionId), body)
    },
    onSuccess: async () => {
      toast.success('Saved')
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

  const openCreate = (kind: DialogKind) => {
    if (!sessionId) {
      toast.error('Select a session first')
      return
    }
    setDialog({ open: true, kind, item: null, material: emptyMaterial, text: emptyText })
  }
  const openMaterial = (item: Material) => setDialog({ open: true, kind: 'material', item, material: { title: item.title ?? '', description: item.description ?? '', materialType: String(item.materialType ?? 1), resourceId: item.resourceId ?? '', order: item.order ?? 0 }, text: emptyText })
  const openText = (kind: 'comment' | 'note', item: TextRecord) => setDialog({ open: true, kind, item, material: emptyMaterial, text: { content: item.content ?? '' } })

  const activeItems = tab === 'materials' ? (materialsQuery.data?.items ?? []) : tab === 'comments' ? (commentsQuery.data?.items ?? []) : (notesQuery.data?.items ?? [])
  const activeLoading = tab === 'materials' ? materialsQuery.isLoading : tab === 'comments' ? commentsQuery.isLoading : notesQuery.isLoading

  return (
    <section className="flex min-h-0 w-full flex-col gap-6 overflow-hidden">
      <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <Badge variant="outline" color="primary" className="mb-3 rounded-full px-3">Courses</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">إدارة محتوى الكورسات</h1>
        <p className="mt-2 text-muted-foreground">اختر كورسًا وجلسة لإدارة الملفات، الفيديوهات، التعليقات، وملاحظات المدرس.</p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col rounded-3xl shadow-sm">
        <CardHeader className="shrink-0 space-y-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2"><Label>الكورس</Label><CustomSelect value={courseId || undefined} placeholder="اختر الكورس" options={courseOptions} onValueChange={(value) => { setCourseId(value); setSessionId('') }} /></div>
            <div className="space-y-2"><Label>الجلسة</Label><CustomSelect value={sessionId || undefined} placeholder="اختر الجلسة" disabled={!courseId} options={sessionOptions} onValueChange={setSessionId} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={tab === 'materials' ? 'default' : 'outline'} onClick={() => setTab('materials')}>المواد والفيديوهات</Button>
            <Button type="button" variant={tab === 'comments' ? 'default' : 'outline'} onClick={() => setTab('comments')}>التعليقات</Button>
            <Button type="button" variant={tab === 'notes' ? 'default' : 'outline'} onClick={() => setTab('notes')}>ملاحظات المدرس</Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mb-4 flex justify-end"><Button type="button" disabled={!sessionId} onClick={() => openCreate(tab === 'materials' ? 'material' : tab === 'comments' ? 'comment' : 'note')}><Plus className="size-4" />إضافة</Button></div>
          {!sessionId ? <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center text-muted-foreground">اختر جلسة لعرض المحتوى.</div> : activeLoading ? <div className="space-y-3">{[0,1,2].map((item) => <Skeleton key={item} className="h-14 rounded-2xl" />)}</div> : <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-background/70 p-3"><div className="grid gap-3">{activeItems.length === 0 ? <div className="p-8 text-center text-muted-foreground">لا توجد بيانات</div> : activeItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"><div className="min-w-0"><p className="truncate font-semibold">{tab === 'materials' ? ((item as Material).title || '-') : ((item as TextRecord).content || '-')}</p><p className="text-sm text-muted-foreground">{tab === 'materials' ? (Number((item as Material).materialType) === 2 ? 'فيديو' : 'ملف') : ((item as TextRecord).authorRole || '-')}</p></div><div className="flex gap-2"><Button size="icon-sm" variant="outline" onClick={() => tab === 'materials' ? openMaterial(item as Material) : openText(tab === 'comments' ? 'comment' : 'note', item as TextRecord)}><Pencil className="size-4" /></Button><Button size="icon-sm" variant="outline" className="text-destructive" onClick={() => removeMutation.mutate(item)}><Trash2 className="size-4" /></Button></div></div>)}</div></div>}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{dialog.item ? 'تعديل' : 'إضافة'}</DialogTitle></DialogHeader>
          {dialog.kind === 'material' ? <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>العنوان</Label><Input value={dialog.material.title} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, title: event.target.value } }))} /></div><div className="space-y-2"><Label>النوع</Label><CustomSelect value={dialog.material.materialType} options={[{ value: '1', label: 'ملف' }, { value: '2', label: 'فيديو' }]} onValueChange={(value) => setDialog((current) => ({ ...current, material: { ...current.material, materialType: value } }))} /></div><div className="space-y-2 sm:col-span-2"><Label>الملف / الفيديو</Label><CustomSelect value={dialog.material.resourceId || undefined} placeholder="اختر موردًا" options={resourceOptions} onValueChange={(value) => setDialog((current) => ({ ...current, material: { ...current.material, resourceId: value } }))} /></div><div className="space-y-2"><Label>الترتيب</Label><Input type="number" value={String(dialog.material.order)} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, order: Number(event.target.value) } }))} /></div><div className="space-y-2 sm:col-span-2"><Label>الوصف</Label><Textarea value={dialog.material.description} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, description: event.target.value } }))} /></div></div> : <div className="space-y-2"><Label>المحتوى</Label><Textarea value={dialog.text.content} onChange={(event) => setDialog((current) => ({ ...current, text: { content: event.target.value } }))} /></div>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDialog((current) => ({ ...current, open: false }))}>إلغاء</Button><Button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
