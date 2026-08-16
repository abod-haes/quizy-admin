import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileQuestion, Loader2, Pencil, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Button,
  Card,
  CardContent,
  CustomMultiSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PaginatedDataTable,
  Textarea,
  ToggleSwitch,
} from '@/shared/ui'

type QuestionRow = {
  id: string
  title: string
  hint?: string | null
  description?: string | null
  answersCount?: number | null
  quizzesCount?: number | null
}

type QuestionAnswer = {
  id?: string
  title: string
  isCorrect: boolean
}

type QuestionDetail = QuestionRow & {
  quizIds: string[]
  lessonIds: string[]
  answers: QuestionAnswer[]
}

type RelationOption = {
  id: string
  name?: string | null
  title?: string | null
}

type QuestionForm = {
  title: string
  hint: string
  description: string
  quizIds: string[]
  lessonIds: string[]
  answers: QuestionAnswer[]
}

type QuestionPayload = {
  title: string
  hint?: string
  description?: string
  quizIds?: string[]
  lessonIds?: string[]
  answers?: QuestionAnswer[]
}

const PAGE_SIZE = 20
const EMPTY_FORM: QuestionForm = {
  title: '',
  hint: '',
  description: '',
  quizIds: [],
  lessonIds: [],
  answers: [],
}

function optionLabel(option: RelationOption) {
  return option.name?.trim() || option.title?.trim() || option.id
}

