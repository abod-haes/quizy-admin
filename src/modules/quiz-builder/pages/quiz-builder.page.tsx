import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  FileQuestion,
  Layers3,
  ListPlus,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  Wand2,
} from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CustomMultiSelect,
  CustomSelect,
  Input,
  Label,
  Textarea,
} from '@/shared/ui'

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

const emptyQuestion = (order = 1): QuizQuestionPayload => ({
  title: '',
  hint: '',
  description: '',
  lessonIds: [],
  answers: [emptyAnswer(), emptyAnswer()],
  order,
  fileIds: [],
})

const emptyQuiz = (): QuizDraft => ({
  teacherId: '',
  timeExpiration: 0,
  isFree: true,
  entityIds: [],
  questions: [emptyQuestion(1)],
})

const optionLabel = (option: LookupOption): string => {
  const fullName = [option.firstName, option.lastName].filter(Boolean).join(' ').trim()
  return option.name || option.title || fullName || option.description || option.url || '-'
}

const toSelectOptions = (items: LookupOption[] = []) =>
  items
    .filter((item) => typeof item.id === 'string' && item.id.trim())
    .map((item) => ({ value: item.id, label: optionLabel(item) }))

const normalizeQuizBody = (value: unknown): QuizPayload | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Partial<QuizPayload>

  return {
    teacherId: typeof record.teacherId === 'string' ? record.teacherId : '',
    timeExpiration: Number(record.timeExpiration ?? 0),
    isFree: Boolean(record.isFree),
    entityIds: Array.isArray(record.entityIds)
      ? record.entityIds.filter((item): item is string => typeof item === 'string')
      : [],
    questions: Array.isArray(record.questions)
      ? record.questions.map((question, questionIndex) => {
          const questionRecord = question as Partial<QuizQuestionPayload>
          return {
            title: typeof questionRecord.title === 'string' ? questionRecord.title : '',
            hint: typeof questionRecord.hint === 'string' ? questionRecord.hint : '',
            description:
              typeof questionRecord.description === 'string' ? questionRecord.description : '',
            lessonIds: Array.isArray(questionRecord.lessonIds)
              ? questionRecord.lessonIds.filter((item): item is string => typeof item === 'string')
              : [],
            answers: Array.isArray(questionRecord.answers)
              ? questionRecord.answers.map((answer) => {
                  const answerRecord = answer as Partial<QuizAnswerPayload>
                  return {
                    title: typeof answerRecord.title === 'string' ? answerRecord.title : '',
                    isCorrect: Boolean(answerRecord.isCorrect),
                  }
                })
              : [],
            order: Number(questionRecord.order ?? questionIndex + 1),
            fileIds: Array.isArray(questionRecord.fileIds)
              ? questionRecord.fileIds.filter((item): item is string => typeof item === 'string')
              : [],
          }
        })
      : [],
  }
}

const extractQuizBodiesFromJson = (value: unknown): QuizPayload[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeQuizBody).filter((item): item is QuizPayload => Boolean(item))
  }

  if (value && typeof value === 'object' && 'quizzes' in value) {
    const quizzes = (value as { quizzes?: unknown }).quizzes
    if (Array.isArray(quizzes)) {
      return quizzes.map(normalizeQuizBody).filter((item): item is QuizPayload => Boolean(item))
    }
  }

  const body = normalizeQuizBody(value)
  return body ? [body] : []
}

const validateQuizBodies = (bodies: QuizPayload[]): ValidationResult => {
  const errors: string[] = []

  if (bodies.length === 0) {
    errors.push('أدخل اختبار واحد على الأقل.')
  }

  bodies.forEach((quiz, quizIndex) => {
    const quizLabel = bodies.length > 1 ? `الاختبار ${quizIndex + 1}` : 'الاختبار'

    if (!quiz.teacherId) errors.push(`${quizLabel}: اختر المدرس.`)
    if (!Number.isFinite(quiz.timeExpiration) || quiz.timeExpiration < 0) {
      errors.push(`${quizLabel}: وقت الاختبار يجب أن يكون 0 أو أكبر.`)
    }
    if (!Array.isArray(quiz.entityIds)) errors.push(`${quizLabel}: entityIds يجب أن تكون Array.`)
    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      errors.push(`${quizLabel}: أضف سؤالًا واحدًا على الأقل.`)
      return
    }

    quiz.questions.forEach((question, questionIndex) => {
      const questionLabel = `${quizLabel} - السؤال ${questionIndex + 1}`
      if (!question.title.trim()) errors.push(`${questionLabel}: نص السؤال مطلوب.`)
      if (!Array.isArray(question.lessonIds) || question.lessonIds.length === 0) {
        errors.push(`${questionLabel}: اختر درسًا واحدًا على الأقل.`)
      }
      if (!Array.isArray(question.answers) || question.answers.length < 2) {
        errors.push(`${questionLabel}: أضف خيارين على الأقل.`)
        return
      }
      if (!question.answers.some((answer) => answer.isCorrect)) {
        errors.push(`${questionLabel}: اختر إجابة صحيحة واحدة على الأقل.`)
      }

      question.answers.forEach((answer, answerIndex) => {
        if (!answer.title.trim()) {
          errors.push(`${questionLabel} - الخيار ${answerIndex + 1}: نص الخيار مطلوب.`)
        }
      })
    })
  })

  return { ok: errors.length === 0, errors, bodies }
}

