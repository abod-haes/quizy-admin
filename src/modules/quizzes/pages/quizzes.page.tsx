import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, FileQuestion, Plus, RefreshCcw, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '@/app/providers/auth.provider'
import { api } from '@/shared/api/api-client'
import type { LegacyPaginationQuery, PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Button,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PaginatedDataTable,
  PageHeader,
  type DataTableColumn,
} from '@/shared/ui'

type QuizRow = {
  id: string
  title?: string | null
  teacherId?: string | null
  teacherName?: string | null
  isFree?: boolean | null
  questionsCount?: number | null
  questions?: unknown[] | null
}

type TeacherOption = {
  id: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
}

const PAGE_SIZE = 20
const ALL_VALUE = '__all__'

function teacherLabel(teacher: TeacherOption) {
  return teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ').trim() || '-'
}

function quizTeacher(quiz: QuizRow, teachers: TeacherOption[]) {
  if (quiz.teacherName?.trim()) return quiz.teacherName
  const teacher = teachers.find((item) => item.id === quiz.teacherId)
  return teacher ? teacherLabel(teacher) : '-'
}

function questionsCount(quiz: QuizRow) {
  if (typeof quiz.questionsCount === 'number') return quiz.questionsCount
  return Array.isArray(quiz.questions) ? quiz.questions.length : 0
}

export default function QuizzesPage() {
  const { t } = useTranslation('admin-pages')
  const { hasRole } = useAuth()
  const isTeacher = hasRole('Teacher')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [teacherId, setTeacherId] = useState(ALL_VALUE)
  const [deleteTarget, setDeleteTarget] = useState<QuizRow | null>(null)

  const teachersQuery = useQuery({
    queryKey: ['quizzes-page', 'teachers'],
    queryFn: () => api.get<TeacherOption[]>(API_ENDPOINTS.teachers.brief),
    staleTime: 5 * 60 * 1000,
    enabled: !isTeacher,
  })
  const quizzesQuery = useQuery({
    queryKey: ['quizzes-page', page, search, teacherId, isTeacher],
    queryFn: () => {
      const params: LegacyPaginationQuery & { search?: string; teacherId?: string } = {
        Page: page,
        PerPage: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(!isTeacher && teacherId !== ALL_VALUE ? { teacherId } : {}),
      }
      return api.get<PagedResponse<QuizRow>>(API_ENDPOINTS.quizzes.list, { params })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(API_ENDPOINTS.quizzes.remove(id)),
    onSuccess: async () => {
      toast.success(t('quizzes.deleted'))
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['quizzes-page'] })
    },
    onError: () => toast.error(t('quizzes.deleteError')),
  })

  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data])
  const teacherOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: t('quizzes.allTeachers') },
      ...teachers.map((teacher) => ({ value: teacher.id, label: teacherLabel(teacher) })),
    ],
    [teachers, t],
  )
  const rows = quizzesQuery.data?.items ?? []

  const totalCount = quizzesQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / (quizzesQuery.data?.pageSize ?? PAGE_SIZE)))
  const quizTitle = (quiz: QuizRow) => quiz.title?.trim() || t('quizzes.untitled')
  const hasFilters = Boolean(search.trim()) || (!isTeacher && teacherId !== ALL_VALUE)

  const columns: DataTableColumn<QuizRow>[] = [
    { id: 'title', header: t('quizzes.quizName'), renderCell: (row) => <span className="font-semibold">{quizTitle(row)}</span> },
    { id: 'teacher', header: t('quizzes.teacher'), renderCell: (row) => quizTeacher(row, teachers) },
    { id: 'questions', header: t('quizzes.questionsCount'), renderCell: questionsCount },
    { id: 'status', header: t('quizzes.status'), renderCell: (row) => row.isFree ? t('quizzes.free') : t('quizzes.paid') },
  ]
  if (!isTeacher) {
    columns.push({
      id: 'actions',
      header: '',
      renderCell: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" icon={<Edit3 className="size-4" />} onClick={() => navigate(`/quiz-builder?quizId=${encodeURIComponent(row.id)}`)}>{t('common.edit')}</Button>
          <Button size="sm" variant="outline" className="text-destructive" icon={<Trash2 className="size-4" />} onClick={() => setDeleteTarget(row)}>{t('common.delete')}</Button>
        </div>
      ),
    })
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<FileQuestion />}
        title={t('quizzes.title')}
        search={{ value: search, placeholder: t('quizzes.searchPlaceholder'), onChange: (value) => { setSearch(value); setPage(1) } }}
        controls={isTeacher ? undefined : <><CustomSelect className="h-9 min-w-44" value={teacherId} variant="filter" options={teacherOptions} onValueChange={(value) => { setTeacherId(String(value)); setPage(1) }} />{hasFilters ? <Button variant="outline" icon={<X />} onClick={() => { setSearch(''); setTeacherId(ALL_VALUE); setPage(1) }}>{t('quizzes.clearFilters')}</Button> : null}</>}
        actions={<><Button variant="outline" icon={<RefreshCcw />} onClick={() => void quizzesQuery.refetch()} disabled={quizzesQuery.isFetching}>{t('quizzes.refresh')}</Button>{!isTeacher ? <Button icon={<Plus />} onClick={() => navigate('/quiz-builder')}>{t('quizzes.add')}</Button> : null}</>}
      />

      <PaginatedDataTable<QuizRow>
        className="min-h-0 flex-1"
        rows={rows}
        loading={quizzesQuery.isLoading || quizzesQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('quizzes.title') + `: ${totalCount}`}
        emptyMessage={t('quizzes.empty')}
        pagination={{ currentPage: page, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: t('common.previous'), nextLabel: t('common.next'), getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }) }}
        columns={columns}
      />

      {!isTeacher ? <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t('quizzes.deleteTitle')}</DialogTitle><DialogDescription>{deleteTarget ? t('quizzes.deleteConfirm', { name: quizTitle(deleteTarget) }) : ''}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button><Button className="bg-destructive text-destructive-foreground" loading={deleteMutation.isPending} icon={<Trash2 className="size-4" />} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>{t('common.delete')}</Button></DialogFooter></DialogContent>
      </Dialog> : null}
    </section>
  )
}
