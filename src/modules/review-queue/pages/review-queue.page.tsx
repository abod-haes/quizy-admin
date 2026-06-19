import { AlertTriangle, CheckCircle2, FileQuestion, ImagePlus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui'

const reviewItems = [
  {
    title: 'أسئلة بدون إجابة مؤكدة',
    description: 'راجع الأسئلة المستوردة التي لا تحتوي isCorrect مؤكد قبل نشر الاختبار.',
    icon: AlertTriangle,
  },
  {
    title: 'أسئلة تحتاج ملف',
    description: 'أي سؤال يعتمد على صورة أو مخطط يجب ربطه بـ fileIds من Resource select.',
    icon: ImagePlus,
  },
  {
    title: 'ربط دروس ناقص',
    description: 'تأكد أن lessonIds مرسلة كـ IDs داخلية وأن الطالب يرى اسم الدرس فقط.',
    icon: FileQuestion,
  },
]

export default function ReviewQueuePage() {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" color="primary" className="rounded-full px-3">Review</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">المراجعة</h1>
            <p className="text-base leading-7 text-muted-foreground">
              مكان واحد لمراجعة الأسئلة والملفات والربط قبل نشر الاختبارات للطلاب.
            </p>
          </div>
          <Button asChild>
            <Link to={APP_ROUTES.questions.path}><CheckCircle2 className="size-4" />فتح بنك الأسئلة</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {reviewItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="rounded-3xl">
              <CardHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription className="leading-7">{item.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
