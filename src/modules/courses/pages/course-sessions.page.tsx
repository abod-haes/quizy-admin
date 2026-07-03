import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpenCheck, Loader2, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/shared/lib/toast'

import { api } from '@/shared/api/api-client'
import type { PagedResponse, UUID } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { Badge, Button, Card, CardContent, CardHeader, CustomSelect, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from '@/shared/ui'

type CourseOption = { id: UUID; title?: string | null; name?: string | null; subjectName?: string | null; teacherName?: string | null }
type CourseSession = { id: UUID; title?: string | null; description?: string | null; order?: number | null; isFree?: boolean | null; accessStatus?: string | null }
type SessionFormValues = { title: string; description: string; order: number; isFree: boolean }
type SessionFormState = { open: boolean; mode: 'create' | 'edit'; item: CourseSession | null; values: SessionFormValues; errors: Partial<Record<keyof SessionFormValues, string>> }

const DEFAULT_PAGE_SIZE = 20
const emptySessionValues: SessionFormValues = { title: '', description: '', order: 0, isFree: true }

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'errors.generic'
}

function getCourseLabel(course: CourseOption): string { return course.title || course.name || '-' }

function validateSession(values: SessionFormValues): { success: true; data: SessionFormValues } | { success: false; errors: SessionFormState['errors'] } {
  const errors: SessionFormState['errors'] = {}
  if (!values.title.trim()) errors.title = 'validation.required'
  if (!Number.isFinite(values.order) || values.order < 0) errors.order = 'validation.nonNegativeInt'
  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data: values }
}

