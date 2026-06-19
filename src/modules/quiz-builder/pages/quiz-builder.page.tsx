import { FileQuestion, Layers3, LibraryBig, Plus, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'

const builderSteps = [
  {
    title: 'بيانات الاختبار',
    description: 'حدد المدرس، الوقت، المجانية، والجهات المرتبطة قبل بناء الأسئلة.',
    icon: FileQuestion,
  },
  {
    title: 'ربط الدروس',
    description: 'كل سؤال لازم يرسل lessonIds كقيم ID داخلية من select، والواجهة تعرض أسماء الدروس فقط.',
    icon: Layers3,
  },
  {
    title: 'بنك الأسئلة',
    description: 'استخدم بنك الأسئلة للمراجعة، ثم اربط الأسئلة والخيارات داخل الفورم المتخصص.',
    icon: LibraryBig,
  },
]

export default function QuizBuilderPage() {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" color="primary" className="rounded-full px-3">Quiz Builder</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">بناء الاختبارات</h1>
            <p className="text-base leading-7 text-muted-foreground">
              صفحة مخصصة لبناء الاختبار بدل CRUD العادي، لأن الاختبار يحتاج أسئلة، إجابات، ملفات، وربط دروس بشكل آمن.
            </p>
          </div>
          <Button asChild>
            <Link to={APP_ROUTES.quizzes.path}><Plus className="size-4" />فتح الاختبارات</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {builderSteps.map((step) => {
          const Icon = step.icon
          return (
            <Card key={step.title} className="rounded-3xl">
              <CardHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription className="leading-7">{step.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>الخطوة القادمة</CardTitle>
          <CardDescription>
            الفورم المتخصص سيستخدم custom selects لكل teacherId / lessonIds / entityIds، ويخفي كل IDs عن المستخدم ويبعثها فقط للـ API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={APP_ROUTES.questions.path}><UploadCloud className="size-4" />فتح بنك الأسئلة</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
