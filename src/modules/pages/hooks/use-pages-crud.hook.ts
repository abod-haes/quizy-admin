import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pagesListQueryOptions, pagesDetailQueryOptions, pagesQueryKeys } from '@/modules/pages/queries/pages.query'
import { createPages, updatePages, removePages } from '@/modules/pages/services/pages.services'
import type { PagesCreatePayload, PagesUpdatePayload } from '@/modules/pages/types/pages.type'
import type { AdminListFilters, AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'

export function usePagesList(filters: AdminListFilters = {}, pagination: AdminListPagination = {}) {
  return useQuery(pagesListQueryOptions(filters, pagination))
}

export function usePagesById(identifier: string, enabled = true) {
  return useQuery({
    ...pagesDetailQueryOptions(identifier),
    enabled: Boolean(identifier) && enabled,
  })
}

export function usePagesCrudMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: pagesQueryKeys.all,
    })

  const createMutation = useMutation({
    mutationFn: (payload: PagesCreatePayload) => createPages(payload),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { identifier: string | number; data: PagesUpdatePayload }) =>
      updatePages(payload.identifier, payload.data),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string | number) => removePages(id),
    onSuccess: invalidate,
  })

  return {
    createMutation,
    updateMutation,
    removeMutation,
  }
}
