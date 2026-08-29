import {
  useMemo,
  useState } from 'react'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import { BookOpen,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Badge,
  Button,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PaginatedDataTable,
  PageHeader,
  TableRowActionsMenu,
  Textarea,
  ToggleSwitch,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  type TableRowActionItem,
} from '@/shared/ui'

type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

type CourseRow = {
  id: string
  subjectId: string
  subjectName?: string | null
  teacherId: string
  teacherName?: string | null
  title: string
  description?: string | null
  isFree: boolean
  price?: number | null
  currency?: string | null
  status: CourseStatus
  sessionsCount?: number | null
}

type RelationOption = {
  id: string
  name?: string | null
  title?: string | null
  firstName?: string | null
  lastName?: string | null
}

type CourseForm = {
  subjectId: string
  teacherId: string
  title: string
  description: string
  isFree: boolean
  price: string
  currency: string
  status: CourseStatus
}

type CoursePayload = {
  subjectId: string
  teacherId: string
  title: string
  description?: string | null
  isFree: boolean
  price?: number | null
  currency?: string | null
  status?: CourseStatus
}

const PAGE_SIZE = 20
const EMPTY_FORM: CourseForm = {
  subjectId: '',
  teacherId: '',
  title: '',
  description: '',
  isFree: true,
  price: '0',
  currency: 'SYP',
  status: 'DRAFT',
}

function optionLabel(option: RelationOption) {
  return option.name?.trim()
    || option.title?.trim()
    || [option.firstName, option.lastName].filter(Boolean).join(' ').trim()
    || option.id
}

