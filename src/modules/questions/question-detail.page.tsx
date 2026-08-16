import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, FileQuestion, ImageIcon, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Button,
  Card,
  CardContent,
  CustomMultiSelect,
  Input,
  Label,
  ProfileUploadCard,
  Textarea,
  ToggleSwitch,
} from '@/shared/ui'

type QuestionAnswer = {
  id?: string
  title: string
  isCorrect: boolean
}

type QuestionDetail = {
  id: string
  title: string
  hint?: string | null
  description?: string | null
  quizIds?: string[]
  lessonIds?: string[]
  answers?: QuestionAnswer[]
  fileIds?: string[]
  createdAt?: string | null
  updatedAt?: string | null
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
  quizIds: string[]
  lessonIds: string[]
  answers: Array<{ title: string; isCorrect: boolean }>
}

type RelationOption = {
  id: string
  name?: string | null
  title?: string | null
}

type QuestionResource = {
  id: string
  entityId?: string | null
  role?: string | null
  kind?: string | null
  originalName?: string | null
  mimeType?: string | null
  url?: string | null
  thumbnailUrl?: string | null
  contentUrl?: string | null
  isImage?: boolean | null
}

function optionLabel(option: RelationOption) {
  return option.name?.trim() || option.title?.trim() || option.id
}

function toForm(detail: QuestionDetail): QuestionForm {
  return {
    title: detail.title ?? '',
    hint: detail.hint ?? '',
    description: detail.description ?? '',
    quizIds: Array.isArray(detail.quizIds) ? detail.quizIds : [],
    lessonIds: Array.isArray(detail.lessonIds) ? detail.lessonIds : [],
    answers: Array.isArray(detail.answers)
      ? detail.answers.map((answer) => ({
          id: answer.id,
          title: answer.title ?? '',
          isCorrect: answer.isCorrect === true,
        }))
      : [],
  }
}

function questionImageFormData(questionId: string, file: File) {
  const formData = new FormData()
  formData.append('entityId', questionId)
  formData.append('isImage', 'true')
  formData.append('role', 'QUESTION_MEDIA')
  formData.append('kind', 'IMAGE')
  formData.append('visibility', 'PUBLIC')
  formData.append('file', file)
  return formData
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale)
}

