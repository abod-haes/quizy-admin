import { ThemeProvider } from 'next-themes'
import { type PropsWithChildren } from 'react'

import { AuthProvider } from '@/app/providers/auth.provider'
import { QueryProvider } from '@/app/providers/query.provider'
import { Toaster } from '@/shared/ui'

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="app:theme">
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
