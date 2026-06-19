import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Braces, CheckCircle2, FileQuestion, Layers3, ListPlus, Loader2, Plus, RefreshCcw, Save, Trash2, UploadCloud, Wand2 } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, CustomMultiSelect, CustomSelect, Input, Label, Skeleton, Textarea } from '@/shared/ui'

type BuilderMode = 'form' | 'json'

type LookupOption = {
  id: string
  name?: string | null
  title?: string | null
  firstName?: string | null
  lastName?: string | null
  description?: string | null
  url?: string | null
}

type ResourceUploadResponse = string | { id?: string; url?: string; isImage?: boolean }

type QuizAnswerPayload = {
  title: string
  isCorrect: boolean
}

type QuizQuestionPayload = {
  title: string
  hint: string
  description: string
  lessonIds: string[]
  answers: QuizAnswerPayload[]
  order: number
  fileIds: string[]
}

type QuizPayload = {
  teacherId: string
  timeExpiration: number
  isFree: boolean
  entityIds: string[]
  questions: QuizQuestionPayload[]
}

type QuizDraft = QuizPayload

type ValidationResult = {
  ok: boolean
  errors: string[]
  bodies: QuizPayload[]
}

const emptyAnswer = (): QuizAnswerPayload => ({ title: '', isCorrect: false })
const emptyQuestion = (order = 1): QuizQuestionPayload => ({ title: '', hint: '', description: '', lessonIds: [], answers: [emptyAnswer(), emptyAnswer()], order, fileIds: [] })
const emptyQuiz = (): QuizDraft => ({ teacherId: '', timeExpiration: 0, isFree: true, entityIds: [], questions: [emptyQuestion(1)] })

const optionLabel = (option: LookupOption): string => {
  const fullName = [option.firstName, option.lastName].filter(Boolean).join(' ').trim()
  return option.name || option.title || fullName || option.description || option.url || '-'
}

const toSelectOptions = (items: LookupOption[] = []) =>
  items.filter((item) => typeof item.id === 'string' && item.id.trim()).map((item) => ({ value: item.id, label: optionLabel(item) }))

const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const normalizeQuizBody = (value: unknown): QuizPayload | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<QuizPayload> & { teacher?: { id?: string }, entities?: Array<{ id?: string }> }

  const questions = Array.isArray(record.questions) ? record.questions.map((question, questionIndex) => {
    const questionRecord = question as Partial<QuizQuestionPayload>
    const answers = Array.isArray(questionRecord.answers) ? questionRecord.answers.map((answer) => {
      const answerRecord = answer as Partial<QuizAnswerPayload>
      return { title: typeof answerRecord.title === 'string' ? answerRecord.title : '', isCorrect: Boolean(answerRecord.isCorrect) }
    }) : [emptyAnswer(), emptyAnswer()]

    return {
      title: typeof questionRecord.title === 'string' ? questionRecord.title : '',
      hint: typeof questionRecord.hint === 'string' ? questionRecord.hint : '',
      description: typeof questionRecord.description === 'string' ? questionRecord.description : '',
      lessonIds: stringArray(questionRecord.lessonIds),
      answers: answers.length >= 2 ? answers : [emptyAnswer(), emptyAnswer()],
      order: Number(questionRecord.order ?? questionIndex + 1),
      fileIds: stringArray(questionRecord.fileIds),
    }
  }) : [emptyQuestion(1)]

  return {
    teacherId: typeof record.teacherId === 'string' ? record.teacherId : record.teacher?.id ?? '',
    timeExpiration: Number(record.timeExpiration ?? 0),
    isFree: record.isFree !== false,
    entityIds: stringArray(record.entityIds).length ? stringArray(record.entityIds) : stringArray(record.entities?.map((item) => item.id)),
    questions,
  }
}

