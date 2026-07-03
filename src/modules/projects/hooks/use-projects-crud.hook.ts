import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/lib/toast'

import { i18n } from '@/app/i18n'
import { projectsListQueryOptions, projectsDetailQueryOptions, projectsQueryKeys } from '@/modules/projects/queries/projects.query'
import { addProjectsMedia, createProjects, removeProjects, removeProjectsMedia, reorderProjects, replaceProjects, updateProjects } from '@/modules/projects/services/projects.services'
import type { ProjectsCreatePayload, ProjectsUpdatePayload } from '@/modules/projects/types/projects.type'
import type { AdminListFilters, AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'

export function useProjectsList(filters: AdminListFilters = {}, pagination: AdminListPagination = {}) {
  return useQuery(projectsListQueryOptions(filters, pagination))
}

export function useProjectsById(identifier: string, enabled = true) {
  return useQuery({
    ...projectsDetailQueryOptions(identifier),
    enabled: Boolean(identifier) && enabled,
  })
}

export function useProjectsCrudMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: projectsQueryKeys.all,
    })

  const createMutation = useMutation({
    mutationFn: (payload: ProjectsCreatePayload) => createProjects(payload),
    onSuccess: () => {
      toast.success(i18n.t('common.actions.createSuccess', { ns: 'translation', defaultValue: 'Added successfully' }))
      invalidate()
    },
    onError: () => {
      toast.error(i18n.t('common.actions.createError', { ns: 'translation', defaultValue: 'Add failed' }))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { identifier: string | number; data: ProjectsUpdatePayload }) =>
      updateProjects(payload.identifier, payload.data),
    onSuccess: () => {
      toast.success(i18n.t('common.actions.updateSuccess', { ns: 'translation', defaultValue: 'Updated successfully' }))
      invalidate()
    },
    onError: () => {
      toast.error(i18n.t('common.actions.updateError', { ns: 'translation', defaultValue: 'Update failed' }))
    },
  })

  const replaceMutation = useMutation({
    mutationFn: (payload: { identifier: string | number; data: ProjectsUpdatePayload }) =>
      replaceProjects(payload.identifier, payload.data),
    onSuccess: () => {
      toast.success(i18n.t('common.actions.updateSuccess', { ns: 'translation', defaultValue: 'Updated successfully' }))
      invalidate()
    },
    onError: () => {
      toast.error(i18n.t('common.actions.updateError', { ns: 'translation', defaultValue: 'Update failed' }))
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string | number) => removeProjects(id),
    onSuccess: () => {
      toast.success(i18n.t('common.actions.deleteSuccess', { ns: 'translation', defaultValue: 'Deleted successfully' }))
      invalidate()
    },
    onError: () => {
      toast.error(i18n.t('common.actions.deleteError', { ns: 'translation', defaultValue: 'Delete failed' }))
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: Array<{ id: number; sort_order: number }>) => reorderProjects(items),
    onSuccess: invalidate,
  })

  const addMediaMutation = useMutation({
    mutationFn: (payload: { identifier: string | number; file: File; collection: string; name: string }) =>
      addProjectsMedia(payload.identifier, {
        file: payload.file,
        collection: payload.collection,
        name: payload.name,
      }),
    onSuccess: invalidate,
  })

  const removeMediaMutation = useMutation({
    mutationFn: (payload: { identifier: string | number; mediaId: string | number }) =>
      removeProjectsMedia(payload.identifier, payload.mediaId),
    onSuccess: invalidate,
  })

  return {
    createMutation,
    updateMutation,
    replaceMutation,
    removeMutation,
    reorderMutation,
    addMediaMutation,
    removeMediaMutation,
  }
}
