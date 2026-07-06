import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
  Eye,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/shared/lib/toast'

import { api } from '@/shared/api/api-client'
import type { PagedResponse, ResourceLink } from '@/shared/api/api.types'
import { academicContentConfigs } from '@/modules/content-crud/content-crud.config'
import type {
  AcademicContentItem,
  ContentCrudConfig,
  ContentFieldConfig,
  ContentFormValue,
  ContentFormValues,
  ContentRelationOption,
} from '@/modules/content-crud/content-crud.types'
import {
  deleteContentResource,
  getContentResourcesByEntity,
  updateContentResourceFile,
  uploadContentResource,
  type ContentResource,
} from '@/modules/content-crud/services/content-resource.services'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CustomFileInput,
  CustomMultiSelect,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  ToggleSwitch,
} from '@/shared/ui'
import { generateFileUrl } from '@/shared/utils/file-url'

const DEFAULT_PAGE_SIZE = 20
const ALL_FILTER_VALUE = '__all__'
const RESOURCE_IMAGE_FIELD_NAME = 'resourceImage'
const PAGE_CONTENT_TABS = [
  { value: '1', labelKey: 'pageTypes.privacy' },
  { value: '2', labelKey: 'pageTypes.support' },
  { value: '3', labelKey: 'pageTypes.about' },
]

type AcademicCrudPageProps = { configKey: ContentCrudConfig['key'] }
type FormMode = 'create' | 'edit'
type FormState = {
  open: boolean
  mode: FormMode
  item: AcademicContentItem | null
  values: ContentFormValues
  errors: Record<string, string>
}
type FilterState = { search: string; relations: Record<string, string> }
type ResourceImageState = { resource: ContentResource | null; pendingFile: File | null }

type ResourceMutationPayload = { entityId: string; file: File }
type ResourceFileMutationPayload = { id: string; entityId?: string | null; file: File }
type ResourceDeleteMutationPayload = { id: string; entityId?: string | null }

function createEmptyResourceImageState(): ResourceImageState {
  return { resource: null, pendingFile: null }
}

function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return 'errors.generic'
}

function getFieldTextValue(value: ContentFormValue): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  return ''
}