const extractQuizBodiesFromJson = (value: unknown): QuizPayload[] => {
  if (Array.isArray(value)) return value.map(normalizeQuizBody).filter((item): item is QuizPayload => Boolean(item))
  if (value && typeof value === 'object' && 'quizzes' in value) {
    const quizzes = (value as { quizzes?: unknown }).quizzes
    if (Array.isArray(quizzes)) return quizzes.map(normalizeQuizBody).filter((item): item is QuizPayload => Boolean(item))
  }
  const body = normalizeQuizBody(value)
  return body ? [body] : []
}

const validateQuizBodies = (bodies: QuizPayload[]): ValidationResult => {
  const errors: string[] = []
  if (bodies.length === 0) errors.push('أدخل اختبارًا واحدًا على الأقل.')
  bodies.forEach((quiz, quizIndex) => {
    const quizLabel = bodies.length > 1 ? `الاختبار ${quizIndex + 1}` : 'الاختبار'
    if (!quiz.teacherId) errors.push(`${quizLabel}: اختر المدرس.`)
    if (!Number.isFinite(quiz.timeExpiration) || quiz.timeExpiration < 0) errors.push(`${quizLabel}: مدة الاختبار يجب أن تكون 0 أو أكبر.`)
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      errors.push(`${quizLabel}: أضف سؤالًا واحدًا على الأقل.`)
      return
    }
    quiz.questions.forEach((question, questionIndex) => {
      const questionLabel = `${quizLabel} - السؤال ${questionIndex + 1}`
      if (!question.title.trim()) errors.push(`${questionLabel}: نص السؤال مطلوب.`)
      if (!Array.isArray(question.lessonIds) || question.lessonIds.length === 0) errors.push(`${questionLabel}: اختر درسًا واحدًا على الأقل.`)
      if (!Array.isArray(question.answers) || question.answers.length < 2) {
        errors.push(`${questionLabel}: أضف خيارين على الأقل.`)
        return
      }
      if (!question.answers.some((answer) => answer.isCorrect)) errors.push(`${questionLabel}: اختر إجابة صحيحة واحدة على الأقل.`)
      question.answers.forEach((answer, answerIndex) => {
        if (!answer.title.trim()) errors.push(`${questionLabel} - الخيار ${answerIndex + 1}: نص الخيار مطلوب.`)
      })
    })
  })
  return { ok: errors.length === 0, errors, bodies }
}

const parseJsonText = (jsonText: string): ValidationResult => {
  try {
    return validateQuizBodies(extractQuizBodiesFromJson(JSON.parse(jsonText)))
  } catch {
    return { ok: false, errors: ['JSON غير صالح. تأكد من الأقواس والفواصل.'], bodies: [] }
  }
}

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'تعذر حفظ الاختبار. حاول مرة ثانية.'
}

function extractResourceId(response: ResourceUploadResponse): string | null {
  if (typeof response === 'string' && response.trim()) return response
  if (response && typeof response === 'object' && typeof response.id === 'string' && response.id.trim()) return response.id
  return null
}

