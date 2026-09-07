import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { type PropsWithChildren, useState } from 'react'

import { getApiErrorMessage } from '@/core/api/api-error.type'
import { toast } from '@/shared/lib/toast'

const createQueryClient = () =>
  new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Write actions may surface a global fallback when the feature does not
        // already provide contextual feedback. Read/query failures stay inline
        // and never interrupt the user with a toast.
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
