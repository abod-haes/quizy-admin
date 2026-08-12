import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Braces, FileQuestion, ListPlus, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CustomSelect,
  Input,
  Label,
  MultiSelect,
  Skeleton,
  Textarea,
  ToggleSwitch,
} from '@/shared/ui'

type OptionItem = {
  id: string
  name?: string | null
  title?: string | null
  firstName?: string | null
  lastName?: string | null
}

type ResourceOption = {
  id: string
  originalName?: string | null
  filePath?: string | null
  url?: string | null
}

type RawQuiz = Record<string, unknown>

type QuizAnswerPayload = {
  title: string
  isCorrect: boolean
}

type QuizQuestionPayload = {
  id?: string
  title: string
  hint?: string
  lessonIds?: string[]
  fileIds?: string[]
  answers: QuizAnswerPayload[]
  lessonNames?: string[]
}

type QuizPayload = {
  title?: string
  subjectId: string
  teacherId: string
  isFree: boolean
  timeExpiration: number
  entityIds?: string[]
  questions: QuizQuestionPayload[]
}

type BuilderMode = 'visual' | 'json'
type EntityOption = { value: string; label: string }

const RESOURCE_PAGE_SIZE = 100

function valueLabel(item: OptionItem) {
  return (
    item.name?.trim() ||
    item.title?.trim() ||
    [item.firstName, item.lastName].filter(Boolean).join(' ').trim() ||
    item.id
  )
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function booleanValue(value: unknown) {
  return value === true
}

function numberValue(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
}

function objectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
}

function normalizeQuizBody(raw: RawQuiz): QuizPayload {
  const linkedIds = objectArray(raw.linkedQuiz)
    .map((item) => stringValue(item.entityId))
    .filter(Boolean)
  const rawQuestions = objectArray(raw.questions)

  return {
    title: stringValue(raw.title),
    subjectId: stringValue(raw.subjectId),
    teacherId: stringValue(raw.teacherId),
    isFree: booleanValue(raw.isFree),
    timeExpiration: Math.max(1, Math.trunc(numberValue(raw.timeExpiration, 30))),
    entityIds: stringArray(raw.entityIds).length ? stringArray(raw.entityIds) : linkedIds,
    questions: rawQuestions.map((question) => {
      const files = objectArray(question.files)
        .map((item) => stringValue(item.id))
        .filter(Boolean)
      const explicitLessonIds = stringArray(question.lessonIds)
      const lessonNames = stringArray(question.lessonNames)
      const answers = objectArray(question.answers).map((answer, index) => ({
        title: stringValue(answer.title) || `Answer ${index + 1}`,
        isCorrect: booleanValue(answer.isCorrect),
      }))

      return {
        ...(stringValue(question.id) ? { id: stringValue(question.id) } : {}),
        title: stringValue(question.title),
        hint: stringValue(question.hint),
        ...(explicitLessonIds.length ? { lessonIds: explicitLessonIds } : {}),
        fileIds: stringArray(question.fileIds).length ? stringArray(question.fileIds) : files,
        lessonNames,
        answers,
      }
    }),
  }
}

function emptyQuestion(answerLabel: (index: number) => string): QuizQuestionPayload {
  return {
    title: '',
    hint: '',
    lessonIds: [],
    fileIds: [],
    answers: [
      { title: answerLabel(1), isCorrect: true },
      { title: answerLabel(2), isCorrect: false },
    ],
  }
}

function emptyQuiz(answerLabel: (index: number) => string): QuizPayload {
  return {
    title: '',
    subjectId: '',
    teacherId: '',
    isFree: true,
    timeExpiration: 30,
    entityIds: [],
    questions: [emptyQuestion(answerLabel)],
  }
}

function payloadForRequest(payload: QuizPayload): QuizPayload {
  return {
    title: payload.title?.trim() || undefined,
    subjectId: payload.subjectId,
    teacherId: payload.teacherId,
    isFree: payload.isFree,
    timeExpiration: Math.trunc(payload.timeExpiration),
    entityIds: payload.entityIds ?? [],
    questions: payload.questions.map((question) => ({
      ...(question.id ? { id: question.id } : {}),
      title: question.title.trim(),
      hint: question.hint?.trim() || undefined,
      ...(question.lessonIds !== undefined ? { lessonIds: question.lessonIds } : {}),
      fileIds: question.fileIds ?? [],
      answers: question.answers.map((answer) => ({
        title: answer.title.trim(),
        isCorrect: answer.isCorrect,
      })),
    })),
  }
}