export default function QuizBuilderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const quizId = searchParams.get('quizId')
  const isEditMode = Boolean(quizId)
  const [mode, setMode] = useState<BuilderMode>('form')
  const [quizDraft, setQuizDraft] = useState<QuizDraft>(() => emptyQuiz())
  const [jsonText, setJsonText] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [uploadingQuestionIndex, setUploadingQuestionIndex] = useState<number | null>(null)

  const quizDetailQuery = useQuery({
    queryKey: ['quiz-builder', 'quiz-detail', quizId],
    queryFn: () => api.get<unknown>(API_ENDPOINTS.quizzes.detail(String(quizId))),
    enabled: isEditMode,
  })

  const teachersQuery = useQuery({ queryKey: ['quiz-builder', 'teachers-brief'], queryFn: () => api.get<LookupOption[]>(API_ENDPOINTS.teachers.brief), staleTime: 1000 * 60 * 5 })
  const lessonsQuery = useQuery({ queryKey: ['quiz-builder', 'lessons-brief'], queryFn: () => api.get<LookupOption[]>(API_ENDPOINTS.lessons.brief), staleTime: 1000 * 60 * 5 })
  const entitiesQuery = useQuery({ queryKey: ['quiz-builder', 'classes-brief'], queryFn: () => api.get<LookupOption[]>(API_ENDPOINTS.classes.brief), staleTime: 1000 * 60 * 5 })
  const resourcesQuery = useQuery({
    queryKey: ['quiz-builder', 'resources'],
    queryFn: async () => {
      const response = await api.get<PagedResponse<LookupOption>>(API_ENDPOINTS.resources.list, { params: { Page: 1, PerPage: 1000 } })
      return response.items ?? []
    },
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (!quizDetailQuery.data) return
    const normalized = normalizeQuizBody(quizDetailQuery.data)
    if (normalized) setQuizDraft(normalized)
  }, [quizDetailQuery.data])

  const teacherOptions = useMemo(() => toSelectOptions(teachersQuery.data), [teachersQuery.data])
  const lessonOptions = useMemo(() => toSelectOptions(lessonsQuery.data), [lessonsQuery.data])
  const entityOptions = useMemo(() => toSelectOptions(entitiesQuery.data), [entitiesQuery.data])
  const resourceOptions = useMemo(() => toSelectOptions(resourcesQuery.data), [resourcesQuery.data])

  const saveMutation = useMutation({
    mutationFn: async (bodies: QuizPayload[]) => {
      if (isEditMode && quizId) return api.put<unknown, QuizPayload>(API_ENDPOINTS.quizzes.update(quizId), bodies[0])
      const results: unknown[] = []
      for (const body of bodies) results.push(await api.post<unknown, QuizPayload>(API_ENDPOINTS.quizzes.create, body))
      return results
    },
    onSuccess: async (_, bodies) => {
      toast.success(isEditMode ? 'تم تعديل الاختبار بنجاح' : bodies.length > 1 ? 'تم حفظ الاختبارات بنجاح' : 'تم حفظ الاختبار بنجاح')
      setValidation(null)
      if (!isEditMode && mode === 'form') setQuizDraft(emptyQuiz())
      await queryClient.invalidateQueries({ queryKey: ['content-crud', 'quizzes'] })
      await queryClient.invalidateQueries({ queryKey: ['quizzes-page'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const updateQuizField = <TKey extends keyof QuizDraft>(key: TKey, value: QuizDraft[TKey]) => setQuizDraft((current) => ({ ...current, [key]: value }))
  const updateQuestion = (questionIndex: number, nextQuestion: QuizQuestionPayload) => setQuizDraft((current) => ({ ...current, questions: current.questions.map((question, index) => index === questionIndex ? nextQuestion : question) }))
  const addQuestion = () => setQuizDraft((current) => ({ ...current, questions: [...current.questions, emptyQuestion(current.questions.length + 1)] }))
  const removeQuestion = (questionIndex: number) => setQuizDraft((current) => ({ ...current, questions: current.questions.filter((_, index) => index !== questionIndex).map((question, index) => ({ ...question, order: index + 1 })) }))
  const updateAnswer = (questionIndex: number, answerIndex: number, nextAnswer: QuizAnswerPayload) => {
    const question = quizDraft.questions[questionIndex]
    if (!question) return
    updateQuestion(questionIndex, { ...question, answers: question.answers.map((answer, index) => index === answerIndex ? nextAnswer : answer) })
  }
  const addAnswer = (questionIndex: number) => {
    const question = quizDraft.questions[questionIndex]
    if (!question) return
    updateQuestion(questionIndex, { ...question, answers: [...question.answers, emptyAnswer()] })
  }
  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const question = quizDraft.questions[questionIndex]
    if (!question) return
    updateQuestion(questionIndex, { ...question, answers: question.answers.filter((_, index) => index !== answerIndex) })
  }
  const setOnlyCorrectAnswer = (questionIndex: number, answerIndex: number) => {
    const question = quizDraft.questions[questionIndex]
    if (!question) return
    updateQuestion(questionIndex, { ...question, answers: question.answers.map((answer, index) => ({ ...answer, isCorrect: index === answerIndex })) })
  }

  const uploadQuestionFile = async (questionIndex: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('isImage', String(file.type.startsWith('image/')))
    if (quizDraft.entityIds[0]) formData.append('entityId', quizDraft.entityIds[0])

    setUploadingQuestionIndex(questionIndex)
    try {
      const response = await api.upload<ResourceUploadResponse>(API_ENDPOINTS.resources.upload, formData)
      const resourceId = extractResourceId(response)
      if (!resourceId) {
        toast.error('تم رفع الملف لكن لم يرجع معرف resourceId من السيرفر.')
        return
      }

      const question = quizDraft.questions[questionIndex]
      if (!question) return
      const nextFileIds = Array.from(new Set([...question.fileIds, resourceId]))
      updateQuestion(questionIndex, { ...question, fileIds: nextFileIds })
      await resourcesQuery.refetch()
      toast.success('تم رفع الملف وربطه بالسؤال')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setUploadingQuestionIndex(null)
    }
  }

  const validateFormAndSave = () => {
    const result = validateQuizBodies([quizDraft])
    setValidation(result)
    if (!result.ok) return
    saveMutation.mutate(result.bodies)
  }
  const formatJson = () => {
    const result = parseJsonText(jsonText)
    setValidation(result)
    if (!result.ok) return
    setJsonText(JSON.stringify(result.bodies.length === 1 ? result.bodies[0] : result.bodies, null, 2))
    toast.success('تم تنسيق JSON بنجاح')
  }
  const validateJsonAndSave = () => {
    const result = parseJsonText(jsonText)
    setValidation(result)
    if (!result.ok) return
    saveMutation.mutate(result.bodies)
  }
  const reloadLookups = () => {
    teachersQuery.refetch()
    lessonsQuery.refetch()
    entitiesQuery.refetch()
    resourcesQuery.refetch()
    if (isEditMode) quizDetailQuery.refetch()
  }

  if (quizDetailQuery.isLoading) {
    return <section className="space-y-4"><Skeleton className="h-24 rounded-3xl" /><Skeleton className="h-96 rounded-3xl" /></section>
  }

  return (
    <section className="flex min-h-0 w-full flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 rounded-3xl border border-primary/10 bg-card/95 p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" color="primary" className="rounded-full px-3">بناء الاختبارات</Badge>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{isEditMode ? 'تعديل اختبار' : 'إضافة اختبار جديد'}</h1>
          </div>
          <p className="line-clamp-1 text-sm text-muted-foreground">{isEditMode ? 'عدّل بيانات الاختبار وأسئلته من نفس الفورم، ثم احفظ التغييرات.' : 'اختر المدرس والصفوف، أضف الأسئلة والخيارات، ثم احفظ الاختبار مباشرة.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={reloadLookups}><RefreshCcw className="size-4" /> تحديث القوائم</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => navigate('/quizzes')}>رجوع للاختبارات</Button>
          {!isEditMode ? <Button type="button" size="sm" variant={mode === 'form' ? 'default' : 'outline'} onClick={() => { setMode('form'); setValidation(null) }}><FileQuestion className="size-4" /> فورم</Button> : null}
          {!isEditMode ? <Button type="button" size="sm" variant={mode === 'json' ? 'default' : 'outline'} onClick={() => { setMode('json'); setValidation(null) }}><Braces className="size-4" /> JSON</Button> : null}
        </div>
      </div>

      {validation && !validation.ok ? <Card className="shrink-0 rounded-3xl border-destructive/30 bg-destructive/5 shadow-sm"><CardContent className="p-4"><div className="mb-2 flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="size-5" /> يوجد أخطاء قبل الحفظ</div><ul className="list-inside list-disc space-y-1 text-sm text-destructive">{validation.errors.map((error) => <li key={error}>{error}</li>)}</ul></CardContent></Card> : null}
      {validation?.ok ? <Card className="shrink-0 rounded-3xl border-emerald-500/30 bg-emerald-500/5 shadow-sm"><CardContent className="flex items-center gap-2 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-5" /> البيانات صالحة وجاهزة للإرسال.</CardContent></Card> : null}

      {mode === 'form' || isEditMode ? (
        <div className="min-h-0 space-y-4 overflow-y-auto pe-1">
          <Card className="rounded-3xl shadow-sm"><CardHeader className="py-4"><CardTitle>بيانات الاختبار</CardTitle><CardDescription>اختر البيانات الأساسية، والواجهة سترسل المعرفات داخليًا دون عرضها للمستخدم.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2"><Label>المدرس</Label><CustomSelect value={quizDraft.teacherId || undefined} placeholder="اختر المدرس" options={teacherOptions} onValueChange={(value) => updateQuizField('teacherId', String(value))} disabled={teachersQuery.isLoading} /></div>
            <div className="space-y-2"><Label>مدة الاختبار بالدقائق</Label><Input type="number" min={0} value={quizDraft.timeExpiration} onChange={(event) => updateQuizField('timeExpiration', Number(event.target.value || 0))} /></div>
            <label className="flex h-11 items-center justify-between gap-3 self-end rounded-2xl border border-border bg-muted/30 px-4 text-sm"><span>اختبار مجاني</span><input type="checkbox" checked={quizDraft.isFree} onChange={(event) => updateQuizField('isFree', event.target.checked)} className="size-5 accent-primary" /></label>
            <div className="space-y-2 md:col-span-2 xl:col-span-4"><Label>الصفوف المرتبطة</Label><CustomMultiSelect value={quizDraft.entityIds} placeholder="اختر الصفوف" options={entityOptions} onValueChange={(value) => updateQuizField('entityIds', value.map(String))} disabled={entitiesQuery.isLoading} /></div>
          </CardContent></Card>

          {quizDraft.questions.map((question, questionIndex) => (
            <Card key={questionIndex} className="rounded-3xl shadow-sm"><CardHeader className="py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Layers3 className="size-5 text-primary" /> السؤال {questionIndex + 1}</CardTitle><CardDescription>نص السؤال، الدروس، الصور/الملفات، والتلميحات.</CardDescription></div><Button type="button" size="sm" variant="outline" onClick={() => removeQuestion(questionIndex)} disabled={quizDraft.questions.length === 1}><Trash2 className="size-4" /> حذف</Button></div></CardHeader><CardContent className="space-y-4">
              <div className="space-y-2"><Label>نص السؤال</Label><Textarea value={question.title} rows={3} placeholder="اكتب السؤال هنا، ويمكن استخدام <MathLm> للرياضيات" onChange={(event) => updateQuestion(questionIndex, { ...question, title: event.target.value })} /></div>
              <div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2"><Label>الدروس</Label><CustomMultiSelect value={question.lessonIds} placeholder="اختر الدروس" options={lessonOptions} onValueChange={(value) => updateQuestion(questionIndex, { ...question, lessonIds: value.map(String) })} disabled={lessonsQuery.isLoading} /></div><div className="space-y-2"><Label>ملفات موجودة</Label><CustomMultiSelect value={question.fileIds} placeholder="اختر من الملفات المرفوعة" options={resourceOptions} onValueChange={(value) => updateQuestion(questionIndex, { ...question, fileIds: value.map(String) })} disabled={resourcesQuery.isLoading} /></div></div>
              <div className="rounded-3xl border border-dashed border-primary/25 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">رفع صورة أو ملف للسؤال</h3>
                    <p className="text-xs text-muted-foreground">يرفع الملف على Resources ثم يضاف الـ resourceId إلى fileIds تلقائيًا.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted">
                    {uploadingQuestionIndex === questionIndex ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                    {uploadingQuestionIndex === questionIndex ? 'جارِ الرفع...' : 'اختر ملف'}
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*,application/pdf,video/*"
                      disabled={uploadingQuestionIndex !== null}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ''
                        if (file) uploadQuestionFile(questionIndex, file)
                      }}
                    />
                  </label>
                </div>
                {question.fileIds.length ? <p className="mt-3 text-xs text-muted-foreground">عدد الملفات المرتبطة: {question.fileIds.length}</p> : null}
              </div>
              <div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2"><Label>التلميح</Label><Textarea value={question.hint} rows={2} placeholder="تلميح قصير بدون إعطاء الجواب" onChange={(event) => updateQuestion(questionIndex, { ...question, hint: event.target.value })} /></div><div className="space-y-2"><Label>الوصف</Label><Textarea value={question.description} rows={2} placeholder="وصف اختياري" onChange={(event) => updateQuestion(questionIndex, { ...question, description: event.target.value })} /></div></div>
              <div className="space-y-3 rounded-3xl border border-border bg-muted/20 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-sm font-semibold text-foreground">الإجابات</h3><p className="text-xs text-muted-foreground">حدد إجابة صحيحة واحدة على الأقل.</p></div><Button type="button" size="sm" variant="outline" onClick={() => addAnswer(questionIndex)}><Plus className="size-4" /> إضافة خيار</Button></div>{question.answers.map((answer, answerIndex) => (<div key={answerIndex} className="grid gap-3 rounded-2xl border border-border bg-card p-3 md:grid-cols-[1fr_auto_auto] md:items-center"><Input value={answer.title} placeholder={`الخيار ${answerIndex + 1}`} onChange={(event) => updateAnswer(questionIndex, answerIndex, { ...answer, title: event.target.value })} /><label className="flex items-center gap-2 text-sm text-foreground"><input type="radio" name={`correct-answer-${questionIndex}`} checked={answer.isCorrect} onChange={() => setOnlyCorrectAnswer(questionIndex, answerIndex)} className="size-4 accent-primary" /> صحيح</label><Button type="button" size="icon-sm" variant="outline" onClick={() => removeAnswer(questionIndex, answerIndex)} disabled={question.answers.length <= 2}><Trash2 className="size-4" /></Button></div>))}</div>
            </CardContent></Card>
          ))}

          <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 rounded-3xl border border-border bg-background/90 p-3 shadow-sm backdrop-blur"><Button type="button" variant="outline" onClick={addQuestion}><ListPlus className="size-4" /> إضافة سؤال</Button><Button type="button" onClick={validateFormAndSave} disabled={saveMutation.isPending || uploadingQuestionIndex !== null}>{saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{isEditMode ? 'حفظ التعديل' : 'حفظ الاختبار'}</Button></div>
        </div>
      ) : (
        <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]"><Card className="min-h-0 rounded-3xl shadow-sm"><CardHeader className="py-4"><CardTitle>إدخال JSON</CardTitle><CardDescription>الصق body واحد، أو Array، أو Object يحتوي quizzes.</CardDescription></CardHeader><CardContent className="flex min-h-0 flex-col gap-4"><Textarea value={jsonText} rows={22} dir="ltr" className="min-h-[30rem] font-mono text-sm" placeholder={`{\n  "teacherId": "...",\n  "timeExpiration": 0,\n  "isFree": true,\n  "entityIds": [],\n  "questions": []\n}`} onChange={(event) => setJsonText(event.target.value)} /><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={formatJson}><Wand2 className="size-4" /> تنسيق والتحقق</Button><Button type="button" onClick={validateJsonAndSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} حفظ من JSON</Button></div></CardContent></Card><Card className="rounded-3xl shadow-sm"><CardHeader className="py-4"><CardTitle>قواعد الإرسال</CardTitle><CardDescription>الشكل النهائي يرسل إلى `/api/Quizes`.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm leading-7 text-muted-foreground"><p>كل اختبار يحتاج مدرسًا وسؤالًا واحدًا على الأقل.</p><p>كل سؤال يحتاج نصًا، ودروسًا مرتبطة، وخيارين على الأقل.</p><p>كل سؤال يحتاج إجابة صحيحة واحدة على الأقل.</p></CardContent></Card></div>
      )}
    </section>
  )
}
