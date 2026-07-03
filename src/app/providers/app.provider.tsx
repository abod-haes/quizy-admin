import { ThemeProvider } from 'next-themes'
import { type PropsWithChildren } from 'react'

import { AuthProvider } from '@/app/providers/auth.provider'
import { QueryProvider } from '@/app/providers/query.provider'
import { ToastProvider } from '@/components/ui/toast-provider'

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="app:theme">
      <QueryProvider>
        <ToastProvider position="top-right">
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
