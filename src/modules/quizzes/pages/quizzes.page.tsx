import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit3, FileQuestion, Plus, RefreshCcw, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { Button, Card, CardContent, CustomSelect, Input, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui'

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

function quizTitle(quiz: QuizRow) {
  return quiz.title?.trim() || 'اختبار بدون عنوان'
}

function quizTeacher(quiz: QuizRow, teachers: TeacherOption[]) {
  if (quiz.teacherName?.trim()) return quiz.teacherName
  const teacher = teachers.find((item) => item.id === quiz.teacherId)
  return teacher ? teacherLabel(teacher) : '-'
}

function questionsCount(quiz: QuizRow) {
  if (typeof quiz.questionsCount === 'number') return quiz.questionsCount
  if (Array.isArray(quiz.questions)) return quiz.questions.length
  return 0
}

function paginationItems(page: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const items: Array<number | 'dots-left' | 'dots-right'> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) items.push('dots-left')
  for (let current = start; current <= end; current += 1) items.push(current)
  if (end < totalPages - 1) items.push('dots-right')
  items.push(totalPages)
  return items
}

export default function QuizzesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [teacherId, setTeacherId] = useState(ALL_VALUE)

  const teachersQuery = useQuery({
    queryKey: ['quizzes-page', 'teachers'],
    queryFn: () => api.get<TeacherOption[]>(API_ENDPOINTS.teachers.brief),
    staleTime: 1000 * 60 * 5,
  })

  const quizzesQuery = useQuery({
    queryKey: ['quizzes-page', page],
    queryFn: () => api.get<PagedResponse<QuizRow>>(API_ENDPOINTS.quizzes.list, { params: { Page: page, PerPage: PAGE_SIZE } }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(API_ENDPOINTS.quizzes.remove(id)),
    onSuccess: async () => {
      toast.success('تم حذف الاختبار')
      await queryClient.invalidateQueries({ queryKey: ['quizzes-page'] })
    },
    onError: () => toast.error('تعذر حذف الاختبار'),
  })

  const teachers = teachersQuery.data ?? []
  const teacherOptions = useMemo(() => [
    { value: ALL_VALUE, label: 'كل المدرسين' },
    ...teachers.map((teacher) => ({ value: teacher.id, label: teacherLabel(teacher) })),
  ], [teachers])

  const rows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return (quizzesQuery.data?.items ?? []).filter((quiz) => {
      if (teacherId !== ALL_VALUE && quiz.teacherId !== teacherId) return false
      if (!normalizedSearch) return true
      return [quizTitle(quiz), quizTeacher(quiz, teachers)].some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [quizzesQuery.data?.items, search, teacherId, teachers])

  const totalCount = quizzesQuery.data?.totalCount ?? 0
  const pageSize = quizzesQuery.data?.pageSize ?? PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const hasActiveFilters = Boolean(search.trim()) || teacherId !== ALL_VALUE

  const goToPage = (nextPage: number) => setPage(Math.min(totalPages, Math.max(1, nextPage)))
  const updateSearch = (value: string) => {
    setPage(1)
    setSearch(value)
  }
  const updateTeacherFilter = (value: string) => {
    setPage(1)
    setTeacherId(value)
  }
  const clearFilters = () => {
    setPage(1)
    setSearch('')
    setTeacherId(ALL_VALUE)
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 rounded-3xl border border-primary/10 bg-card/90 p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileQuestion className="size-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">الاختبارات</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-11 px-5 text-sm font-semibold" onClick={() => quizzesQuery.refetch()} disabled={quizzesQuery.isFetching}>
            <RefreshCcw className="size-4" /> تحديث
          </Button>
          <Button type="button" className="h-11 px-5 text-sm font-semibold" onClick={() => navigate('/quiz-builder')}>
            <Plus className="size-4" /> إضافة اختبار
          </Button>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col rounded-3xl shadow-sm">
        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="grid shrink-0 gap-2 lg:grid-cols-[minmax(0,1fr)_16rem_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-11 ps-10" value={search} placeholder="ابحث باسم الاختبار أو المدرس" onChange={(event) => updateSearch(event.target.value)} />
            </label>
            <CustomSelect value={teacherId} variant="filter" options={teacherOptions} onValueChange={(value) => updateTeacherFilter(String(value))} placeholder="كل المدرسين" />
            {hasActiveFilters ? (
              <Button type="button" variant="outline" className="h-11 px-4 text-sm font-semibold" onClick={clearFilters}>
                <X className="size-4" /> مسح الفلاتر
              </Button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background/70">
            <div className="h-full min-h-0 overflow-auto">
              <Table className="min-w-[920px]">
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                  <TableRow>
                    <TableHead>اسم الاختبار</TableHead>
                    <TableHead>المدرس</TableHead>
                    <TableHead>عدد الأسئلة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="w-32 text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzesQuery.isLoading ? (
                    [0, 1, 2, 3, 4].map((index) => <TableRow key={index}><TableCell colSpan={5}><Skeleton className="h-10 w-full rounded-xl" /></TableCell></TableRow>)
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">لا توجد اختبارات مطابقة</TableCell></TableRow>
                  ) : rows.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell className="max-w-[24rem] truncate font-medium">{quizTitle(quiz)}</TableCell>
                      <TableCell>{quizTeacher(quiz, teachers)}</TableCell>
                      <TableCell>{questionsCount(quiz)}</TableCell>
                      <TableCell>{quiz.isFree ? 'مجاني' : 'مدفوع'}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button type="button" size="icon-sm" variant="outline" onClick={() => navigate(`/quiz-builder?quizId=${encodeURIComponent(quiz.id)}`)}><Edit3 className="size-4" /></Button>
                          <Button type="button" size="icon-sm" variant="outline" className="text-destructive hover:text-destructive" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm('هل تريد حذف هذا الاختبار؟')) deleteMutation.mutate(quiz.id) }}><Trash2 className="size-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex shrink-0 justify-end border-t border-border/70 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button type="button" size="icon-sm" variant="outline" disabled={page <= 1 || quizzesQuery.isFetching} onClick={() => goToPage(1)}><ChevronsRight className="size-4" /></Button>
              <Button type="button" size="icon-sm" variant="outline" disabled={page <= 1 || quizzesQuery.isFetching} onClick={() => goToPage(page - 1)}><ChevronRight className="size-4" /></Button>
              {paginationItems(page, totalPages).map((item) => typeof item === 'number' ? <Button key={item} type="button" size="sm" variant={item === page ? 'default' : 'outline'} className="min-w-9 px-3" disabled={quizzesQuery.isFetching} onClick={() => goToPage(item)}>{item}</Button> : <span key={item} className="px-2 text-sm text-muted-foreground">…</span>)}
              <Button type="button" size="icon-sm" variant="outline" disabled={page >= totalPages || quizzesQuery.isFetching} onClick={() => goToPage(page + 1)}><ChevronLeft className="size-4" /></Button>
              <Button type="button" size="icon-sm" variant="outline" disabled={page >= totalPages || quizzesQuery.isFetching} onClick={() => goToPage(totalPages)}><ChevronsLeft className="size-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
