import {
  useMemo,
  useState } from 'react'
import { useNavigate,
  useParams } from 'react-router-dom'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import { ArrowLeft,
  BookOpenCheck,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/shared/lib/toast'

import { useAuth } from '@/app/providers/auth.provider'
import { api } from '@/shared/api/api-client'
import type { PagedResponse,
  UUID } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { Button,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  ToggleSwitch,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  PaginatedDataTable,
  PageHeader,
  type DataTableColumn,
} from '@/shared/ui'

type CourseOption = { id: UUID; title?: string | null; name?: string | null; subjectName?: string | null; teacherName?: string | null }
type CourseSession = { id: UUID; title?: string | null; description?: string | null; order?: number | null; isFree?: boolean | null; accessStatus?: string | null }
type SessionFormValues = { title: string; description: string; order: number; isFree: boolean }
type SessionFormState = { open: boolean; mode: 'create' | 'edit'; item: CourseSession | null; values: SessionFormValues; errors: Partial<Record<keyof SessionFormValues, string>> }

const DEFAULT_PAGE_SIZE = 20
const LOOKUP_PAGE_SIZE = 100
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
  const title = values.title.trim()
  const description = values.description.trim()
  if (title.length < 2 || title.length > 200) errors.title = 'validation.titleLength'
  if (description.length > 1000) errors.description = 'validation.descriptionMax'
  if (!Number.isInteger(values.order) || values.order < 0) errors.order = 'validation.nonNegativeInt'
  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data: { ...values, title, description } }
}