function getFieldArrayValue(value: ContentFormValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function valueFromItem(item: AcademicContentItem, key: string): ContentFormValue {
  const value = item[key as keyof AcademicContentItem]
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  return undefined
}

function getRelationOptionLabel(option: ContentRelationOption): string {
  const fullName = [option.firstName, option.lastName]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')

  return (
    option.name?.trim() ||
    option.title?.trim() ||
    option.label?.trim() ||
    option.fullName?.trim() ||
    fullName ||
    option.email?.trim() ||
    option.phoneNumber?.trim() ||
    option.id ||
    '-'
  )
}

function renderCellValue(
  item: AcademicContentItem,
  key: string,
  relationKey: string | undefined,
  relations: Record<string, ContentRelationOption[]>,
): string {
  const rawValue = valueFromItem(item, key)
  if (relationKey && typeof rawValue === 'string') {
    const option = relations[relationKey]?.find((relationOption) => relationOption.id === rawValue)
    return option ? getRelationOptionLabel(option) : '-'
  }
  if (typeof rawValue === 'boolean') return rawValue ? '✓' : '—'
  if (typeof rawValue === 'number') return String(rawValue)
  if (typeof rawValue === 'string' && rawValue.trim()) return rawValue
  if (key === 'description') return item.description || item.desc || '-'
  return '-'
}

function getRelationFieldValue(item: AcademicContentItem, fieldName: string): string | string[] {
  const directValue = item[fieldName as keyof AcademicContentItem]
  if (typeof directValue === 'string') return directValue
  if (Array.isArray(directValue)) return directValue.filter((value): value is string => typeof value === 'string')
  const objectKey = fieldName.endsWith('Id') ? fieldName.slice(0, -2) : fieldName
  const relationObject = item[objectKey as keyof AcademicContentItem]
  if (relationObject && typeof relationObject === 'object' && !Array.isArray(relationObject) && 'id' in relationObject) {
    const id = (relationObject as { id?: unknown }).id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

function itemMatchesSearch(item: AcademicContentItem, search: string): boolean {
  const normalized = search.trim().toLowerCase()
  if (!normalized) return true
  const values = [
    item.name,
    item.title,
    item.key,
    item.code,
    item.body,
    item.content,
    item.firstName,
    item.lastName,
    item.phoneNumber,
    item.countryCallingCode,
    item.desc,
    item.description,
    item.currency,
    item.url,
    item.teacherName,
  ]
  return values.some((value) => typeof value === 'string' && value.toLowerCase().includes(normalized))
}

function itemMatchesRelationFilter(item: AcademicContentItem, fieldName: string, selectedId: string): boolean {
  if (!selectedId) return true
  const value = getRelationFieldValue(item, fieldName)
  return Array.isArray(value) ? value.includes(selectedId) : value === selectedId
}

function normalizePageContentType(value: unknown): string {
  const rawValue = String(value ?? '').trim().toLowerCase()
  if (rawValue === '1' || rawValue === 'privacy') return '1'
  if (rawValue === '2' || rawValue === 'support') return '2'
  if (rawValue === '3' || rawValue === 'about') return '3'
  return ''
}

function getPaginationItems(page: number, totalPages: number): Array<number | 'ellipsis-left' | 'ellipsis-right'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const items: Array<number | 'ellipsis-left' | 'ellipsis-right'> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  if (start > 2) items.push('ellipsis-left')
  for (let current = start; current <= end; current += 1) items.push(current)
  if (end < totalPages - 1) items.push('ellipsis-right')
  items.push(totalPages)
  return items
}

function getFieldGridClass(field: ContentFieldConfig): string {
  if (field.type === 'image' || field.type === 'textarea' || field.type === 'json') return 'sm:col-span-2 xl:col-span-3'
  if (field.type === 'checkbox') return 'sm:col-span-1'
  return 'sm:col-span-1'
}

function readInitialPage(searchParams: URLSearchParams): number {
  const page = Number(searchParams.get('page') ?? 1)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function readInitialFilters(searchParams: URLSearchParams): FilterState {
  const relations: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (key.startsWith('filter_') && value) relations[key.replace('filter_', '')] = value
  })
  return { search: searchParams.get('search') ?? '', relations }
}

function normalizeRelationOption(option: ContentRelationOption): ContentRelationOption {
  return {
    ...option,
    name: getRelationOptionLabel(option),
  }
}

async function fetchRelations(config: ContentCrudConfig): Promise<Record<string, ContentRelationOption[]>> {
  const entries = await Promise.all((config.relations ?? []).map(async (relation) => {
    const options = await api.get<ContentRelationOption[]>(relation.endpoint)
    return [relation.key, options.map(normalizeRelationOption)] as const
  }))
  return Object.fromEntries(entries)
}

function getDeleteItemName(item: AcademicContentItem, fallback: string) {
  return item.name || item.title || item.firstName || item.phoneNumber || fallback
}

function unwrapUnknownPayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: unknown }).data
  }
  return payload
}

function extractEntityId(payload: unknown): string | null {
  const unwrapped = unwrapUnknownPayload(payload)
  if (!unwrapped || typeof unwrapped !== 'object') return null

  const record = unwrapped as Record<string, unknown>
  const id = record.id ?? record.entityId
  return typeof id === 'string' && id.trim() ? id : null
}

function normalizeResourceLink(link: ResourceLink | null | undefined, entityId?: string | null): ContentResource | null {
  if (!link) return null

  const id = typeof link.id === 'string' ? link.id : ''
  const url = typeof link.url === 'string' ? link.url : null
  const filePath = typeof link.filePath === 'string' ? link.filePath : null

  if (!id && !url && !filePath) return null

  return {
    id,
    entityId,
    url,
    filePath,
    isImage: link.isImage ?? true,
  }
}

function getItemImageResource(item: AcademicContentItem | null | undefined): ContentResource | null {
  if (!item) return null

  const primaryImage = normalizeResourceLink(item.primaryImage, item.id)
  if (primaryImage) return primaryImage

  const image = normalizeResourceLink(item.image, item.id)
  if (image) return image

  if (item.primaryImageId) {
    return {
      id: item.primaryImageId,
      entityId: item.id,
      isImage: true,
    }
  }

  return null
}

function getResourceImageUrl(resource: ContentResource | null | undefined): string {
  return generateFileUrl(resource?.url || resource?.filePath || '')
}

function getResourceValueLabel(resource: ContentResource | null | undefined): string {
  return resource?.filePath || resource?.url || resource?.id || ''
}

