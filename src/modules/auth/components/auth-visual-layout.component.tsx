import type { PropsWithChildren, ReactNode } from 'react'
import { GraduationCap, LockKeyhole } from 'lucide-react'

import { cn } from '@/lib/utils'

type AuthVisualLayoutProps = PropsWithChildren<{
  title: string
  description: string
  footer?: ReactNode
  className?: string
}>

export function AuthVisualLayout({
  title,
  description,
  footer,
  className,
  children,
}: AuthVisualLayoutProps) {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f7fc] px-4 py-10 text-slate-950 sm:px-6"
      dir="rtl"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#6949ff]/10 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-violet-300/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6949ff]/20 to-transparent" />
      </div>

      <div className={cn('relative w-full max-w-[440px]', className)}>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6949ff] text-white shadow-lg shadow-[#6949ff]/20">
            <GraduationCap className="size-7" strokeWidth={2.1} />
          </div>
          <p className="text-sm font-extrabold tracking-tight text-[#6949ff]">Quizy Admin</p>
        </div>

        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_rgba(44,35,90,0.08)] sm:p-7">
          <header className="mb-7 text-center">
            <h1 className="text-2xl font-extrabold leading-relaxed text-slate-950 sm:text-[28px]">
              {title}
            </h1>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-7 text-slate-500">
              {description}
            </p>
          </header>

          {children}

          {footer ? (
            <div className="mt-6 border-t border-slate-100 pt-5 text-center">{footer}</div>
          ) : null}
        </section>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
          <LockKeyhole className="size-3.5" />
          <span>لوحة إدارة Quizy • جلسة دخول آمنة</span>
        </div>
      </div>
    </main>
  )
}
