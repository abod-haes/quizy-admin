import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, FileQuestion, Loader2, Plus, RefreshCcw, Search, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { api } from '@/shared/api/api-client'
import type { LegacyPaginationQuery, PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Button,
  Card,
  CardContent,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  PaginatedDataTable,
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
  })
  const quizzesQuery = useQuery({
    queryKey: ['quizzes-page', page],
    queryFn: () => {
      const params: LegacyPaginationQuery = { Page: page, PerPage: PAGE_SIZE }
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
  const normalizedSearch = search.trim().toLowerCase()
  const rows = (quizzesQuery.data?.items ?? []).filter((quiz) => {
    if (teacherId !== ALL_VALUE && quiz.teacherId !== teacherId) return false
    if (!normalizedSearch) return true
    const title = quiz.title?.trim() || t('quizzes.untitled')
    return [title, quizTeacher(quiz, teachers)].some((value) => value.toLowerCase().includes(normalizedSearch))
  })

  const totalCount = quizzesQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / (quizzesQuery.data?.pageSize ?? PAGE_SIZE)))
  const quizTitle = (quiz: QuizRow) => quiz.title?.trim() || t('quizzes.untitled')
  const hasFilters = Boolean(search.trim()) || teacherId !== ALL_VALUE

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><FileQuestion className="size-5 text-primary" /><h1 className="text-2xl font-bold">{t('quizzes.title')}</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void quizzesQuery.refetch()} disabled={quizzesQuery.isFetching}>{t('quizzes.refresh')}</Button>
          <Button icon={<Plus className="size-4" />} onClick={() => navigate('/quiz-builder')}>{t('quizzes.add')}</Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_16rem_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute start-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input data-leading-icon className="ps-10" value={search} placeholder={t('quizzes.searchPlaceholder')} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        </label>
        <CustomSelect value={teacherId} variant="filter" options={teacherOptions} onValueChange={(value) => { setTeacherId(String(value)); setPage(1) }} />
        {hasFilters ? <Button variant="outline" icon={<X className="size-4" />} onClick={() => { setSearch(''); setTeacherId(ALL_VALUE); setPage(1) }}>{t('quizzes.clearFilters')}</Button> : null}
      </div>

      <Card className="rounded-3xl"><CardContent className="p-4">
        <PaginatedDataTable<QuizRow>
          rows={rows}
          loading={quizzesQuery.isLoading || quizzesQuery.isFetching}
          getRowId={(row) => row.id}
          summaryText={t('quizzes.title') + `: ${totalCount}`}
          emptyMessage={t('quizzes.empty')}
          pagination={{ currentPage: page, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: t('common.previous'), nextLabel: t('common.next'), getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }) }}
          columns={[
            { id: 'title', header: t('quizzes.quizName'), renderCell: (row) => <span className="font-semibold">{quizTitle(row)}</span> },
            { id: 'teacher', header: t('quizzes.teacher'), renderCell: (row) => quizTeacher(row, teachers) },
            { id: 'questions', header: t('quizzes.questionsCount'), renderCell: questionsCount },
            { id: 'status', header: t('quizzes.status'), renderCell: (row) => row.isFree ? t('quizzes.free') : t('quizzes.paid') },
            { id: 'actions', header: '', renderCell: (row) => <div className="flex justify-end gap-2"><Button size="sm" variant="outline" icon={<Edit3 className="size-4" />} onClick={() => navigate(`/quiz-builder?quizId=${encodeURIComponent(row.id)}`)}>{t('common.edit')}</Button><Button size="sm" variant="outline" className="text-destructive" icon={<Trash2 className="size-4" />} onClick={() => setDeleteTarget(row)}>{t('common.delete')}</Button></div> },
          ]}
        />
      </CardContent></Card>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t('quizzes.deleteTitle')}</DialogTitle><DialogDescription>{deleteTarget ? t('quizzes.deleteConfirm', { name: quizTitle(deleteTarget) }) : ''}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button><Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" loading={deleteMutation.isPending} icon={<Trash2 className="size-4" />} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>{t('common.delete')}</Button></DialogFooter></DialogContent>
      </Dialog>
    </section>
  )
}