function pickFirstImageResource(resources: PagedResponse<ContentResource> | undefined, entityId?: string | null): ContentResource | null {
  const resource = resources?.items?.find((item) => item.isImage !== false)
  return resource ? { ...resource, entityId: resource.entityId ?? entityId } : null
}

function isUserImageModule(configKey: ContentCrudConfig['key']): boolean {
  return configKey === 'teachers' || configKey === 'students' || configKey === 'managementUsers'
}

function ContentImagePreview({
  item,
  configKey,
}: {
  item: AcademicContentItem
  configKey: ContentCrudConfig['key']
}) {
  const [failedImageUrl, setFailedImageUrl] = useState('')
  const imageUrl = getResourceImageUrl(getItemImageResource(item))
  const showImage = Boolean(imageUrl && failedImageUrl !== imageUrl)
  const Icon = isUserImageModule(configKey) ? UserRound : ImageIcon

  return (
    <div className="flex items-center justify-center">
      <span className="flex size-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 text-muted-foreground">
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <Icon className="size-5" />
        )}
      </span>
    </div>
  )
}

function AcademicContentCrudPage({ configKey }: AcademicCrudPageProps) {
  const config = academicContentConfigs[configKey]
  const { t, i18n } = useTranslation('content-crud')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isRtl = i18n.dir() === 'rtl'
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(() => readInitialPage(searchParams))
  const [filters, setFilters] = useState<FilterState>(() => readInitialFilters(searchParams))
  const [pageContentType, setPageContentType] = useState(() => {
    const value = searchParams.get('pageType') ?? '1'
    return PAGE_CONTENT_TABS.some((tab) => tab.value === value) ? value : '1'
  })
  const [deleteTarget, setDeleteTarget] = useState<AcademicContentItem | null>(null)
  const [formState, setFormState] = useState<FormState>({ open: false, mode: 'create', item: null, values: config.emptyValues, errors: {} })
  const [detailHydratedId, setDetailHydratedId] = useState<string | null>(null)
  const [resourceImageState, setResourceImageState] = useState<ResourceImageState>(() => createEmptyResourceImageState())
  const relationFields = useMemo(() => config.fields.filter((field) => field.relationKey && (field.type === 'select' || field.type === 'multi-select')), [config.fields])
  const hasResourceImageField = useMemo(() => config.fields.some((field) => field.type === 'image'), [config.fields])
  const canCreate = config.fields.length > 0
  const canEdit = config.allowEdit !== false && config.fields.length > 0
  const canDelete = config.allowDelete !== false
  const canViewCourse = config.key === 'courses'
  const showActionsColumn = canEdit || canDelete || canViewCourse
  const activeEditId = formState.open && formState.mode === 'edit' ? formState.item?.id ?? '' : ''

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (filters.search.trim()) nextParams.set('search', filters.search.trim())
    if (config.key === 'pageContents') nextParams.set('pageType', pageContentType)
    Object.entries(filters.relations).forEach(([key, value]) => {
      if (value) nextParams.set(`filter_${key}`, value)
    })
    setSearchParams(nextParams, { replace: true })
  }, [config.key, filters, page, pageContentType, setSearchParams])

  const listQueryKey = useMemo(() => ['content-crud', config.key, 'list', page, DEFAULT_PAGE_SIZE, config.key === 'pageContents' ? pageContentType : 'all'], [config.key, page, pageContentType])
  const relationQuery = useQuery({ queryKey: ['content-crud', config.key, 'relations'], queryFn: () => fetchRelations(config), staleTime: 1000 * 60 * 5 })
  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () => api.get<PagedResponse<AcademicContentItem>>(config.endpoints.list, {
      params: { Page: page, PerPage: DEFAULT_PAGE_SIZE, ...(config.key === 'pageContents' ? { pageType: Number(pageContentType) } : {}) },
    }),
  })
  const detailQuery = useQuery({
    queryKey: ['content-crud', config.key, 'detail', activeEditId],
    queryFn: async () => {
      if (!config.endpoints.detail || !activeEditId) throw new Error('Missing detail endpoint')
      const response = await api.get<AcademicContentItem | { data: AcademicContentItem }>(config.endpoints.detail(activeEditId))
      return unwrapUnknownPayload(response) as AcademicContentItem
    },
    enabled: Boolean(formState.open && formState.mode === 'edit' && activeEditId && config.endpoints.detail),
    staleTime: 1000 * 60,
  })
  const resourceImageQuery = useQuery({
    queryKey: ['content-crud', config.key, 'resources', activeEditId],
    queryFn: () => getContentResourcesByEntity(activeEditId),
    enabled: Boolean(hasResourceImageField && activeEditId),
    staleTime: 1000 * 60,
  })
  const courseSubjectId = config.key === 'courses' ? getFieldTextValue(formState.values.subjectId) : ''
  const courseTeacherOptionsQuery = useQuery({
    queryKey: ['content-crud', config.key, 'course-teachers-by-subject', courseSubjectId],
    queryFn: async () => {
      const teachersRelation = config.relations?.find((relation) => relation.key === 'teachers')
      if (!teachersRelation || !courseSubjectId) return []
      const options = await api.get<ContentRelationOption[]>(teachersRelation.endpoint, {
        params: { subjectId: courseSubjectId },
      })
      return options.map(normalizeRelationOption)
    },
    enabled: Boolean(config.key === 'courses' && courseSubjectId),
    staleTime: 1000 * 60 * 5,
  })
  const relations = relationQuery.data ?? {}
  const courseTeacherOptions = courseSubjectId ? courseTeacherOptionsQuery.data ?? [] : relations.teachers ?? []
  const items = useMemo(() => {
    const sourceItems = listQuery.data?.items ?? []
    return sourceItems.filter((item) => {
      const matchesPageContentType = config.key !== 'pageContents' || normalizePageContentType(item.pageType) === pageContentType
      return matchesPageContentType && itemMatchesSearch(item, filters.search) && relationFields.every((field) => itemMatchesRelationFilter(item, field.name, filters.relations[field.name] ?? ''))
    })
  }, [config.key, filters, listQuery.data?.items, pageContentType, relationFields])
  const totalCount = listQuery.data?.totalCount ?? 0
  const pageSize = listQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paginationItems = getPaginationItems(page, totalPages)
  const tableScrollClass = config.key === 'quizzes' ? 'h-full max-h-full' : 'max-h-[min(62vh,46rem)]'

  const uploadResourceMutation = useMutation<ContentResource, Error, ResourceMutationPayload>({
    mutationFn: uploadContentResource,
  })
  const updateResourceFileMutation = useMutation<ContentResource, Error, ResourceFileMutationPayload>({
    mutationFn: updateContentResourceFile,
  })
  const deleteResourceMutation = useMutation<void, Error, ResourceDeleteMutationPayload>({
    mutationFn: ({ id }) => deleteContentResource(id),
  })
  const isResourceBusy = uploadResourceMutation.isPending || updateResourceFileMutation.isPending || deleteResourceMutation.isPending

  useEffect(() => {
    const detail = detailQuery.data
    if (!detail?.id || !formState.open || formState.mode !== 'edit' || detail.id !== formState.item?.id || detailHydratedId === detail.id) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailHydratedId(detail.id)
    setFormState((current) => {
      if (!current.open || current.mode !== 'edit' || current.item?.id !== detail.id) return current
      return { ...current, item: detail, values: config.getInitialValues(detail) }
    })

    const detailResource = getItemImageResource(detail)
    if (detailResource) {
      setResourceImageState((current) => (current.pendingFile ? current : { ...current, resource: detailResource }))
    }
  }, [config, detailHydratedId, detailQuery.data, formState.item?.id, formState.mode, formState.open])

  useEffect(() => {
    if (!hasResourceImageField || !formState.open || formState.mode !== 'edit') return

    const resource = pickFirstImageResource(resourceImageQuery.data, activeEditId)
    if (!resource) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResourceImageState((current) => {
      if (current.pendingFile) return current
      if (current.resource?.id === resource.id && current.resource?.filePath === resource.filePath && current.resource?.url === resource.url) return current
      return { ...current, resource }
    })
  }, [activeEditId, formState.mode, formState.open, hasResourceImageField, resourceImageQuery.data])

  const closeFormDialog = () => {
    setFormState({ open: false, mode: 'create', item: null, values: { ...config.emptyValues }, errors: {} })
    setDetailHydratedId(null)
    setResourceImageState(createEmptyResourceImageState())
  }

  const invalidateContentQueries = async (entityId?: string | null) => {
    await queryClient.invalidateQueries({ queryKey: ['content-crud', config.key] })
    if (entityId) {
      await queryClient.invalidateQueries({ queryKey: ['content-crud', config.key, 'resources', entityId] })
    }
  }

  const persistResourceImage = async (file: File, entityId: string): Promise<ContentResource> => {
    const currentResource = resourceImageState.resource
    const savedResource = currentResource?.id
      ? await updateResourceFileMutation.mutateAsync({ id: currentResource.id, entityId, file })
      : await uploadResourceMutation.mutateAsync({ entityId, file })

    const normalizedResource = { ...savedResource, entityId: savedResource.entityId ?? entityId }
    setResourceImageState({ resource: normalizedResource, pendingFile: null })
    toast.success(t('messages.uploaded'))
    await invalidateContentQueries(entityId)
    return normalizedResource
  }

  const saveMutation = useMutation({
    mutationFn: async (values: ContentFormValues) => {
      const payload = config.toPayload(values)
      if (formState.mode === 'edit' && formState.item?.id) {
        const updateUrl = config.endpoints.update(formState.item.id)
        return config.updateMethod === 'patch' ? api.patch<unknown, Record<string, unknown>>(updateUrl, payload) : api.put<unknown, Record<string, unknown>>(updateUrl, payload)
      }
      return api.post<unknown, Record<string, unknown>>(config.endpoints.create, payload)
    },
    onSuccess: async (response) => {
      const pendingImage = resourceImageState.pendingFile
      const entityId = formState.mode === 'edit' ? formState.item?.id ?? null : extractEntityId(response)

      try {
        if (pendingImage) {
          if (!entityId) {
            toast.error(t('errors.imageUploadRequiresEntity'))
            return
          }
          await persistResourceImage(pendingImage, entityId)
        }

        toast.success(t(formState.mode === 'edit' ? 'messages.updated' : config.key === 'notifications' ? 'messages.sent' : 'messages.created'))
        closeFormDialog()
        await invalidateContentQueries(entityId)
      } catch (error) {
        toast.error(t(getApiErrorMessage(error)))
      }
    },
    onError: (error) => {
      toast.error(t(getApiErrorMessage(error)))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (item: AcademicContentItem) => api.delete<unknown>(config.endpoints.remove(item.id)),
    onSuccess: async () => {
      toast.success(t('messages.deleted'))
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['content-crud', config.key] })
    },
    onError: (error) => {
      toast.error(t(getApiErrorMessage(error)))
    },
  })

  const openCreateForm = () => {
    setDetailHydratedId(null)
    setResourceImageState(createEmptyResourceImageState())
    setFormState({ open: true, mode: 'create', item: null, values: { ...config.emptyValues }, errors: {} })
  }

  const openEditForm = (item: AcademicContentItem) => {
    setDetailHydratedId(null)
    setResourceImageState({ resource: getItemImageResource(item), pendingFile: null })
    setFormState({ open: true, mode: 'edit', item, values: config.getInitialValues(item), errors: {} })
  }

  const updateField = (fieldName: string, value: ContentFormValue) => setFormState((current) => {
    const nextValues = { ...current.values, [fieldName]: value }
    if (config.key === 'courses' && fieldName === 'subjectId' && current.values.subjectId !== value) {
      nextValues.teacherId = ''
    }
    return { ...current, values: nextValues, errors: { ...current.errors, [fieldName]: '', ...(fieldName === 'subjectId' ? { teacherId: '' } : {}) } }
  })
  const updateSearch = (value: string) => {
    setPage(1)
    setFilters((current) => ({ ...current, search: value }))
  }
  const updateRelationFilter = (fieldName: string, value: string) => {
    setPage(1)
    setFilters((current) => ({ ...current, relations: { ...current.relations, [fieldName]: value === ALL_FILTER_VALUE ? '' : value } }))
  }
  const updatePageContentType = (value: string) => {
    setPage(1)
    setPageContentType(value)
  }
  const goToPage = (nextPage: number) => setPage(Math.min(totalPages, Math.max(1, nextPage)))

  const handleResourceImageFileSelect = async (file: File | null) => {
    if (!file) {
      setResourceImageState((current) => ({ ...current, pendingFile: null }))
      return
    }

    setResourceImageState((current) => ({ ...current, pendingFile: file }))

    if (formState.mode !== 'edit' || !formState.item?.id) return

    try {
      await persistResourceImage(file, formState.item.id)
    } catch (error) {
      toast.error(t(getApiErrorMessage(error)))
    }
  }

  const handleResourceImageDelete = async () => {
    const currentResource = resourceImageState.resource
    const entityId = currentResource?.entityId ?? formState.item?.id ?? null

    if (!currentResource?.id) {
      setResourceImageState(createEmptyResourceImageState())
      return
    }

    try {
      await deleteResourceMutation.mutateAsync({ id: currentResource.id, entityId })
      setResourceImageState(createEmptyResourceImageState())
      toast.success(t('messages.imageDeleted'))
      await invalidateContentQueries(entityId)
    } catch (error) {
      toast.error(t(getApiErrorMessage(error)))
    }
  }

  const handleSubmit = () => {
    if (isResourceBusy) return

    const validation = config.validate(formState.values)
    if (!validation.success) {
      setFormState((current) => ({ ...current, errors: validation.errors }))
      return
    }
    saveMutation.mutate(validation.data)
  }
  const handleDelete = (item: AcademicContentItem) => setDeleteTarget(item)
  const confirmDelete = () => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget)
  }

  const renderTableCellContent = (item: AcademicContentItem, column: ContentCrudConfig['columns'][number]) => {
    if (column.key === RESOURCE_IMAGE_FIELD_NAME) {
      return <ContentImagePreview item={item} configKey={config.key} />
    }

    return column.render ? column.render(item, { relations }) : renderCellValue(item, column.key, column.relationKey, relations)
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 rounded-3xl border border-primary/10 bg-card/95 p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t(config.titleKey)}</h1>
          <p className="line-clamp-1 text-sm leading-6 text-muted-foreground">{t(config.descriptionKey)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => listQuery.refetch()} disabled={listQuery.isFetching}>
            <RefreshCcw className="size-4" />
            {t('actions.refresh')}
          </Button>
          {canCreate ? (
            <Button type="button" size="sm" onClick={openCreateForm}>
              <Plus className="size-4" />
              {t(config.key === 'notifications' ? 'actions.sendNotification' : 'actions.create')}
            </Button>
          ) : null}
        </div>
      </div>
      <Card className={`flex min-h-0 flex-1 flex-col rounded-3xl shadow-sm ${config.key === 'quizzes' ? 'quizy-quizzes-table-card' : ''}`}>
        <CardHeader className="shrink-0 space-y-3 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 gap-2 md:grid-cols-2 xl:grid-cols-4 lg:max-w-5xl">
              <label className="relative block md:col-span-2 xl:col-span-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-10 ps-10" value={filters.search} placeholder={t('filters.searchPlaceholder')} onChange={(event) => updateSearch(event.target.value)} />
              </label>
              {relationFields.map((field) => {
                const options = field.relationKey ? relations[field.relationKey] ?? [] : []
                const selected = filters.relations[field.name] || ALL_FILTER_VALUE
                return (
                  <CustomSelect
                    key={field.name}
                    value={selected}
                    variant="filter"
                    icon={<SlidersHorizontal />}
                    placeholder={t('filters.all', { field: t(field.labelKey) })}
                    options={[{ value: ALL_FILTER_VALUE, label: t('filters.all', { field: t(field.labelKey) }) }, ...options.map((option) => ({ value: option.id, label: getRelationOptionLabel(option) }))]}
                    onValueChange={(value) => updateRelationFilter(field.name, value)}
                  />
                )
              })}
            </div>
            {config.key === 'pageContents' ? (
              <div className="flex flex-wrap gap-2">
                {PAGE_CONTENT_TABS.map((tab) => (
                  <Button
                    key={tab.value}
                    type="button"
                    size="sm"
                    variant={pageContentType === tab.value ? 'default' : 'outline'}
                    disabled={listQuery.isFetching}
                    onClick={() => updatePageContentType(tab.value)}
                  >
                    {t(tab.labelKey)}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
          {listQuery.isLoading ? (
            <div className="space-y-3">{[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-14 w-full rounded-2xl" />)}</div>
          ) : listQuery.isError ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-destructive/30 bg-destructive/5 p-10 text-center">
              <DatabaseZap className="mb-3 size-10 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">{t('states.error.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(getApiErrorMessage(listQuery.error))}</p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => listQuery.refetch()}>{t('actions.retry')}</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
              <DatabaseZap className="mx-auto mb-3 size-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">{t('states.empty.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('states.empty.description')}</p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background/70">
              <div className={`${tableScrollClass} min-h-0 overflow-auto`}>
                <Table className={config.key === 'quizzes' ? 'min-w-[920px]' : 'min-w-[760px]'}>
                  <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                    <TableRow>
                      {config.columns.map((column) => <TableHead key={column.key}>{t(column.labelKey)}</TableHead>)}
                      {showActionsColumn ? <TableHead className="w-32 text-center">{t('fields.actions')}</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        {config.columns.map((column) => (
                          <TableCell key={column.key} className={column.key === RESOURCE_IMAGE_FIELD_NAME ? 'w-20' : 'max-w-[18rem] truncate'}>
                            {renderTableCellContent(item, column)}
                          </TableCell>
                        ))}
                        <TableCell className={showActionsColumn ? undefined : 'hidden'}>
                          <div className="flex justify-center gap-2">
                            {canViewCourse ? (
                              <Button type="button" size="icon-sm" variant="outline" onClick={() => navigate(`/courses/${item.id}`)}>
                                <Eye className="size-4" />
                              </Button>
                            ) : null}
                            {canEdit ? (
                              <Button type="button" size="icon-sm" variant="outline" onClick={() => openEditForm(item)}>
                                <Pencil className="size-4" />
                              </Button>
                            ) : null}
                            <Button type="button" size="icon-sm" variant="outline" className="text-destructive hover:text-destructive" disabled={deleteMutation.isPending} onClick={() => handleDelete(item)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <div className="mt-3 flex shrink-0 justify-end border-t border-border/70 pt-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button type="button" size="icon-sm" variant="outline" disabled={page <= 1 || listQuery.isFetching} onClick={() => goToPage(page - 1)} aria-label={t('pagination.previous')}>{isRtl ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</Button>
              {paginationItems.map((item) => item === 'ellipsis-left' || item === 'ellipsis-right' ? <span key={item} className="px-2 text-sm text-muted-foreground">…</span> : <Button key={item} type="button" size="sm" variant={item === page ? 'default' : 'outline'} className="min-w-9 px-3" disabled={listQuery.isFetching} onClick={() => goToPage(item)}>{item}</Button>)}
              <Button type="button" size="icon-sm" variant="outline" disabled={page >= totalPages || listQuery.isFetching} onClick={() => goToPage(page + 1)} aria-label={t('pagination.next')}>{isRtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={formState.open}
        onOpenChange={(open) => {
          if (!open && !saveMutation.isPending && !isResourceBusy) closeFormDialog()
          if (open) setFormState((current) => ({ ...current, open }))
        }}
      >
        <DialogContent className="flex max-h-[88svh] max-w-4xl flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{t(formState.mode === 'edit' ? 'form.editTitle' : 'form.createTitle', { entity: t(config.titleKey) })}</DialogTitle>
            <DialogDescription>{t('form.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto py-2 pe-1 sm:grid-cols-2 xl:grid-cols-3">
            {config.fields.map((field) => {
              const fieldError = formState.errors[field.name]
              const fieldId = `${config.key}-${field.name}`
              const options = config.key === 'courses' && field.name === 'teacherId'
                ? courseTeacherOptions
                : field.relationKey ? relations[field.relationKey] ?? [] : []
              const optionItems = (field.options ?? []).length > 0
                ? (field.options ?? []).map((option) => ({ value: option.value, label: option.labelKey ? t(option.labelKey) : option.label ?? option.value }))
                : options.map((option) => ({ value: option.id, label: getRelationOptionLabel(option) }))
              const value = formState.values[field.name]
              const resourceImageUrl = getResourceImageUrl(resourceImageState.resource)
              const resourceValueLabel = getResourceValueLabel(resourceImageState.resource)

              return (
                <div key={field.name} className={`space-y-2 ${getFieldGridClass(field)}`}>
                  <Label htmlFor={fieldId}>{t(field.labelKey)}</Label>
                  {field.type === 'image' ? (
                    <CustomFileInput
                      id={fieldId}
                      value={resourceValueLabel}
                      previewSrc={resourceImageUrl}
                      uploadLabel={t('actions.chooseImage')}
                      removeLabel={t('actions.deleteImage')}
                      hint={t(formState.mode === 'create' ? 'form.imageCreateHint' : 'form.imageEditHint')}
                      disabled={saveMutation.isPending || isResourceBusy}
                      onFileSelect={(file) => void handleResourceImageFileSelect(file)}
                      onClear={() => void handleResourceImageDelete()}
                    />
                  ) : field.type === 'textarea' || field.type === 'json' ? (
                    <Textarea id={fieldId} value={getFieldTextValue(value)} placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined} onChange={(event) => updateField(field.name, event.target.value)} />
                  ) : field.type === 'checkbox' ? (
                    <div className="flex h-11 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 text-sm">
                      <span>{t(field.labelKey)}</span>
                      <ToggleSwitch
                        checked={value === true}
                        onCheckedChange={(checked) => {
                          updateField(field.name, checked)
                          if (config.key === 'courses' && field.name === 'isFree' && checked) updateField('price', 0)
                        }}
                      />
                    </div>
                  ) : field.name === 'countryCallingCode' ? (
                    <CountryCodeSelect id={fieldId} value={getFieldTextValue(value)} placeholder={t('form.selectPlaceholder')} onValueChange={(nextValue) => updateField(field.name, nextValue)} />
                  ) : field.type === 'select' ? (
                    <CustomSelect id={fieldId} value={getFieldTextValue(value) || undefined} placeholder={t('form.selectPlaceholder')} disabled={config.key === 'courses' && field.name === 'teacherId' && Boolean(courseSubjectId) && courseTeacherOptionsQuery.isFetching} options={optionItems} onValueChange={(nextValue) => updateField(field.name, nextValue)} />
                  ) : field.type === 'multi-select' ? (
                    <CustomMultiSelect id={fieldId} value={getFieldArrayValue(value)} placeholder={t('form.selectPlaceholder')} options={optionItems} onValueChange={(nextValue) => updateField(field.name, nextValue)} />
                  ) : (
                    <Input id={fieldId} type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'} value={getFieldTextValue(value)} placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined} disabled={config.key === 'courses' && field.name === 'price' && formState.values.isFree === true} onChange={(event) => updateField(field.name, field.type === 'number' ? Number(event.target.value) : event.target.value)} />
                  )}
                  {fieldError ? <p className="text-sm text-destructive">{t(fieldError)}</p> : null}
                </div>
              )
            })}
          </div>
          <DialogFooter className="shrink-0 border-t border-border/70 pt-4">
            <Button type="button" variant="outline" disabled={saveMutation.isPending || isResourceBusy} onClick={closeFormDialog}>{t('actions.cancel')}</Button>
            <Button type="button" disabled={saveMutation.isPending || isResourceBusy} onClick={handleSubmit}>{saveMutation.isPending || isResourceBusy ? <Loader2 className="size-4 animate-spin" /> : null}{t(config.key === 'notifications' ? 'actions.send' : 'actions.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>{deleteTarget ? t('messages.deleteConfirm', { name: getDeleteItemName(deleteTarget, t('messages.item')) }) : ''}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('actions.cancel')}</Button>
            <Button type="button" disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>{deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function ClassesPage() { return <AcademicContentCrudPage configKey="classes" /> }
export function SubjectsPage() { return <AcademicContentCrudPage configKey="subjects" /> }
export function UnitsPage() { return <AcademicContentCrudPage configKey="units" /> }
export function LessonsPage() { return <AcademicContentCrudPage configKey="lessons" /> }
export function TeachersPage() { return <AcademicContentCrudPage configKey="teachers" /> }
export function StudentsPage() { return <AcademicContentCrudPage configKey="students" /> }
export function ManagementUsersPage() { return <AcademicContentCrudPage configKey="managementUsers" /> }
export function QuizzesPage() { return <AcademicContentCrudPage configKey="quizzes" /> }
export function QuestionsPage() { return <AcademicContentCrudPage configKey="questions" /> }
export function CoursesPage() { return <AcademicContentCrudPage configKey="courses" /> }
export function ResourcesPage() { return <AcademicContentCrudPage configKey="resources" /> }
export function AdsPage() { return <AcademicContentCrudPage configKey="ads" /> }
export function PointsOfSalePage() { return <AcademicContentCrudPage configKey="pointsOfSale" /> }
export function QrCodesPage() { return <AcademicContentCrudPage configKey="qrCodes" /> }
export function NotificationsPage() { return <AcademicContentCrudPage configKey="notifications" /> }
export function PageContentsPage() { return <AcademicContentCrudPage configKey="pageContents" /> }
