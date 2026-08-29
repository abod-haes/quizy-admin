import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'

import { getApiErrorMessage } from '@/core/api/api-error.type'
import { toast } from '@/shared/lib/toast'

const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // A background refetch should not interrupt the user when usable cached data
        // is already on screen. Initial-load failures still surface globally.
        if (query.state.data !== undefined) return
        toast.error(getApiErrorMessage(error))
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Feature-specific handlers can show field-level or contextual feedback.
        // Only provide the global fallback when the mutation has no own handler.
        if (mutation.options.onError) return
        toast.error(getApiErrorMessage(error))
      },
    }),
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 1000 * 60,
      },
    },
  })

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient)

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
