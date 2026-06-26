import type { PropsWithChildren, ReactNode } from 'react'
import { BookOpen, CheckCircle2, GraduationCap, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

const highlights = [
  'إدارة تعليمية أوضح من أول خطوة',
  'دخول برقم الهاتف مثل تطبيق Quizy',
  'تجربة عربية ودودة وسريعة',
]

type QuizyAuthLayoutProps = PropsWithChildren<{
  title: string
  description: string
  eyebrow?: string
  footer?: ReactNode
  className?: string
}>

export function QuizyAuthLayout({
  title,
  description,
  eyebrow = 'Quizy Admin',
  footer,
  className,
  children,
}: QuizyAuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f4ff] text-slate-950" dir="rtl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#6949ff]/25 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#a78bfa]/25 blur-3xl" />
      </div>

      <section className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="hidden min-h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#6949ff] via-[#7c3aed] to-[#24135f] p-8 text-white lg:flex">
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="size-4" />
              لوحة Quizy التعليمية
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 shadow-2xl backdrop-blur">
              <GraduationCap className="size-6" />
            </div>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 items-center justify-center py-10">
            <div className="relative w-full">
              <div className="absolute -inset-8 rounded-[3rem] bg-white/10 blur-2xl" />
              <img
                src="/auth-quizy.png"
                alt="Quizy auth illustration"
                className="relative mx-auto max-h-[520px] w-full object-contain drop-shadow-[0_30px_70px_rgba(15,23,42,0.35)]"
              />
            </div>
          </div>

          <div className="relative z-10 space-y-5">
            <div className="max-w-xl space-y-3">
              <p className="text-sm font-semibold text-white/70">تجربة دخول جديدة</p>
              <h2 className="text-3xl font-bold leading-relaxed">كل أدوات Quizy تبدأ من حساب آمن وواضح.</h2>
              <p className="text-sm leading-7 text-white/75">
                صممنا واجهة الدخول لتشبه روح التطبيق: بسيطة، عربية، ودودة، ومناسبة لإدارة المحتوى التعليمي بسرعة.
              </p>
            </div>

            <div className="grid gap-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
                  <CheckCircle2 className="size-5 text-emerald-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className={cn('w-full max-w-[480px]', className)}>
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#6949ff] text-white shadow-2xl shadow-[#6949ff]/30">
                <BookOpen className="size-8" />
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_rgba(80,62,160,0.18)] backdrop-blur sm:p-7">
              <div className="mb-6 space-y-2 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#6949ff]">{eyebrow}</p>
                <h1 className="text-2xl font-bold leading-relaxed text-slate-950 sm:text-3xl">{title}</h1>
                <p className="mx-auto max-w-sm text-sm leading-7 text-slate-500">{description}</p>
              </div>

              {children}

              {footer ? <div className="mt-6 border-t border-slate-100 pt-5">{footer}</div> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
