import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Activity,
  BookOpenCheck,
  BrainCircuit,
  FileQuestion,
  GraduationCap,
  Plus,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/shared/ui'
import {
  DashboardAccuracyRing,
  DashboardDistributionChart,
  DashboardTrendChart,
} from '../components/dashboard-charts'
import { getDashboardOverview } from '../dashboard.service'

type Metric = {
  label: string
  value: string
  hint: string
  icon: LucideIcon
}

function formatNumber(value: number | undefined) {
  if (value == null) return '—'
  return new Intl.NumberFormat().format(value)
}

function MetricCard({ metric, loading }: { metric: Metric; loading: boolean }) {
  const Icon = metric.icon
  return (
    <Card className="rounded-3xl border-border/80 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          {loading ? <Skeleton className="h-9 w-24 rounded-xl" /> : <p className="text-3xl font-bold tracking-tight tabular-nums">{metric.value}</p>}
          <p className="text-xs leading-5 text-muted-foreground">{metric.hint}</p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation('dashboard')
  const query = useQuery({
    queryKey: ['dashboard', 'overview', 30],
    queryFn: () => getDashboardOverview(30),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  })

  const data = query.data
  const summary = data?.summary
  const performance = data?.performance
  const locale = i18n.language.startsWith('ar') ? 'ar-SY' : 'en-US'

  const metrics: Metric[] = [
    {
      label: t('metrics.students.label'),
      value: formatNumber(summary?.studentsCount),
      hint: t('metrics.students.hint'),
      icon: Users,
    },
    {
      label: t('metrics.quizzes.label'),
      value: formatNumber(summary?.quizzesCount),
      hint: t('metrics.quizzes.hint'),
      icon: FileQuestion,
    },
    {
      label: t('metrics.sessions.label'),
      value: formatNumber(performance?.quizSessionsCount),
      hint: t('metrics.sessions.hint'),
      icon: Activity,
    },
    {
      label: t('metrics.accuracy.label'),
      value: performance ? `${performance.accuracyPercentage.toFixed(1)}%` : '—',
      hint: t('metrics.accuracy.hint'),
      icon: Target,
    },
  ]

  const distribution = [
    { label: t('content.quizzes'), value: summary?.quizzesCount ?? 0 },
    { label: t('content.questions'), value: summary?.questionsCount ?? 0 },
    { label: t('content.teachers'), value: summary?.teachersCount ?? 0 },
    { label: t('content.courses'), value: summary?.coursesCount ?? 0 },
    { label: t('content.students'), value: summary?.studentsCount ?? 0 },
  ]

  return (
    <section className="w-full space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute inset-y-0 end-0 w-2/3 bg-[radial-gradient(circle_at_top,var(--quizy-glow),transparent_64%)] opacity-70" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <TrendingUp className="size-3.5" />
              {t('hero.badge')}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('hero.title')}</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">{t('hero.description')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={APP_ROUTES.quizBuilder.path} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
              <Plus className="size-4" />{t('hero.primaryAction')}
            </Link>
            <Link to={APP_ROUTES.quizzes.path} className="inline-flex h-11 items-center rounded-2xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-accent">
              {t('hero.secondaryAction')}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} loading={query.isLoading} />)}
      </div>

      {query.isError ? (
        <Card className="rounded-3xl border-destructive/20">
          <CardContent className="p-6 text-sm text-destructive">{t('errors.overview')}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>{t('charts.activity.title')}</CardTitle>
            <CardDescription>{t('charts.activity.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <Skeleton className="h-[280px] w-full rounded-2xl" />
            ) : (
              <DashboardTrendChart
                primary={data?.quizActivity ?? []}
                secondary={data?.studentGrowth ?? []}
                primaryLabel={t('charts.activity.quizActivity')}
                secondaryLabel={t('charts.activity.studentGrowth')}
                locale={locale}
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>{t('charts.accuracy.title')}</CardTitle>
            <CardDescription>{t('charts.accuracy.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {query.isLoading ? <Skeleton className="h-32 w-full rounded-2xl" /> : <DashboardAccuracyRing value={performance?.accuracyPercentage ?? 0} label={t('charts.accuracy.label')} />}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs text-muted-foreground">{t('charts.accuracy.sessions')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(performance?.quizSessionsCount)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <p className="text-xs text-muted-foreground">{t('charts.accuracy.answers')}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(performance?.answeredQuestionsCount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>{t('charts.content.title')}</CardTitle>
            <CardDescription>{t('charts.content.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {query.isLoading ? <Skeleton className="h-64 w-full rounded-2xl" /> : <DashboardDistributionChart items={distribution} />}
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>{t('quick.title')}</CardTitle>
            <CardDescription>{t('quick.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Link to={APP_ROUTES.quizzes.path} className="rounded-2xl border border-border/70 bg-background p-4 transition hover:border-primary/25 hover:bg-primary/5">
              <FileQuestion className="size-5 text-primary" />
              <p className="mt-3 font-semibold">{t('quick.quizzes')}</p>
            </Link>
            <Link to={APP_ROUTES.teachers.path} className="rounded-2xl border border-border/70 bg-background p-4 transition hover:border-primary/25 hover:bg-primary/5">
              <GraduationCap className="size-5 text-primary" />
              <p className="mt-3 font-semibold">{t('quick.teachers')}</p>
            </Link>
            <Link to={APP_ROUTES.courses.path} className="rounded-2xl border border-border/70 bg-background p-4 transition hover:border-primary/25 hover:bg-primary/5">
              <BookOpenCheck className="size-5 text-primary" />
              <p className="mt-3 font-semibold">{t('quick.courses')}</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