export default function QuizBuilderV2Page() {
  const { t } = useTranslation('quiz-builder')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const quizId = searchParams.get('quizId')?.trim() || ''
  const isEditing = Boolean(quizId)
  const answerLabel = (index: number) => t('answers.default', { index })

  const [mode, setMode] = useState<BuilderMode>('visual')
  const [payload, setPayload] = useState<QuizPayload>(() => emptyQuiz(answerLabel))
  const [jsonValue, setJsonValue] = useState(() => JSON.stringify(emptyQuiz(answerLabel), null, 2))
  const [jsonError, setJsonError] = useState('')

  const subjectsQuery = useQuery({
    queryKey: ['quiz-builder', 'subjects'],
    queryFn: () => api.get<OptionItem[]>(API_ENDPOINTS.subjects.brief),
    staleTime: 5 * 60 * 1000,
  })
  const unitsQuery = useQuery({
    queryKey: ['quiz-builder', 'units'],
    queryFn: () => api.get<OptionItem[]>(API_ENDPOINTS.units.brief),
    staleTime: 5 * 60 * 1000,
  })
  const lessonsQuery = useQuery({
    queryKey: ['quiz-builder', 'lessons'],
    queryFn: () => api.get<OptionItem[]>(API_ENDPOINTS.lessons.brief),
    staleTime: 5 * 60 * 1000,
  })
  const teachersQuery = useQuery({
    queryKey: ['quiz-builder', 'teachers'],
    queryFn: () => api.get<OptionItem[]>(API_ENDPOINTS.teachers.brief),
    staleTime: 5 * 60 * 1000,
  })
  const resourcesQuery = useQuery({
    queryKey: ['quiz-builder', 'resources'],
    queryFn: () =>
      api.get<PagedResponse<ResourceOption>>(API_ENDPOINTS.resources.list, {
        params: { Page: 1, PerPage: RESOURCE_PAGE_SIZE },
      }),
    staleTime: 5 * 60 * 1000,
  })
  const detailQuery = useQuery({
    queryKey: ['quiz-builder', 'detail', quizId],
    queryFn: () => api.get<RawQuiz>(API_ENDPOINTS.quizzes.detail(quizId)),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!detailQuery.data) return
    const normalized = normalizeQuizBody(detailQuery.data)
    setPayload(normalized)
    setJsonValue(JSON.stringify(payloadForRequest(normalized), null, 2))
    setJsonError('')
  }, [detailQuery.data])

  const subjectOptions = (subjectsQuery.data ?? []).map((item) => ({ value: item.id, label: valueLabel(item) }))
  const teacherOptions = (teachersQuery.data ?? []).map((item) => ({ value: item.id, label: valueLabel(item) }))
  const lessonOptions = (lessonsQuery.data ?? []).map((item) => ({ value: item.id, label: valueLabel(item) }))
  const resourceOptions = (resourcesQuery.data?.items ?? []).map((item) => ({
    value: item.id,
    label: item.originalName?.trim() || item.filePath?.split('/').pop() || item.id,
  }))

  const entityOptions = useMemo<EntityOption[]>(() => {
    const subjects = (subjectsQuery.data ?? []).map((item) => ({
      value: item.id,
      label: `${t('entityTypes.subject')}: ${valueLabel(item)}`,
    }))
    const units = (unitsQuery.data ?? []).map((item) => ({
      value: item.id,
      label: `${t('entityTypes.unit')}: ${valueLabel(item)}`,
    }))
    const lessons = (lessonsQuery.data ?? []).map((item) => ({
      value: item.id,
      label: `${t('entityTypes.lesson')}: ${valueLabel(item)}`,
    }))
    return [...subjects, ...units, ...lessons]
  }, [subjectsQuery.data, unitsQuery.data, lessonsQuery.data, t])

  const validate = (candidate: QuizPayload) => {
    if (!candidate.title?.trim()) return t('validation.titleRequired')
    if (!candidate.subjectId) return t('validation.subjectRequired')
    if (!candidate.teacherId) return t('validation.teacherRequired')
    if (!Number.isInteger(candidate.timeExpiration) || candidate.timeExpiration < 1) {
      return t('validation.timeExpiration')
    }
    for (const question of candidate.questions) {
      if (!question.title.trim()) return t('validation.questionRequired')
      if (!question.id && (!question.lessonIds || question.lessonIds.length === 0)) {
        return t('validation.lessonRequired')
      }
      if (question.answers.length < 2) return t('validation.answersRequired')
      if (question.answers.some((answer) => !answer.title.trim())) return t('validation.answerRequired')
      if (!question.answers.some((answer) => answer.isCorrect)) return t('validation.correctAnswerRequired')
    }
    return null
  }

  const readJson = (): QuizPayload | null => {
    try {
      const parsed = normalizeQuizBody(JSON.parse(jsonValue) as RawQuiz)
      const error = validate(parsed)
      if (error) {
        setJsonError(error)
        return null
      }
      setJsonError('')
      return parsed
    } catch {
      setJsonError(t('validation.jsonInvalid'))
      return null
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const source = mode === 'json' ? readJson() : payload
      if (!source) throw new Error(t('validation.jsonInvalid'))
      const validation = validate(source)
      if (validation) throw new Error(validation)
      const request = payloadForRequest(source)
      return isEditing
        ? api.patch<RawQuiz, QuizPayload>(API_ENDPOINTS.quizzes.update(quizId), request)
        : api.post<RawQuiz, QuizPayload>(API_ENDPOINTS.quizzes.create, request)
    },
    onSuccess: async (result) => {
      toast.success(t(isEditing ? 'messages.updated' : 'messages.created'))
      await queryClient.invalidateQueries({ queryKey: ['quizzes-page'] })
      const savedId = stringValue(result.id) || quizId
      navigate(savedId ? `/quiz-builder?quizId=${encodeURIComponent(savedId)}` : '/quizzes', { replace: true })
    },
    onError: (error) => {
      const message = error instanceof Error && error.message ? error.message : t('validation.saveFailed')
      toast.error(message)
    },
  })

  const updateQuestion = (index: number, patch: Partial<QuizQuestionPayload>) => {
    setPayload((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    }))
  }

  const updateAnswer = (questionIndex: number, answerIndex: number, patch: Partial<QuizAnswerPayload>) => {
    setPayload((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) =>
        currentQuestionIndex === questionIndex
          ? {
              ...question,
              answers: question.answers.map((answer, currentAnswerIndex) =>
                currentAnswerIndex === answerIndex ? { ...answer, ...patch } : answer,
              ),
            }
          : question,
      ),
    }))
  }

  const switchMode = (nextMode: BuilderMode) => {
    if (nextMode === mode) return
    if (nextMode === 'json') {
      setJsonValue(JSON.stringify(payloadForRequest(payload), null, 2))
      setJsonError('')
      setMode('json')
      return
    }
    const parsed = readJson()
    if (!parsed) return
    setPayload(parsed)
    setMode('visual')
  }

  const loading = isEditing && detailQuery.isLoading
  if (loading) {
    return <section className="space-y-4"><Skeleton className="h-32 rounded-3xl" /><Skeleton className="h-96 rounded-3xl" /></section>
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileQuestion className="size-6" /></div>
          <div>
            <Button variant="ghost" size="sm" className="-ms-2 mb-1" onClick={() => navigate('/quizzes')}>{t('back')}</Button>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t(isEditing ? 'editDescription' : 'createDescription')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={mode === 'visual' ? 'default' : 'outline'} onClick={() => switchMode('visual')}><ListPlus className="size-4" />{t('actions.visualMode')}</Button>
          <Button variant={mode === 'json' ? 'default' : 'outline'} onClick={() => switchMode('json')}><Braces className="size-4" />{t('actions.jsonMode')}</Button>
          <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}><Save className="size-4" />{saveMutation.isPending ? t('actions.saving') : t('actions.save')}</Button>
        </div>
      </div>

      {detailQuery.isError ? (
        <Card className="rounded-3xl border-destructive/30"><CardContent className="p-6 text-destructive">{t('validation.loadFailed')}</CardContent></Card>
      ) : mode === 'json' ? (
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>{t('json.title')}</CardTitle><CardDescription>{t('json.description')}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Textarea className="min-h-[32rem] font-mono text-xs" value={jsonValue} onChange={(event) => setJsonValue(event.target.value)} />
            {jsonError ? <p className="text-sm text-destructive">{jsonError}</p> : null}
            <div className="flex justify-end"><Button variant="outline" onClick={() => { try { setJsonValue(JSON.stringify(JSON.parse(jsonValue), null, 2)); setJsonError('') } catch { setJsonError(t('validation.jsonInvalid')) } }}>{t('actions.formatJson')}</Button></div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-3xl">
            <CardHeader><CardTitle>{t('title')}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>{t('fields.quizTitle')}</Label><Input value={payload.title ?? ''} placeholder={t('placeholders.quizTitle')} onChange={(event) => setPayload((current) => ({ ...current, title: event.target.value }))} /></div>
              <div className="space-y-2"><Label>{t('fields.subject')}</Label><CustomSelect value={payload.subjectId || undefined} options={subjectOptions} placeholder={t('placeholders.subject')} onValueChange={(value) => setPayload((current) => ({ ...current, subjectId: String(value) }))} /></div>
              <div className="space-y-2"><Label>{t('fields.teacher')}</Label><CustomSelect value={payload.teacherId || undefined} options={teacherOptions} placeholder={t('placeholders.teacher')} onValueChange={(value) => setPayload((current) => ({ ...current, teacherId: String(value) }))} /></div>
              <div className="space-y-2"><Label>{t('fields.timeExpiration')}</Label><Input type="number" min={1} step={1} value={payload.timeExpiration} onChange={(event) => setPayload((current) => ({ ...current, timeExpiration: Number(event.target.value) }))} /></div>
              <div className="flex items-end"><div className="flex h-11 w-full items-center justify-between rounded-2xl border border-border px-4"><Label>{t('fields.isFree')}</Label><ToggleSwitch checked={payload.isFree} onCheckedChange={(checked) => setPayload((current) => ({ ...current, isFree: checked }))} /></div></div>
              <div className="space-y-2 md:col-span-2"><Label>{t('fields.linkedContent')}</Label><MultiSelect values={payload.entityIds ?? []} options={entityOptions} placeholder={t('placeholders.linkedContent')} onValuesChange={(values) => setPayload((current) => ({ ...current, entityIds: values }))} /></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="flex-row items-center justify-between"><div><CardTitle>{t('questions.title')}</CardTitle><CardDescription>{t('questions.count', { count: payload.questions.length })}</CardDescription></div><Button onClick={() => setPayload((current) => ({ ...current, questions: [...current.questions, emptyQuestion(answerLabel)] }))}><Plus className="size-4" />{t('actions.addQuestion')}</Button></CardHeader>
            <CardContent className="space-y-5">
              {payload.questions.map((question, questionIndex) => (
                <div key={question.id ?? `new-${questionIndex}`} className="space-y-4 rounded-3xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge variant="outline" color="primary">{t('questions.item', { index: questionIndex + 1 })}</Badge>{question.id ? <span className="text-xs text-muted-foreground">{question.id}</span> : null}</div><Button size="sm" variant="outline" className="text-destructive" disabled={payload.questions.length <= 1} onClick={() => setPayload((current) => ({ ...current, questions: current.questions.filter((_, index) => index !== questionIndex) }))}><Trash2 className="size-4" />{t('actions.removeQuestion')}</Button></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2"><Label>{t('fields.question')}</Label><Textarea value={question.title} placeholder={t('placeholders.question')} onChange={(event) => updateQuestion(questionIndex, { title: event.target.value })} /></div>
                    <div className="space-y-2 md:col-span-2"><Label>{t('fields.hint')}</Label><Input value={question.hint ?? ''} placeholder={t('placeholders.hint')} onChange={(event) => updateQuestion(questionIndex, { hint: event.target.value })} /></div>
                    <div className="space-y-2"><Label>{t('fields.lessons')}</Label><MultiSelect values={question.lessonIds ?? []} options={lessonOptions} placeholder={t('placeholders.lessons')} onValuesChange={(values) => updateQuestion(questionIndex, { lessonIds: values })} />{question.lessonIds === undefined && question.lessonNames?.length ? <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground"><p>{t('questions.existingLessons', { names: question.lessonNames.join(', ') })}</p><p className="mt-1">{t('questions.existingLessonsHint')}</p></div> : null}</div>
                    <div className="space-y-2"><Label>{t('fields.files')}</Label><MultiSelect values={question.fileIds ?? []} options={resourceOptions} placeholder={t('placeholders.files')} onValuesChange={(values) => updateQuestion(questionIndex, { fileIds: values })} /></div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between"><Label>{t('fields.answers')}</Label><Button size="sm" variant="outline" onClick={() => updateQuestion(questionIndex, { answers: [...question.answers, { title: answerLabel(question.answers.length + 1), isCorrect: false }] })}><Plus className="size-4" />{t('actions.addAnswer')}</Button></div>
                    {question.answers.map((answer, answerIndex) => (
                      <div key={`${questionIndex}-${answerIndex}`} className="grid gap-3 rounded-2xl border border-border p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                        <Input value={answer.title} placeholder={t('placeholders.answer')} onChange={(event) => updateAnswer(questionIndex, answerIndex, { title: event.target.value })} />
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={answer.isCorrect} onChange={(event) => updateAnswer(questionIndex, answerIndex, { isCorrect: event.target.checked })} />{t('fields.correct')}</label>
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={question.answers.length <= 2} onClick={() => updateQuestion(questionIndex, { answers: question.answers.filter((_, index) => index !== answerIndex) })}>{t('actions.removeAnswer')}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}