export default function CourseSessionsPage() {
  const { t } = useTranslation('content-crud')
  const { hasRole } = useAuth()
  const isTeacher = hasRole('Teacher')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { courseId: routeCourseId = '' } = useParams()
  const isCourseDetailRoute = Boolean(routeCourseId)
  const [selectedCourseId, setSelectedCourseId] = useState(routeCourseId)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<CourseSession | null>(null)
  const [formState, setFormState] = useState<SessionFormState>({ open: false, mode: 'create', item: null, values: emptySessionValues, errors: {} })

  const coursesQuery = useQuery({ queryKey: ['course-sessions', 'courses'], queryFn: () => api.get<PagedResponse<CourseOption>>(API_ENDPOINTS.courses.list, { params: { page: 1, perPage: LOOKUP_PAGE_SIZE } }), staleTime: 1000 * 60 * 5, enabled: !isTeacher || !isCourseDetailRoute })
  const courseQuery = useQuery({ queryKey: ['course-sessions', 'course-detail', routeCourseId], queryFn: () => api.get<CourseOption>(API_ENDPOINTS.courses.detail(routeCourseId)), enabled: isCourseDetailRoute })
  const courseOptions = useMemo(() => (coursesQuery.data?.items ?? []).map((course) => ({ value: course.id, label: getCourseLabel(course) })), [coursesQuery.data?.items])
  const selectedCourseLabel = isCourseDetailRoute ? getCourseLabel(courseQuery.data ?? { id: routeCourseId }) : courseOptions.find((option) => option.value === selectedCourseId)?.label ?? ''
  const sessionsQuery = useQuery({ queryKey: ['course-sessions', selectedCourseId, page, DEFAULT_PAGE_SIZE], queryFn: () => api.get<PagedResponse<CourseSession>>(API_ENDPOINTS.courses.sessions(selectedCourseId), { params: { page, perPage: DEFAULT_PAGE_SIZE } }), enabled: Boolean(selectedCourseId) })
  const items = sessionsQuery.data?.items ?? []
  const totalCount = sessionsQuery.data?.totalCount ?? 0
  const pageSize = sessionsQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const saveMutation = useMutation({
    mutationFn: async (values: SessionFormValues) => {
      const payload = { title: values.title, description: values.description || null, order: values.order, isFree: values.isFree }
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

  const openCreateForm = () => { if (!isTeacher) setFormState({ open: true, mode: 'create', item: null, values: emptySessionValues, errors: {} }) }
  const openEditForm = (item: CourseSession) => { if (!isTeacher) setFormState({ open: true, mode: 'edit', item, values: { title: item.title ?? '', description: item.description ?? '', order: typeof item.order === 'number' ? item.order : 0, isFree: item.isFree === true }, errors: {} }) }
  const updateField = <TKey extends keyof SessionFormValues>(field: TKey, value: SessionFormValues[TKey]) => setFormState((current) => ({ ...current, values: { ...current.values, [field]: value }, errors: { ...current.errors, [field]: '' } }))
  const handleSubmit = () => {
    if (isTeacher) return
    if (!selectedCourseId) { toast.error(t('sessions.selectCourseFirst')); return }
    const validation = validateSession(formState.values)
    if (!validation.success) { setFormState((current) => ({ ...current, errors: validation.errors })); return }
    saveMutation.mutate(validation.data)
  }
  const handleDelete = (item: CourseSession) => { if (!isTeacher) setDeleteTarget(item) }
  const confirmDelete = () => { if (!isTeacher && deleteTarget) deleteMutation.mutate(deleteTarget) }

  const sessionColumns: DataTableColumn<CourseSession>[] = [
    { id: 'title', header: t('fields.title'), renderCell: (item) => item.title || '-' },
    { id: 'description', header: t('fields.description'), renderCell: (item) => item.description || '-' },
    { id: 'order', header: t('fields.order'), renderCell: (item) => typeof item.order === 'number' ? item.order : '-' },
    { id: 'isFree', header: t('fields.isFree'), renderCell: (item) => item.isFree ? '✓' : '—' },
    {
      id: 'actions',
      header: t('fields.actions'),
      headerClassName: 'text-center',
      cellClassName: 'text-center',
      renderCell: (item) => (
        <div className="flex w-full justify-center gap-2">
          <Button type="button" size="icon-sm" variant="outline" disabled={!selectedCourseId} onClick={() => navigate(`/courses/${selectedCourseId}/sessions/${item.id}/materials`)}><Eye className="size-4" /></Button>
          {!isTeacher ? <><Button type="button" size="icon-sm" variant="outline" onClick={() => openEditForm(item)}><Pencil className="size-4" /></Button><Button type="button" size="icon-sm" variant="outline" className="text-destructive hover:text-destructive" disabled={deleteMutation.isPending} onClick={() => handleDelete(item)}><Trash2 className="size-4" /></Button></> : null}
        </div>
      ),
    },
  ]

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<BookOpenCheck />}
        title={isCourseDetailRoute ? selectedCourseLabel : t('modules.courseSessions.title')}
        description={t('modules.courseSessions.description')}
        controls={
          <>
            {isCourseDetailRoute ? <Button type="button" variant="ghost" onClick={() => navigate('/courses')}><ArrowLeft className="rtl:rotate-180" />{t('modules.courses.title')}</Button> : <CustomSelect className="h-9 min-w-56" value={selectedCourseId || undefined} placeholder={t('sessions.coursePlaceholder')} options={courseOptions} onValueChange={(value) => { setSelectedCourseId(value); setPage(1) }} />}
          </>
        }
        actions={<><Button type="button" variant="outline" onClick={() => sessionsQuery.refetch()} disabled={!selectedCourseId || sessionsQuery.isFetching}><RefreshCcw />{t('actions.refresh')}</Button>{!isTeacher ? <Button type="button" onClick={openCreateForm} disabled={!selectedCourseId}><Plus />{t('actions.create')}</Button> : null}</>}
      />

      {!selectedCourseId ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center border border-dashed border-border bg-muted/20 p-10 text-center">
          <BookOpenCheck className="mb-3 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">{t('sessions.emptySelectTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('sessions.emptySelectDescription')}</p>
        </div>
      ) : (
        <PaginatedDataTable<CourseSession>
          className="min-h-0 flex-1"
          rows={items}
          columns={sessionColumns}
          getRowId={(item) => item.id}
          loading={sessionsQuery.isLoading || sessionsQuery.isFetching}
          summaryText={t('pagination.range', { start: totalCount === 0 ? 0 : (page - 1) * pageSize + 1, end: Math.min(page * pageSize, totalCount), total: totalCount })}
          emptyMessage={t('states.empty.description')}
          pagination={{
            currentPage: page,
            totalPages,
            pageSize,
            onPageChange: setPage,
            previousLabel: t('pagination.previous'),
            nextLabel: t('pagination.next'),
            getPageLabel: (pageNumber) => t('pagination.summary', { page: pageNumber, totalPages }),
          }}
        />
      )}

      {!isTeacher ? <><Sheet open={formState.open} onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}><SheetContent className="max-w-2xl"><SheetHeader><SheetTitle>{t(formState.mode === 'edit' ? 'form.editTitle' : 'form.createTitle', { entity: t('modules.courseSessions.title') })}</SheetTitle><SheetDescription>{t('form.description')}</SheetDescription></SheetHeader><div className="grid gap-4 py-2"><div className="space-y-2"><Label htmlFor="session-title">{t('fields.title')}</Label><Input id="session-title" value={formState.values.title} onChange={(event) => updateField('title', event.target.value)} />{formState.errors.title ? <p className="text-sm text-destructive">{t(formState.errors.title)}</p> : null}</div><div className="space-y-2"><Label htmlFor="session-description">{t('fields.description')}</Label><Textarea id="session-description" value={formState.values.description} onChange={(event) => updateField('description', event.target.value)} />{formState.errors.description ? <p className="text-sm text-destructive">{t(formState.errors.description)}</p> : null}</div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="session-order">{t('fields.order')}</Label><Input id="session-order" type="number" value={String(formState.values.order)} onChange={(event) => updateField('order', Number(event.target.value))} />{formState.errors.order ? <p className="text-sm text-destructive">{t(formState.errors.order)}</p> : null}</div><div className="space-y-2"><Label>{t('fields.isFree')}</Label><div className="flex h-11 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 text-sm"><span>{t('fields.isFree')}</span><ToggleSwitch checked={formState.values.isFree} onCheckedChange={(checked) => updateField('isFree', checked)} /></div></div></div></div><SheetFooter><Button type="button" variant="outline" onClick={() => setFormState((current) => ({ ...current, open: false }))}>{t('actions.cancel')}</Button><Button type="button" disabled={saveMutation.isPending} onClick={handleSubmit}>{saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('actions.save')}</Button></SheetFooter></SheetContent></Sheet><Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t('messages.deleteTitle')}</DialogTitle><DialogDescription>{deleteTarget ? t('messages.deleteConfirm', { name: deleteTarget.title || t('messages.item') }) : ''}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('actions.cancel')}</Button><Button type="button" disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>{deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('actions.delete')}</Button></DialogFooter></Dialog> </> : null}
    </section>
  )
}
