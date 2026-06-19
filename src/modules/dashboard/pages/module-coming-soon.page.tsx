import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRightLeft, DatabaseZap, FileJson2, PlugZap, ShieldCheck } from 'lucide-react'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'

const routeToModuleKey: Record<string, string> = {
  [APP_ROUTES.quizBuilder.path]: 'quizBuilder',
  [APP_ROUTES.quizzes.path]: 'quizzes',
  [APP_ROUTES.lessons.path]: 'lessons',
  [APP_ROUTES.units.path]: 'units',
  [APP_ROUTES.teachers.path]: 'teachers',
  [APP_ROUTES.students.path]: 'students',
  [APP_ROUTES.reviewQueue.path]: 'reviewQueue',
  [APP_ROUTES.settings.path]: 'settings',
}

export default function ModuleComingSoonPage() {
  const { pathname } = useLocation()
  const { t } = useTranslation('dashboard')
  const moduleKey = routeToModuleKey[pathname] ?? 'quizzes'

  const checklist = useMemo(
    () => [
      { key: 'contract', icon: FileJson2 },
      { key: 'crud', icon: DatabaseZap },
      { key: 'permissions', icon: ShieldCheck },
      { key: 'integration', icon: PlugZap },
    ],
    []
  )

  return (
    <section className="w-full space-y-6">
      <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <Badge variant="outline" color="primary" className="mb-4 rounded-full px-3">
          {t('module.status')}
        </Badge>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t(`module.pages.${moduleKey}.title`)}
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            {t(`module.pages.${moduleKey}.description`)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {checklist.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.key} className="rounded-3xl shadow-sm">
              <CardHeader>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="pt-2">{t(`module.checklist.${item.key}.title`)}</CardTitle>
                <CardDescription>{t(`module.checklist.${item.key}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>{t('module.next.title')}</CardTitle>
          <CardDescription>{t('module.next.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex items-start gap-3 rounded-2xl border border-border/80 bg-background p-4">
              <ArrowRightLeft className="mt-0.5 size-4 text-primary" />
              <p className="text-sm leading-6 text-muted-foreground">{t(`module.next.items.${index}`)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}