export default function QuestionDetailPage() {
  const { t, i18n } = useTranslation('admin-pages')
  const navigate = useNavigate()
  const { questionId = '' } = useParams<{ questionId: string }>()
  const queryClient = useQueryClient()
  const isRtl = i18n.dir() === 'rtl'
  const [form, setForm] = useState<QuestionForm | null>(null)
  const [hydratedId, setHydratedId] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: ['questions-management', 'detail', questionId],
    queryFn: () => api.get<QuestionDetail>(API_ENDPOINTS.questions.detail(questionId)),
    enabled: Boolean(questionId),
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

  const resourcesQuery = useQuery({
    queryKey: ['questions-management', 'resources', questionId],
    queryFn: () =>
      api.get<PagedResponse<QuestionResource>>(API_ENDPOINTS.resources.byEntity(questionId), {
        params: { Page: 1, PerPage: 50 },
      }),
    enabled: Boolean(questionId),
  })

  useEffect(() => {
    const detail = detailQuery.data
    if (!detail?.id || hydratedId === detail.id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(toForm(detail))
    setHydratedId(detail.id)
  }, [detailQuery.data, hydratedId])

  const quizOptions = useMemo(
    () => (quizzesQuery.data ?? []).map((item) => ({ value: item.id, label: optionLabel(item) })),
    [quizzesQuery.data],
  )
  const lessonOptions = useMemo(
    () => (lessonsQuery.data ?? []).map((item) => ({ value: item.id, label: optionLabel(item) })),
    [lessonsQuery.data],
  )

  const currentImage = useMemo(() => {
    const resources = resourcesQuery.data?.items ?? []
    return (
      resources.find((resource) => resource.role === 'QUESTION_MEDIA' && (resource.isImage || resource.kind === 'IMAGE')) ??
      resources.find((resource) => resource.isImage || resource.kind === 'IMAGE') ??
      null
    )
  }, [resourcesQuery.data?.items])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error('Question form is not ready')
      const payload: QuestionPayload = {
        title: form.title.trim(),
        hint: form.hint.trim() || undefined,
        description: form.description.trim() || undefined,
        quizIds: form.quizIds,
        lessonIds: form.lessonIds,
        answers: form.answers
          .map((answer) => ({ title: answer.title.trim(), isCorrect: answer.isCorrect }))
          .filter((answer) => answer.title.length > 0),
      }
      return api.patch<QuestionDetail, QuestionPayload>(API_ENDPOINTS.questions.update(questionId), payload)
    },
    onSuccess: async (detail) => {
      setForm(toForm(detail))
      setHydratedId(detail.id)
      toast.success(t('questions.updated'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions-management'] }),
        queryClient.invalidateQueries({ queryKey: ['questions-management', 'detail', questionId] }),
      ])
    },
    onError: () => toast.error(t('questions.saveError')),
  })

  const imageMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = questionImageFormData(questionId, file)
      return currentImage?.id
        ? api.put<QuestionResource, FormData>(API_ENDPOINTS.resources.updateFile(currentImage.id), formData)
        : api.upload<QuestionResource>(API_ENDPOINTS.resources.upload, formData)
    },
    onSuccess: async () => {
      toast.success(t('questions.imageUploaded'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions-management', 'resources', questionId] }),
        queryClient.invalidateQueries({ queryKey: ['questions-management', 'detail', questionId] }),
      ])
    },
    onError: () => toast.error(t('questions.imageUploadError')),
  })

  const removeImageMutation = useMutation({
    mutationFn: (resourceId: string) => api.delete(API_ENDPOINTS.resources.remove(resourceId)),
    onSuccess: async () => {
      toast.success(t('questions.imageRemoved'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions-management', 'resources', questionId] }),
        queryClient.invalidateQueries({ queryKey: ['questions-management', 'detail', questionId] }),
      ])
    },
    onError: () => toast.error(t('questions.imageRemoveError')),
  })

  const addAnswer = () => setForm((current) => current ? ({
    ...current,
    answers: [...current.answers, { title: '', isCorrect: false }],
  }) : current)

  const updateAnswer = (index: number, patch: Partial<QuestionAnswer>) => setForm((current) => current ? ({
    ...current,
    answers: current.answers.map((answer, answerIndex) => answerIndex === index ? { ...answer, ...patch } : answer),
  }) : current)

  const removeAnswer = (index: number) => setForm((current) => current ? ({
    ...current,
    answers: current.answers.filter((_, answerIndex) => answerIndex !== index),
  }) : current)

  const backButton = (
    <Button type="button" variant="ghost" size="sm" className="-ms-2" onClick={() => navigate('/questions')}>
      {isRtl ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
      {t('questions.backToQuestions')}
    </Button>
  )

  if (detailQuery.isLoading || (!form && !detailQuery.isError)) {
    return (
      <section className="space-y-5">
        {backButton}
        <Card className="rounded-3xl">
          <CardContent className="flex min-h-64 items-center justify-center gap-3 p-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>{t('questions.loading')}</span>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!questionId || detailQuery.isError || !form) {
    return (
      <section className="space-y-5">
        {backButton}
        <Card className="rounded-3xl border-destructive/20">
          <CardContent className="space-y-4 p-6">
            <h1 className="text-xl font-bold">{t('questions.loadError')}</h1>
            <p className="text-sm text-muted-foreground">{t('questions.loadErrorDescription')}</p>
            <Button type="button" variant="outline" onClick={() => void detailQuery.refetch()}>{t('common.refresh')}</Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  const previewSrc = currentImage?.thumbnailUrl || currentImage?.url || currentImage?.contentUrl || undefined
  const imageBusy = imageMutation.isPending || removeImageMutation.isPending
  const canSave = Boolean(form.title.trim()) && !saveMutation.isPending

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-primary/10 bg-card p-5 shadow-sm">
        {backButton}
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileQuestion className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{t('questions.editTitle')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t('questions.detailDescription')}</p>
            </div>
          </div>
          <Button disabled={!canSave} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.75fr)]">
        <div className="space-y-5">
          <Card className="rounded-3xl">
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{t('questions.question')}</Label>
                <Input value={form.title} onChange={(event) => setForm((current) => current ? ({ ...current, title: event.target.value }) : current)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t('questions.hint')}</Label>
                <Input value={form.hint} onChange={(event) => setForm((current) => current ? ({ ...current, hint: event.target.value }) : current)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t('questions.descriptionField')}</Label>
                <Textarea value={form.description} onChange={(event) => setForm((current) => current ? ({ ...current, description: event.target.value }) : current)} />
              </div>
              <div className="space-y-2">
                <Label>{t('questions.linkedQuizzes')}</Label>
                <CustomMultiSelect value={form.quizIds} options={quizOptions} placeholder={t('questions.selectQuizzes')} onValueChange={(quizIds) => setForm((current) => current ? ({ ...current, quizIds }) : current)} />
              </div>
              <div className="space-y-2">
                <Label>{t('questions.linkedLessons')}</Label>
                <CustomMultiSelect value={form.lessonIds} options={lessonOptions} placeholder={t('questions.selectLessons')} onValueChange={(lessonIds) => setForm((current) => current ? ({ ...current, lessonIds }) : current)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">{t('questions.answers')}</h2>
                  <p className="text-sm text-muted-foreground">{t('questions.answersDescription')}</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addAnswer}><Plus className="size-4" />{t('questions.addAnswer')}</Button>
              </div>
              {form.answers.length === 0 ? <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">{t('questions.noAnswers')}</p> : null}
              {form.answers.map((answer, index) => (
                <div key={answer.id ?? `new-${index}`} className="grid gap-3 rounded-2xl border border-border/70 p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <Input value={answer.title} placeholder={t('questions.answerPlaceholder')} onChange={(event) => updateAnswer(index, { title: event.target.value })} />
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <span>{t('questions.correct')}</span>
                    <ToggleSwitch checked={answer.isCorrect} onCheckedChange={(isCorrect) => updateAnswer(index, { isCorrect })} />
                  </label>
                  <Button type="button" size="icon-sm" variant="outline" className="text-destructive" onClick={() => removeAnswer(index)}><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <div>
            <ProfileUploadCard
              title={t('questions.imageTitle')}
              description={t('questions.imageDescription')}
              recommendation={t('questions.imageHint')}
              uploadLabel={currentImage ? t('questions.replaceImage') : t('questions.uploadImage')}
              value={currentImage?.originalName ?? undefined}
              previewSrc={previewSrc}
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={imageBusy}
              onFileSelect={(file) => { if (file) imageMutation.mutate(file) }}
            />
            {currentImage ? (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full text-destructive"
                disabled={imageBusy}
                onClick={() => removeImageMutation.mutate(currentImage.id)}
              >
                {removeImageMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                {t('questions.removeImage')}
              </Button>
            ) : null}
          </div>

          <Card className="rounded-3xl">
            <CardContent className="space-y-3 p-5 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('questions.questionId')}</p>
                <p className="mt-1 break-all font-medium" dir="ltr">{detailQuery.data?.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('questions.createdAt')}</p>
                <p className="mt-1 font-medium">{formatDate(detailQuery.data?.createdAt, i18n.language)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('questions.updatedAt')}</p>
                <p className="mt-1 font-medium">{formatDate(detailQuery.data?.updatedAt, i18n.language)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
