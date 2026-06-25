import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui'

type AuthPageShellProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthPageShell({ title, description, children, footer }: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-md rounded-md border border-border bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="font-[var(--font-sans)] text-2xl font-semibold">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {children}
          {footer ? <div className="border-t border-border pt-4">{footer}</div> : null}
        </CardContent>
      </Card>
    </main>
  )
}