export default function CoursesManagementPage() {
  const { t } = useTranslation('admin-pages')
  const { hasRole } = useAuth()
  const isTeacher = hasRole('Teacher')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<CourseRow | null>(null)

  const coursesQuery = useQuery({
    queryKey: ['courses-management', page, search.trim(), isTeacher],
    queryFn: () => api.get<PagedResponse<CourseRow>>(API_ENDPOINTS.courses.list, {
      params: { page, perPage: PAGE_SIZE, ...(search.trim() ? { search: search.trim() } : {}) },
    }),
  })
  const subjectsQuery = useQuery({
    queryKey: ['courses-management', 'subjects'],
    queryFn: () => api.get<RelationOption[]>(API_ENDPOINTS.subjects.brief),
    staleTime: 5 * 60 * 1000,
    enabled: !isTeacher,
  })
  const teachersQuery = useQuery({
    queryKey: ['courses-management', 'teachers'],
    queryFn: () => api.get<RelationOption[]>(API_ENDPOINTS.teachers.brief),
    staleTime: 5 * 60 * 1000,
    enabled: !isTeacher,
  })

  const subjectOptions = useMemo(() => (subjectsQuery.data ?? []).map((item) => ({ value: item.id, label: optionLabel(item) })), [subjectsQuery.data])
  const teacherOptions = useMemo(() => (teachersQuery.data ?? []).map((item) => ({ value: item.id, label: optionLabel(item) })), [teachersQuery.data])

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }
  const openCreate = () => {
    if (isTeacher) return
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }
  const openEdit = async (row: CourseRow) => {
    if (isTeacher) return
    try {
      const detail = await api.get<CourseRow>(API_ENDPOINTS.courses.detail(row.id))
      setEditingId(row.id)
      setForm({
        subjectId: detail.subjectId ?? '',
        teacherId: detail.teacherId ?? '',
        title: detail.title ?? '',
        description: detail.description ?? '',
        isFree: detail.isFree === true,
        price: String(detail.price ?? 0),
        currency: detail.currency ?? 'SYP',
        status: detail.status ?? 'DRAFT',
      })
      setFormOpen(true)
    } catch {
      toast.error(t('courses.loadError'))
    }
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: CoursePayload = {
        subjectId: form.subjectId,
        teacherId: form.teacherId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        isFree: form.isFree,
        price: form.isFree ? null : Number(form.price || 0),
        currency: form.isFree ? null : form.currency.trim().toUpperCase(),
        status: form.status,
      }
      return editingId
        ? api.patch<CourseRow, CoursePayload>(API_ENDPOINTS.courses.update(editingId), payload)
        : api.post<CourseRow, CoursePayload>(API_ENDPOINTS.courses.create, payload)
    },
    onSuccess: async () => {
      toast.success(t(editingId ? 'courses.updated' : 'courses.created'))
      closeForm()
      await queryClient.invalidateQueries({ queryKey: ['courses-management'] })
    },
    onError: () => toast.error(t('courses.saveError')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(API_ENDPOINTS.courses.remove(id)),
    onSuccess: async () => {
      toast.success(t('courses.deleted'))
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['courses-management'] })
    },
    onError: () => toast.error(t('courses.deleteError')),
  })

  const rows = coursesQuery.data?.items ?? []
  const totalCount = coursesQuery.data?.totalCount ?? 0
  const pageSize = coursesQuery.data?.pageSize ?? PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const canSave = Boolean(
    form.subjectId
    && form.teacherId
    && form.title.trim().length >= 2
    && (form.isFree || (Number(form.price) >= 0 && form.currency.trim().length >= 3)),
  ) && !saveMutation.isPending

  const statusOptions = [
    { value: 'DRAFT', label: t('courses.status.DRAFT') },
    { value: 'PUBLISHED', label: t('courses.status.PUBLISHED') },
    { value: 'ARCHIVED', label: t('courses.status.ARCHIVED') },
  ]

  const getCourseActions = (row: CourseRow): TableRowActionItem<CourseRow>[] => {
    if (isTeacher) {
      return [{
        key: 'sessions',
        label: t('courses.manageSessions'),
        icon: <Eye />,
        onClick: () => navigate(`/courses/${row.id}`),
      }]
    }
    return [
      {
        key: 'sessions',
        label: t('courses.manageSessions'),
        icon: <Eye />,
        onClick: () => navigate(`/courses/${row.id}`),
      },
      {
        key: 'edit',
        label: t('common.edit'),
        icon: <Pencil />,
        onClick: () => void openEdit(row),
      },
      {
        key: 'delete',
        label: t('common.delete'),
        icon: <Trash2 />,
        variant: 'destructive',
        confirm: false,
        onClick: () => setDeleteTarget(row),
      },
    ]
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<BookOpen />}
        title={t('courses.title')}
        description={t('courses.description')}
        search={{ value: search, placeholder: t('courses.searchPlaceholder'), onChange: (value) => { setSearch(value); setPage(1) } }}
        actions={<><Button variant="outline" disabled={coursesQuery.isFetching} onClick={() => void coursesQuery.refetch()}><RefreshCcw />{t('common.refresh')}</Button>{!isTeacher ? <Button onClick={openCreate}><Plus />{t('courses.add')}</Button> : null}</>}
      />

      <PaginatedDataTable<CourseRow>
        className="min-h-0 flex-1"
          rows={rows}
          loading={coursesQuery.isLoading || coursesQuery.isFetching}
          getRowId={(row) => row.id}
          summaryText={t('courses.summary', { count: totalCount })}
          emptyMessage={t('courses.empty')}
          pagination={{ currentPage: page, totalPages, pageSize, onPageChange: setPage, previousLabel: t('common.previous'), nextLabel: t('common.next'), getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }) }}
          columns={[
            { id: 'title', header: t('courses.course'), renderCell: (row) => <span className="font-semibold">{row.title}</span> },
            { id: 'subject', header: t('courses.subject'), renderCell: (row) => row.subjectName || '-' },
            { id: 'teacher', header: t('courses.teacher'), renderCell: (row) => row.teacherName || '-' },
            { id: 'status', header: t('courses.statusLabel'), renderCell: (row) => <Badge variant="outline" color={row.status === 'PUBLISHED' ? 'emerald' : 'slate'}>{t(`courses.status.${row.status}`)}</Badge> },
            { id: 'price', header: t('courses.price'), renderCell: (row) => row.isFree ? t('courses.free') : `${row.price ?? 0} ${row.currency ?? ''}` },
            { id: 'sessions', header: t('courses.sessions'), renderCell: (row) => row.sessionsCount ?? 0 },
            { id: 'actions', header: '', renderCell: (row) => <div className="flex w-full justify-end"><TableRowActionsMenu row={row} triggerAriaLabel={t('common.actions')} actions={getCourseActions(row)} /></div> },
          ]}
      />

      {!isTeacher ? <Sheet open={formOpen} onOpenChange={(open) => { if (!open && !saveMutation.isPending) closeForm() }}>
        <SheetContent className="max-w-3xl">
          <SheetHeader><SheetTitle>{t(editingId ? 'courses.editTitle' : 'courses.createTitle')}</SheetTitle><SheetDescription>{t('courses.formDescription')}</SheetDescription></SheetHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2"><Label>{t('courses.subject')}</Label><CustomSelect value={form.subjectId || undefined} placeholder={t('courses.selectSubject')} options={subjectOptions} onValueChange={(value) => setForm((current) => ({ ...current, subjectId: String(value) }))} /></div>
            <div className="space-y-2"><Label>{t('courses.teacher')}</Label><CustomSelect value={form.teacherId || undefined} placeholder={t('courses.selectTeacher')} options={teacherOptions} onValueChange={(value) => setForm((current) => ({ ...current, teacherId: String(value) }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>{t('courses.course')}</Label><Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>{t('courses.descriptionField')}</Label><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t('courses.statusLabel')}</Label><CustomSelect value={form.status} options={statusOptions} onValueChange={(value) => setForm((current) => ({ ...current, status: String(value) as CourseStatus }))} /></div>
            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"><span className="text-sm font-medium">{t('courses.free')}</span><ToggleSwitch checked={form.isFree} onCheckedChange={(isFree) => setForm((current) => ({ ...current, isFree }))} /></div>
            {!form.isFree ? <><div className="space-y-2"><Label>{t('courses.price')}</Label><Input type="number" min={0} step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} /></div><div className="space-y-2"><Label>{t('courses.currency')}</Label><Input value={form.currency} maxLength={10} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} /></div></> : null}
          </div>
          <SheetFooter><Button variant="outline" disabled={saveMutation.isPending} onClick={closeForm}>{t('common.cancel')}</Button><Button disabled={!canSave} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('common.save')}</Button></SheetFooter>
        </SheetContent>
      </Sheet> : null}

      {!isTeacher ? <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t('courses.deleteTitle')}</DialogTitle><DialogDescription>{deleteTarget ? t('courses.deleteConfirm', { name: deleteTarget.title }) : ''}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button><Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>{deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('common.delete')}</Button></DialogFooter></DialogContent>
      </Dialog> : null}
    </section>
  )
}
