import { Languages, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'

import { Badge, Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui'

const settingsSections = [
  {
    title: 'الحساب',
    description: 'تحديث بيانات المستخدم الحالي وربطه لاحقًا مع /api/Auth/profile.',
    icon: UserRound,
  },
  {
    title: 'الأمان',
    description: 'تغيير كلمة المرور من /api/Auth/password/change مع validation واضح.',
    icon: LockKeyhole,
  },
  {
    title: 'اللغة والاتجاه',
    description: 'العربية RTL والإنجليزية LTR مع إرسال Accept-Language لكل طلب API.',
    icon: Languages,
  },
]

export default function SettingsPage() {
  return (
    <section className="w-full space-y-6">
      <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl space-y-3">
          <Badge variant="outline" color="primary" className="rounded-full px-3">Settings</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">الإعدادات</h1>
          <p className="text-base leading-7 text-muted-foreground">
            إعدادات الحساب، الأمان، اللغة، وتجهيزات لوحة التحكم.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="rounded-3xl">
              <CardHeader>
                <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription className="leading-7">{section.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-3xl border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <CardTitle>جاهزة للتوسيع</CardTitle>
          <CardDescription>
            الصفحة مربوطة الآن كمسار فعلي، والخطوة القادمة إضافة profile form وchange password form من Auth endpoints.
          </CardDescription>
        </CardHeader>
      </Card>
    </section>
  )
}