export default function QuestionsManagementPage() {
  const { t } = useTranslation('admin-pages')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<QuestionForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<QuestionRow | null>(null)

  const questionsQuery = useQuery({
    queryKey: ['questions-management', page, search.trim()],
    queryFn: () =>
      api.get<PagedResponse<QuestionRow>>(API_ENDPOINTS.questions.list, {
        params: { page, perPage: PAGE_SIZE, ...(search.trim() ? { search: search.trim() } : {}) },
      }),
  })

  const quizzesQuery = useQuery({
    queryKey: ['questions-management', 'quizzes'],
    queryFn: () => api.get<RelationOption[]>(API_ENDPOINTS.quizzes.brief),
    staleTime: 5 * 60 * 1000,
  })

  const lessonsQuery = useQuery({
    queryKey: ['questions-management', 'lessons'],
    queryFn: () => api.get<RelationOption[]>(API_ENDPOINTS.lessons.brief),
    staleTime: 5 * 60 * 1000,
  })

  const quizOptions = useMemo(
    () => (quizzesQuery.data ?? []).map((item) => ({ value: item.id, label: optionLabel(item) })),
    [quizzesQuery.data],
  )
  const lessonOptions = useMemo(
    () => (lessonsQuery.data ?? []).map((item) => ({ value: item.id, label: optionLabel(item) })),
    [lessonsQuery.data],
  )

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (question: QuestionRow) => {
    navigate(`/questions/${question.id}`)
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: QuestionPayload = {
        title: form.title.trim(),
        hint: form.hint.trim() || undefined,
        description: form.description.trim() || undefined,
        quizIds: form.quizIds,
        lessonIds: form.lessonIds,
        answers: form.answers
          .map((answer) => ({ ...answer, title: answer.title.trim() }))
          .filter((answer) => answer.title.length > 0),
      }
      return editingId
        ? api.patch<QuestionDetail, QuestionPayload>(API_ENDPOINTS.questions.update(editingId), payload)
        : api.post<QuestionDetail, QuestionPayload>(API_ENDPOINTS.questions.create, payload)
    },
    onSuccess: async () => {
      toast.success(t(editingId ? 'questions.updated' : 'questions.created'))
      closeForm()
      await queryClient.invalidateQueries({ queryKey: ['questions-management'] })
    },
    onError: () => toast.error(t('questions.saveError')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(API_ENDPOINTS.questions.remove(id)),
    onSuccess: async () => {
      toast.success(t('questions.deleted'))
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['questions-management'] })
    },
    onError: () => toast.error(t('questions.deleteError')),
  })

  const addAnswer = () => setForm((current) => ({
    ...current,
    answers: [...current.answers, { title: '', isCorrect: false }],
  }))

  const updateAnswer = (index: number, patch: Partial<QuestionAnswer>) => setForm((current) => ({
    ...current,
    answers: current.answers.map((answer, answerIndex) => answerIndex === index ? { ...answer, ...patch } : answer),
  }))

  const removeAnswer = (index: number) => setForm((current) => ({
    ...current,
    answers: current.answers.filter((_, answerIndex) => answerIndex !== index),
  }))

  const rows = questionsQuery.data?.items ?? []
  const totalCount = questionsQuery.data?.totalCount ?? 0
  const pageSize = questionsQuery.data?.pageSize ?? PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const canSave = Boolean(form.title.trim()) && !saveMutation.isPending

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <FileQuestion className="size-5 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('questions.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('questions.description')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={questionsQuery.isFetching} onClick={() => void questionsQuery.refetch()}>
            <RefreshCcw className="size-4" />{t('common.refresh')}
          </Button>
          <Button onClick={openCreate}><Plus className="size-4" />{t('questions.add')}</Button>
        </div>
      </div>

      <label className="relative block max-w-xl">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-10"
          value={search}
          placeholder={t('questions.searchPlaceholder')}
          onChange={(event) => { setSearch(event.target.value); setPage(1) }}
        />
      </label>

      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <PaginatedDataTable<QuestionRow>
            rows={rows}
            loading={questionsQuery.isLoading || questionsQuery.isFetching}
            getRowId={(row) => row.id}
            summaryText={t('questions.summary', { count: totalCount })}
            emptyMessage={t('questions.empty')}
            pagination={{
              currentPage: page,
              totalPages,
              pageSize,
              onPageChange: setPage,
              previousLabel: t('common.previous'),
              nextLabel: t('common.next'),
              getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }),
            }}
            columns={[
              { id: 'title', header: t('questions.question'), renderCell: (row) => <span className="font-semibold">{row.title || '-'}</span> },
              { id: 'hint', header: t('questions.hint'), renderCell: (row) => row.hint || '-' },
              { id: 'answers', header: t('questions.answersCount'), renderCell: (row) => row.answersCount ?? 0 },
              { id: 'quizzes', header: t('questions.quizzesCount'), renderCell: (row) => row.quizzesCount ?? 0 },
              {
                id: 'actions',
                header: '',
                renderCell: (row) => (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}><Pencil className="size-4" />{t('common.edit')}</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTarget(row)}><Trash2 className="size-4" />{t('common.delete')}</Button>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open && !saveMutation.isPending) closeForm() }}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t(editingId ? 'questions.editTitle' : 'questions.createTitle')}</DialogTitle>
            <DialogDescription>{t('questions.formDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{t('questions.question')}</Label>
                <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('questions.hint')}</Label>
                <Input value={form.hint} onChange={(event) => setForm((current) => ({ ...current, hint: event.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t('questions.descriptionField')}</Label>
                <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('questions.linkedQuizzes')}</Label>
                <CustomMultiSelect value={form.quizIds} options={quizOptions} placeholder={t('questions.selectQuizzes')} onValueChange={(quizIds) => setForm((current) => ({ ...current, quizIds }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('questions.linkedLessons')}</Label>
                <CustomMultiSelect value={form.lessonIds} options={lessonOptions} placeholder={t('questions.selectLessons')} onValueChange={(lessonIds) => setForm((current) => ({ ...current, lessonIds }))} />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{t('questions.answers')}</h3>
                  <p className="text-sm text-muted-foreground">{t('questions.answersDescription')}</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addAnswer}><Plus className="size-4" />{t('questions.addAnswer')}</Button>
              </div>
              {form.answers.length === 0 ? <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">{t('questions.noAnswers')}</p> : null}
              {form.answers.map((answer, index) => (
                <div key={answer.id ?? `new-${index}`} className="grid gap-3 rounded-xl border border-border/70 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <Input value={answer.title} placeholder={t('questions.answerPlaceholder')} onChange={(event) => updateAnswer(index, { title: event.target.value })} />
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <span>{t('questions.correct')}</span>
                    <ToggleSwitch checked={answer.isCorrect} onCheckedChange={(isCorrect) => updateAnswer(index, { isCorrect })} />
                  </label>
                  <Button type="button" size="icon-sm" variant="outline" className="text-destructive" onClick={() => removeAnswer(index)}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={saveMutation.isPending} onClick={closeForm}>{t('common.cancel')}</Button>
            <Button disabled={!canSave} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('questions.deleteTitle')}</DialogTitle>
            <DialogDescription>{deleteTarget ? t('questions.deleteConfirm', { name: deleteTarget.title }) : ''}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