const parseJsonText = (jsonText: string): ValidationResult => {
  try {
    const parsed = JSON.parse(jsonText)
    return validateQuizBodies(extractQuizBodiesFromJson(parsed))
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

export default function QuizBuilderPage() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<BuilderMode>('form')
  const [quizDraft, setQuizDraft] = useState<QuizDraft>(() => emptyQuiz())
  const [jsonText, setJsonText] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  const teachersQuery = useQuery({
    queryKey: ['quiz-builder', 'teachers-brief'],
    queryFn: () => api.get<LookupOption[]>(API_ENDPOINTS.teachers.brief),
    staleTime: 1000 * 60 * 5,
  })

  const lessonsQuery = useQuery({
    queryKey: ['quiz-builder', 'lessons-brief'],
    queryFn: () => api.get<LookupOption[]>(API_ENDPOINTS.lessons.brief),
    staleTime: 1000 * 60 * 5,
  })

  const entitiesQuery = useQuery({
    queryKey: ['quiz-builder', 'classes-brief'],
    queryFn: () => api.get<LookupOption[]>(API_ENDPOINTS.classes.brief),
    staleTime: 1000 * 60 * 5,
  })

  const resourcesQuery = useQuery({
    queryKey: ['quiz-builder', 'resources'],
    queryFn: async () => {
      const response = await api.get<PagedResponse<LookupOption>>(API_ENDPOINTS.resources.list, {
        params: { Page: 1, PerPage: 1000 },
      })
      return response.items ?? []
    },
    staleTime: 1000 * 60 * 5,
  })

  const teacherOptions = useMemo(() => toSelectOptions(teachersQuery.data), [teachersQuery.data])
  const lessonOptions = useMemo(() => toSelectOptions(lessonsQuery.data), [lessonsQuery.data])
  const entityOptions = useMemo(() => toSelectOptions(entitiesQuery.data), [entitiesQuery.data])
  const resourceOptions = useMemo(() => toSelectOptions(resourcesQuery.data), [resourcesQuery.data])

  const formValidation = useMemo(() => validateQuizBodies([quizDraft]), [quizDraft])
  const formPreview = useMemo(() => JSON.stringify(quizDraft, null, 2), [quizDraft])

  const saveMutation = useMutation({
    mutationFn: async (bodies: QuizPayload[]) => {
      const results: unknown[] = []
      for (const body of bodies) {
        results.push(await api.post<unknown, QuizPayload>(API_ENDPOINTS.quizzes.create, body))
      }
      return results
    },
    onSuccess: async (_, bodies) => {
      toast.success(bodies.length > 1 ? 'تم حفظ الاختبارات بنجاح' : 'تم حفظ الاختبار بنجاح')
      setValidation(null)
      if (mode === 'form') setQuizDraft(emptyQuiz())
      await queryClient.invalidateQueries({ queryKey: ['content-crud', 'quizzes'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const updateQuizField = <TKey extends keyof QuizDraft>(key: TKey, value: QuizDraft[TKey]) => {
    setQuizDraft((current) => ({ ...current, [key]: value }))
  }

  const updateQuestion = (questionIndex: number, nextQuestion: QuizQuestionPayload) => {
    setQuizDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex ? nextQuestion : question
      ),
    }))
  }

  const addQuestion = () => {
    setQuizDraft((current) => ({
      ...current,
      questions: [...current.questions, emptyQuestion(current.questions.length + 1)],
    }))
  }

  const removeQuestion = (questionIndex: number) => {
    setQuizDraft((current) => ({
      ...current,
      questions: current.questions
        .filter((_, index) => index !== questionIndex)
        .map((question, index) => ({ ...question, order: index + 1 })),
    }))
  }

  const updateAnswer = (
    questionIndex: number,
    answerIndex: number,
    nextAnswer: QuizAnswerPayload
  ) => {
    const question = quizDraft.questions[questionIndex]
    if (!question) return
    updateQuestion(questionIndex, {
      ...question,
      answers: question.answers.map((answer, index) =>
        index === answerIndex ? nextAnswer : answer
      ),
    })
  }

  const addAnswer = (questionIndex: number) => {
    const question = quizDraft.questions[questionIndex]
    if (!question) return
    updateQuestion(questionIndex, { ...question, answers: [...question.answers, emptyAnswer()] })
  }

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    const question = quizDraft.questions[questionIndex]
    if (!question) return
    updateQuestion(questionIndex, {
      ...question,
      answers: question.answers.filter((_, index) => index !== answerIndex),
    })
  }

  const setOnlyCorrectAnswer = (questionIndex: number, answerIndex: number) => {
    const question = quizDraft.questions[questionIndex]
    if (!question) return
    updateQuestion(questionIndex, {
      ...question,
      answers: question.answers.map((answer, index) => ({
        ...answer,
        isCorrect: index === answerIndex,
      })),
    })
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
  }

  return (
    <section className="flex min-h-0 w-full flex-col gap-6 overflow-hidden">
      <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" color="primary" className="rounded-full px-3">
              Quiz Builder
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">إضافة اختبار</h1>
            <p className="text-base leading-7 text-muted-foreground">
              أنشئ اختبارًا من فورم منظم أو الصق JSON جاهز. الواجهة تعرض أسماء المدرسين والدروس والملفات، وترسل الـ IDs للـ API داخليًا فقط.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={reloadLookups}>
              <RefreshCcw className="size-4" /> تحديث القوائم
            </Button>
            <Button
              type="button"
              variant={mode === 'form' ? 'default' : 'outline'}
              onClick={() => {
                setMode('form')
                setValidation(null)
              }}
            >
              <FileQuestion className="size-4" /> فورم
            </Button>
            <Button
              type="button"
              variant={mode === 'json' ? 'default' : 'outline'}
              onClick={() => {
                setMode('json')
                setValidation(null)
              }}
            >
              <Braces className="size-4" /> JSON
            </Button>
          </div>
        </div>
      </div>

      {validation && !validation.ok ? (
        <Card className="rounded-3xl border-destructive/30 bg-destructive/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> يوجد أخطاء قبل الحفظ
            </CardTitle>
            <CardDescription>صلح الأخطاء التالية ثم أعد المحاولة.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-destructive">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {validation?.ok ? (
        <Card className="rounded-3xl border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <CardContent className="flex items-center gap-2 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-5" /> البيانات صالحة وجاهزة للإرسال.
          </CardContent>
        </Card>
      ) : null}

      {mode === 'form' ? (
        <div className="grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-h-0 space-y-6 overflow-y-auto pe-1">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>بيانات الاختبار</CardTitle>
                <CardDescription>كل الحقول المرتبطة تستخدم select وتبعت ID فقط للـ API.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>المدرس</Label>
                  <CustomSelect
                    value={quizDraft.teacherId || undefined}
                    placeholder="اختر المدرس"
                    options={teacherOptions}
                    onValueChange={(value) => updateQuizField('teacherId', String(value))}
                    disabled={teachersQuery.isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وقت الاختبار بالدقائق</Label>
                  <Input
                    type="number"
                    min={0}
                    value={quizDraft.timeExpiration}
                    onChange={(event) => updateQuizField('timeExpiration', Number(event.target.value || 0))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>الجهات / الصفوف المرتبطة</Label>
                  <CustomMultiSelect
                    value={quizDraft.entityIds}
                    placeholder="اختر الجهات"
                    options={entityOptions}
                    onValueChange={(value) => updateQuizField('entityIds', value.map(String))}
                    disabled={entitiesQuery.isLoading}
                  />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4 md:col-span-2">
                  <span>
                    <span className="block text-sm font-semibold text-foreground">اختبار مجاني</span>
                    <span className="text-xs text-muted-foreground">القيمة سترسل كـ isFree.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={quizDraft.isFree}
                    onChange={(event) => updateQuizField('isFree', event.target.checked)}
                    className="size-5 accent-primary"
                  />
                </label>
              </CardContent>
            </Card>

            {quizDraft.questions.map((question, questionIndex) => (
              <Card key={questionIndex} className="rounded-3xl shadow-sm">
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Layers3 className="size-5 text-primary" /> السؤال {questionIndex + 1}
                      </CardTitle>
                      <CardDescription>اربط السؤال بالدروس والملفات بدون عرض IDs.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeQuestion(questionIndex)}
                      disabled={quizDraft.questions.length === 1}
                    >
                      <Trash2 className="size-4" /> حذف السؤال
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>نص السؤال</Label>
                    <Textarea
                      value={question.title}
                      rows={3}
                      placeholder="اكتب السؤال هنا، ويمكن استخدام <MathLm> للرياضيات"
                      onChange={(event) => updateQuestion(questionIndex, { ...question, title: event.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>الدروس</Label>
                      <CustomMultiSelect
                        value={question.lessonIds}
                        placeholder="اختر الدروس"
                        options={lessonOptions}
                        onValueChange={(value) => updateQuestion(questionIndex, { ...question, lessonIds: value.map(String) })}
                        disabled={lessonsQuery.isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الملفات / الصور</Label>
                      <CustomMultiSelect
                        value={question.fileIds}
                        placeholder="اختر الملفات إن وجدت"
                        options={resourceOptions}
                        onValueChange={(value) => updateQuestion(questionIndex, { ...question, fileIds: value.map(String) })}
                        disabled={resourcesQuery.isLoading}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Hint</Label>
                      <Textarea
                        value={question.hint}
                        rows={2}
                        placeholder="تلميح قصير بدون إعطاء الجواب"
                        onChange={(event) => updateQuestion(questionIndex, { ...question, hint: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={question.description}
                        rows={2}
                        placeholder="وصف اختياري"
                        onChange={(event) => updateQuestion(questionIndex, { ...question, description: event.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-3xl border border-border bg-muted/20 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">الإجابات</h3>
                        <p className="text-xs text-muted-foreground">حدد إجابة صحيحة واحدة على الأقل.</p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => addAnswer(questionIndex)}>
                        <Plus className="size-4" /> إضافة خيار
                      </Button>
                    </div>
                    {question.answers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="grid gap-3 rounded-2xl border border-border bg-card p-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                        <Input
                          value={answer.title}
                          placeholder={`الخيار ${answerIndex + 1}`}
                          onChange={(event) => updateAnswer(questionIndex, answerIndex, { ...answer, title: event.target.value })}
                        />
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name={`correct-answer-${questionIndex}`}
                            checked={answer.isCorrect}
                            onChange={() => setOnlyCorrectAnswer(questionIndex, answerIndex)}
                            className="size-4 accent-primary"
                          />
                          صحيح
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeAnswer(questionIndex, answerIndex)}
                          disabled={question.answers.length <= 2}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={addQuestion}>
                <ListPlus className="size-4" /> إضافة سؤال
              </Button>
              <Button type="button" onClick={validateFormAndSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                حفظ الاختبار
              </Button>
            </div>
          </div>

          <Card className="min-h-0 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Preview JSON</CardTitle>
              <CardDescription>
                {formValidation.ok ? 'البيانات صالحة حاليًا.' : `${formValidation.errors.length} خطأ قبل الحفظ.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0">
              <pre className="max-h-[70vh] overflow-auto rounded-2xl bg-muted p-4 text-xs leading-6 text-foreground">
                {formPreview}
              </pre>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Card className="min-h-0 rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>إدخال JSON</CardTitle>
              <CardDescription>
                الصق body واحد، أو Array، أو Object يحتوي quizzes. سيتم عمل format وvalidation قبل الإرسال.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-col gap-4">
              <Textarea
                value={jsonText}
                rows={22}
                dir="ltr"
                className="min-h-[32rem] font-mono text-sm"
                placeholder={`{\n  "teacherId": "...",\n  "timeExpiration": 0,\n  "isFree": true,\n  "entityIds": [],\n  "questions": []\n}`}
                onChange={(event) => setJsonText(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={formatJson}>
                  <Wand2 className="size-4" /> Format + Validate
                </Button>
                <Button type="button" onClick={validateJsonAndSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  حفظ من JSON
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>قواعد JSON</CardTitle>
              <CardDescription>نفس شكل `/api/Quizes` المطلوب من النظام.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>كل اختبار يحتاج teacherId و questions.</p>
              <p>كل سؤال يحتاج title و lessonIds وخيارين على الأقل.</p>
              <p>كل سؤال يحتاج إجابة صحيحة واحدة على الأقل.</p>
              <p>يمكن لصق Array لإرسال أكثر من اختبار بنفس العملية.</p>
              <p>لا يتم عرض IDs للمستخدم في وضع الفورم؛ أما JSON فهو للمراجعة التقنية المباشرة.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}
