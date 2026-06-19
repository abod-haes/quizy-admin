import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { faqsListQueryOptions, faqsDetailQueryOptions, faqsQueryKeys } from '@/modules/faqs/queries/faqs.query'
import { createFaqs, updateFaqs, removeFaqs } from '@/modules/faqs/services/faqs.services'
import type { FaqsCreatePayload, FaqsUpdatePayload } from '@/modules/faqs/types/faqs.type'
import type { AdminListFilters, AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'

export function useFaqsList(filters: AdminListFilters = {}, pagination: AdminListPagination = {}) {
  return useQuery(faqsListQueryOptions(filters, pagination))
}

export function useFaqsById(identifier: string, enabled = true) {
  return useQuery({
    ...faqsDetailQueryOptions(identifier),
    enabled: Boolean(identifier) && enabled,
  })
}

export function useFaqsCrudMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: faqsQueryKeys.all,
    })

  const createMutation = useMutation({
    mutationFn: (payload: FaqsCreatePayload) => createFaqs(payload),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { identifier: string | number; data: FaqsUpdatePayload }) =>
      updateFaqs(payload.identifier, payload.data),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string | number) => removeFaqs(id),
    onSuccess: invalidate,
  })

  return {
    createMutation,
    updateMutation,
    removeMutation,
  }
}