export default function CourseSessionsPage() {
  const { t } = useTranslation('content-crud')
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<CourseSession | null>(null)
  const [formState, setFormState] = useState<SessionFormState>({ open: false, mode: 'create', item: null, values: emptySessionValues, errors: {} })

  const coursesQuery = useQuery({ queryKey: ['course-sessions', 'courses'], queryFn: () => api.get<PagedResponse<CourseOption>>(API_ENDPOINTS.courses.list, { params: { Page: 1, PerPage: 1000 } }), staleTime: 1000 * 60 * 5 })
  const courseOptions = useMemo(() => (coursesQuery.data?.items ?? []).map((course) => ({ value: course.id, label: getCourseLabel(course) })), [coursesQuery.data?.items])
  const sessionsQuery = useQuery({ queryKey: ['course-sessions', selectedCourseId, page, DEFAULT_PAGE_SIZE], queryFn: () => api.get<PagedResponse<CourseSession>>(API_ENDPOINTS.courses.sessions(selectedCourseId), { params: { Page: page, PerPage: DEFAULT_PAGE_SIZE } }), enabled: Boolean(selectedCourseId) })
  const items = sessionsQuery.data?.items ?? []
  const totalCount = sessionsQuery.data?.totalCount ?? 0
  const pageSize = sessionsQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalCount)

  const saveMutation = useMutation({
    mutationFn: async (values: SessionFormValues) => {
      const payload = { title: values.title, description: values.description, order: values.order, isFree: values.isFree }
      if (formState.mode === 'edit' && formState.item?.id) return api.patch<unknown, typeof payload>(API_ENDPOINTS.courseSessions.update(formState.item.id), payload)
      return api.post<unknown, typeof payload>(API_ENDPOINTS.courses.sessions(selectedCourseId), payload)
    },
    onSuccess: async () => { toast.success(t(formState.mode === 'edit' ? 'messages.updated' : 'messages.created')); setFormState({ open: false, mode: 'create', item: null, values: emptySessionValues, errors: {} }); await queryClient.invalidateQueries({ queryKey: ['course-sessions', selectedCourseId] }) },
    onError: (error) => toast.error(t(getApiErrorMessage(error))),
  })

  const deleteMutation = useMutation({
    mutationFn: (item: CourseSession) => api.delete<unknown>(API_ENDPOINTS.courseSessions.remove(item.id)),
    onSuccess: async () => { toast.success(t('messages.deleted')); setDeleteTarget(null); await queryClient.invalidateQueries({ queryKey: ['course-sessions', selectedCourseId] }) },
    onError: (error) => toast.error(t(getApiErrorMessage(error))),
  })

  const openCreateForm = () => setFormState({ open: true, mode: 'create', item: null, values: emptySessionValues, errors: {} })
  const openEditForm = (item: CourseSession) => setFormState({ open: true, mode: 'edit', item, values: { title: item.title ?? '', description: item.description ?? '', order: typeof item.order === 'number' ? item.order : 0, isFree: item.isFree === true }, errors: {} })
  const updateField = <TKey extends keyof SessionFormValues>(field: TKey, value: SessionFormValues[TKey]) => setFormState((current) => ({ ...current, values: { ...current.values, [field]: value }, errors: { ...current.errors, [field]: '' } }))
  const handleSubmit = () => {
    if (!selectedCourseId) { toast.error(t('sessions.selectCourseFirst')); return }
    const validation = validateSession(formState.values)
    if (!validation.success) { setFormState((current) => ({ ...current, errors: validation.errors })); return }
    saveMutation.mutate(validation.data)
  }
  const handleDelete = (item: CourseSession) => setDeleteTarget(item)
  const confirmDelete = () => { if (deleteTarget) deleteMutation.mutate(deleteTarget) }
  const goToPage = (nextPage: number) => setPage(Math.min(totalPages, Math.max(1, nextPage)))

  return (
    <section className="flex min-h-0 w-full flex-col gap-6 overflow-hidden">
      <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="max-w-3xl space-y-3"><Badge variant="outline" color="primary" className="rounded-full px-3">{t('status.connected')}</Badge><h1 className="text-3xl font-bold tracking-tight text-foreground">{t('modules.courseSessions.title')}</h1><p className="text-base leading-7 text-muted-foreground">{t('modules.courseSessions.description')}</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => sessionsQuery.refetch()} disabled={!selectedCourseId || sessionsQuery.isFetching}><RefreshCcw className="size-4" />{t('actions.refresh')}</Button><Button type="button" onClick={openCreateForm} disabled={!selectedCourseId}><Plus className="size-4" />{t('actions.create')}</Button></div></div></div>
      <Card className="flex min-h-0 flex-1 flex-col rounded-3xl shadow-sm"><CardHeader className="shrink-0 gap-4"><div className="grid gap-3 lg:grid-cols-[minmax(18rem,26rem)_1fr] lg:items-end"><div className="space-y-2"><Label>{t('fields.course')}</Label><CustomSelect value={selectedCourseId || undefined} placeholder={t('sessions.coursePlaceholder')} options={courseOptions} onValueChange={(value) => { setSelectedCourseId(value); setPage(1) }} /></div></div></CardHeader><CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">{!selectedCourseId ? <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center"><BookOpenCheck className="mb-3 size-10 text-muted-foreground" /><h2 className="text-lg font-semibold text-foreground">{t('sessions.emptySelectTitle')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('sessions.emptySelectDescription')}</p></div> : sessionsQuery.isLoading ? <div className="space-y-3">{[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-14 w-full rounded-2xl" />)}</div> : items.length === 0 ? <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center"><BookOpenCheck className="mx-auto mb-3 size-10 text-muted-foreground" /><h2 className="text-lg font-semibold text-foreground">{t('states.empty.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('states.empty.description')}</p></div> : <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background/70"><div className="max-h-[min(62vh,46rem)] overflow-auto"><Table className="min-w-[760px]"><TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur"><TableRow><TableHead>{t('fields.title')}</TableHead><TableHead>{t('fields.description')}</TableHead><TableHead>{t('fields.order')}</TableHead><TableHead>{t('fields.isFree')}</TableHead><TableHead className="w-32 text-center">{t('fields.actions')}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="max-w-[18rem] truncate">{item.title || '-'}</TableCell><TableCell className="max-w-[22rem] truncate">{item.description || '-'}</TableCell><TableCell>{typeof item.order === 'number' ? item.order : '-'}</TableCell><TableCell>{item.isFree ? '✓' : '—'}</TableCell><TableCell><div className="flex justify-center gap-2"><Button type="button" size="icon-sm" variant="outline" onClick={() => openEditForm(item)}><Pencil className="size-4" /></Button><Button type="button" size="icon-sm" variant="outline" className="text-destructive hover:text-destructive" disabled={deleteMutation.isPending} onClick={() => handleDelete(item)}><Trash2 className="size-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div></div>}{selectedCourseId ? <div className="mt-4 flex shrink-0 flex-col gap-3 border-t border-border/70 pt-4 lg:flex-row lg:items-center lg:justify-between"><p className="text-sm text-muted-foreground">{t('pagination.range', { start: startItem, end: endItem, total: totalCount })}</p><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" disabled={page <= 1 || sessionsQuery.isFetching} onClick={() => goToPage(page - 1)}>{t('pagination.previous')}</Button><Badge variant="outline" className="rounded-full px-3">{t('pagination.summary', { page, totalPages })}</Badge><Button type="button" variant="outline" disabled={page >= totalPages || sessionsQuery.isFetching} onClick={() => goToPage(page + 1)}>{t('pagination.next')}</Button></div></div> : null}</CardContent></Card>
      <Dialog open={formState.open} onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{t(formState.mode === 'edit' ? 'form.editTitle' : 'form.createTitle', { entity: t('modules.courseSessions.title') })}</DialogTitle><DialogDescription>{t('form.description')}</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="space-y-2"><Label htmlFor="session-title">{t('fields.title')}</Label><Input id="session-title" value={formState.values.title} onChange={(event) => updateField('title', event.target.value)} />{formState.errors.title ? <p className="text-sm text-destructive">{t(formState.errors.title)}</p> : null}</div><div className="space-y-2"><Label htmlFor="session-description">{t('fields.description')}</Label><Textarea id="session-description" value={formState.values.description} onChange={(event) => updateField('description', event.target.value)} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="session-order">{t('fields.order')}</Label><Input id="session-order" type="number" value={String(formState.values.order)} onChange={(event) => updateField('order', Number(event.target.value))} />{formState.errors.order ? <p className="text-sm text-destructive">{t(formState.errors.order)}</p> : null}</div><div className="space-y-2"><Label>{t('fields.isFree')}</Label><label className="flex h-11 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-sm"><input type="checkbox" checked={formState.values.isFree} onChange={(event) => updateField('isFree', event.target.checked)} />{t('fields.isFree')}</label></div></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setFormState((current) => ({ ...current, open: false }))}>{t('actions.cancel')}</Button><Button type="button" disabled={saveMutation.isPending} onClick={handleSubmit}>{saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('actions.save')}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle><DialogDescription>{deleteTarget ? t('messages.deleteConfirm', { name: deleteTarget.title || t('messages.item') }) : ''}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('actions.cancel')}</Button><Button type="button" disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>{deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}حذف</Button></DialogFooter></DialogContent></Dialog>
    </section>
  )
}
