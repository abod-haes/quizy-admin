import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileQuestion,
  GraduationCap,
  Layers3,
  Rocket,
  Sparkles,
  UploadCloud,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/shared/ui'

type MetricTone = 'primary' | 'blue' | 'emerald' | 'amber'

type DashboardNumbers = {
  quizzes: number | null
  questions: number | null
  teachers: number | null
  students: number | null
  courses: number | null
}

type CountKey = keyof DashboardNumbers

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
      <Icon className="size-5" />
    </span>
  )
}

function getNumberFromStats(stats: unknown, keys: string[]): number | null {
  if (!stats || typeof stats !== 'object') return null
  const source = stats as Record<string, unknown>

  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  }

  return null
}

async function fetchCount(endpoint: string): Promise<number | null> {
  try {
    const response = await api.get<PagedResponse<unknown>>(endpoint, { params: { Page: 1, PerPage: 1 } })
    return typeof response.totalCount === 'number' ? response.totalCount : null
  } catch {
    return null
  }
}

async function fetchDashboardNumbers(): Promise<DashboardNumbers> {
  const [statsResult, quizzesCount, questionsCount, teachersCount, studentsCount, coursesCount] = await Promise.all([
    api.get<unknown>(API_ENDPOINTS.statistics.list).catch(() => null),
    fetchCount(API_ENDPOINTS.quizzes.list),
    fetchCount(API_ENDPOINTS.questions.list),
    fetchCount(API_ENDPOINTS.teachers.list),
    fetchCount(API_ENDPOINTS.students.list),
    fetchCount(API_ENDPOINTS.courses.list),
  ])

  return {
    quizzes: getNumberFromStats(statsResult, ['quizzesCount', 'quizCount', 'quizesCount', 'totalQuizzes', 'quizzes', 'quizes']) ?? quizzesCount,
    questions: getNumberFromStats(statsResult, ['questionsCount', 'questionCount', 'totalQuestions', 'questions']) ?? questionsCount,
    teachers: getNumberFromStats(statsResult, ['teachersCount', 'teacherCount', 'totalTeachers', 'teachers']) ?? teachersCount,
    students: getNumberFromStats(statsResult, ['studentsCount', 'studentCount', 'totalStudents', 'students']) ?? studentsCount,
    courses: getNumberFromStats(statsResult, ['coursesCount', 'courseCount', 'totalCourses', 'courses']) ?? coursesCount,
  }
}

function formatMetric(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat().format(value)
}

export default function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'statistics'],
    queryFn: fetchDashboardNumbers,
    staleTime: 1000 * 60,
  })

  const stats = dashboardQuery.data

  const metrics: Array<{
    key: CountKey
    value: string
    icon: LucideIcon
    tone: MetricTone
  }> = [
    { key: 'quizzes', value: formatMetric(stats?.quizzes ?? null), icon: FileQuestion, tone: 'primary' },
    { key: 'questions', value: formatMetric(stats?.questions ?? null), icon: BrainCircuit, tone: 'blue' },
    { key: 'teachers', value: formatMetric(stats?.teachers ?? null), icon: GraduationCap, tone: 'emerald' },
    { key: 'courses', value: formatMetric(stats?.courses ?? null), icon: BookOpenCheck, tone: 'amber' },
  ]

  const workflows: Array<{ key: string; icon: LucideIcon; to: string }> = [
    { key: 'pdfToJson', icon: UploadCloud, to: APP_ROUTES.quizBuilder.path },
    { key: 'quizLibrary', icon: BookOpenCheck, to: APP_ROUTES.quizzes.path },
    { key: 'lessonMap', icon: Layers3, to: APP_ROUTES.lessons.path },
  ]

  const timeline: Array<{ key: string; icon: LucideIcon }> = [
    { key: 'extractLessons', icon: UploadCloud },
    { key: 'confirmMappings', icon: CheckCircle2 },
    { key: 'publishQuiz', icon: Rocket },
  ]

  return (
    <section className="w-full space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <div className="absolute inset-y-0 end-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,var(--quizy-glow),transparent_62%)] opacity-80 lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_23rem] lg:items-center">
          <div className="max-w-3xl space-y-5">
            <Badge variant="outline" color="primary" className="h-7 rounded-full px-3">
              <Sparkles className="size-3.5" />
              {t('hero.badge')}
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t('hero.title')}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {t('hero.description')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to={APP_ROUTES.quizBuilder.path}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                {t('hero.primaryAction')}
              </Link>
              <Link
                to={APP_ROUTES.quizzes.path}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-accent"
              >
                {t('hero.secondaryAction')}
              </Link>
            </div>
          </div>

          <Card className="rounded-[1.5rem] border-primary/10 bg-background/80 backdrop-blur">
            <CardHeader>
              <CardTitle>{t('quality.title')}</CardTitle>
              <CardDescription>{t('quality.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-3">
                  <CheckCircle2 className="mt-0.5 size-5 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">{t(`quality.items.${index}`)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.key} className="rounded-3xl border-border/80 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 pt-1">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">{t(`metrics.${metric.key}.label`)}</p>
                  {dashboardQuery.isLoading ? <Skeleton className="h-9 w-20 rounded-xl" /> : <p className="text-3xl font-bold tracking-tight">{metric.value}</p>}
                  <Badge variant="outline" color={metric.tone}>
                    {t(`metrics.${metric.key}.hint`)}
                  </Badge>
                </div>
                <IconTile icon={Icon} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>{t('workflows.title')}</CardTitle>
            <CardDescription>{t('workflows.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {workflows.map((workflow) => (
              <Link
                key={workflow.key}
                to={workflow.to}
                className="rounded-3xl border border-border/80 bg-background p-4 transition hover:bg-accent/35"
              >
                <IconTile icon={workflow.icon} />
                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold text-foreground">
                    {t(`workflows.items.${workflow.key}.title`)}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(`workflows.items.${workflow.key}.description`)}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>{t('timeline.title')}</CardTitle>
            <CardDescription>{t('timeline.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {timeline.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.key} className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 border-b border-border/70 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{t(`timeline.items.${item.key}.title`)}</p>
                      <Badge variant="outline" color={index === 0 ? 'primary' : 'slate'}>
                        {t(`timeline.items.${item.key}.status`)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {t(`timeline.items.${item.key}.description`)}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>{t('dynamic.title')}</CardTitle>
          <CardDescription>{t('dynamic.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {['apiContracts', 'entityBuilder', 'courseManagement', 'analytics'].map((item) => (
            <div key={item} className="rounded-2xl border border-border/80 bg-background p-4">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <Clock3 className="size-4" />
                <span className="text-sm font-semibold">{t(`dynamic.items.${item}.label`)}</span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{t(`dynamic.items.${item}.description`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
