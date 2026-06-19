import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DatabaseZap, Loader2, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { academicContentConfigs } from '@/modules/content-crud/content-crud.config'
import type {
  AcademicContentItem,
  ContentCrudConfig,
  ContentFormValue,
  ContentFormValues,
  ContentRelationOption,
} from '@/modules/content-crud/content-crud.types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from '@/shared/ui'

const DEFAULT_PAGE_SIZE = 20

type AcademicCrudPageProps = {
  configKey: ContentCrudConfig['key']
}

type FormMode = 'create' | 'edit'

type FormState = {
  open: boolean
  mode: FormMode
  item: AcademicContentItem | null
  values: ContentFormValues
  errors: Record<string, string>
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

function renderCellValue(
  item: AcademicContentItem,
  key: string,
  relationKey: string | undefined,
  relations: Record<string, ContentRelationOption[]>
): string {
  const rawValue = valueFromItem(item, key)

  if (relationKey && typeof rawValue === 'string') {
    return relations[relationKey]?.find((option) => option.id === rawValue)?.name ?? rawValue
  }

  if (typeof rawValue === 'number') return String(rawValue)
  if (typeof rawValue === 'string' && rawValue.trim()) return rawValue

  if (key === 'description') {
    return item.description || item.desc || '-'
  }

  return '-'
}

async function fetchRelations(config: ContentCrudConfig): Promise<Record<string, ContentRelationOption[]>> {
  const entries = await Promise.all(
    (config.relations ?? []).map(async (relation) => {
      const options = await api.get<ContentRelationOption[]>(relation.endpoint)
      return [relation.key, options] as const
    })
  )

  return Object.fromEntries(entries)
}

function AcademicContentCrudPage({ configKey }: AcademicCrudPageProps) {
  const config = academicContentConfigs[configKey]
  const { t } = useTranslation('content-crud')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [formState, setFormState] = useState<FormState>({
    open: false,
    mode: 'create',
    item: null,
    values: config.emptyValues,
    errors: {},
  })

  const listQueryKey = useMemo(
    () => ['content-crud', config.key, 'list', page, DEFAULT_PAGE_SIZE],
    [config.key, page]
  )

  const relationQuery = useQuery({
    queryKey: ['content-crud', config.key, 'relations'],
    queryFn: () => fetchRelations(config),
    staleTime: 1000 * 60 * 5,
  })

  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      api.get<PagedResponse<AcademicContentItem>>(config.endpoints.list, {
        params: { Page: page, PerPage: DEFAULT_PAGE_SIZE },
      }),
  })

  const relations = relationQuery.data ?? {}
  const items = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const pageSize = listQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const saveMutation = useMutation({
    mutationFn: async (values: ContentFormValues) => {
      const payload = config.toPayload(values)
      if (formState.mode === 'edit' && formState.item?.id) {
        return api.put<unknown, Record<string, unknown>>(config.endpoints.update(formState.item.id), payload)
      }

      return api.post<unknown, Record<string, unknown>>(config.endpoints.create, payload)
    },
    onSuccess: async () => {
      toast.success(t(formState.mode === 'edit' ? 'messages.updated' : 'messages.created'))
      setFormState((current) => ({ ...current, open: false, item: null, errors: {} }))
      await queryClient.invalidateQueries({ queryKey: ['content-crud', config.key] })
    },
    onError: (error) => {
      toast.error(t(getApiErrorMessage(error)))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (item: AcademicContentItem) => api.delete<unknown>(config.endpoints.remove(item.id)),
    onSuccess: async () => {
      toast.success(t('messages.deleted'))
      await queryClient.invalidateQueries({ queryKey: ['content-crud', config.key] })
    },
    onError: (error) => {
      toast.error(t(getApiErrorMessage(error)))
    },
  })

  const openCreateForm = () => {
    setFormState({
      open: true,
      mode: 'create',
      item: null,
      values: { ...config.emptyValues },
      errors: {},
    })
  }

  const openEditForm = (item: AcademicContentItem) => {
    setFormState({
      open: true,
      mode: 'edit',
      item,
      values: config.getInitialValues(item),
      errors: {},
    })
  }

  const updateField = (fieldName: string, value: ContentFormValue) => {
    setFormState((current) => ({
      ...current,
      values: { ...current.values, [fieldName]: value },
      errors: { ...current.errors, [fieldName]: '' },
    }))
  }

  const handleSubmit = () => {
    const validation = config.validate(formState.values)
    if (!validation.success) {
      setFormState((current) => ({ ...current, errors: validation.errors }))
      return
    }

    saveMutation.mutate(validation.data)
  }

  const handleDelete = (item: AcademicContentItem) => {
    const confirmed = window.confirm(t('messages.deleteConfirm', { name: item.name || item.id }))
    if (!confirmed) return
    deleteMutation.mutate(item)
  }

  return (
    <section className="w-full space-y-6">
      <div className="rounded-[2rem] border border-primary/10 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" color="primary" className="rounded-full px-3">
              {t('status.connected')}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t(config.titleKey)}</h1>
            <p className="text-base leading-7 text-muted-foreground">{t(config.descriptionKey)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => listQuery.refetch()} disabled={listQuery.isFetching}>
              <RefreshCcw className="size-4" />
              {t('actions.refresh')}
            </Button>
            <Button type="button" onClick={openCreateForm}>
              <Plus className="size-4" />
              {t('actions.create')}
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader className="gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('table.title')}</CardTitle>
              <CardDescription>{t('table.description', { count: totalCount })}</CardDescription>
            </div>
            <Badge variant="outline" className="w-fit rounded-full px-3">
              {t('table.page', { page, totalPages })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : listQuery.isError ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-destructive/30 bg-destructive/5 p-10 text-center">
              <DatabaseZap className="mb-3 size-10 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">{t('states.error.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(getApiErrorMessage(listQuery.error))}</p>
              <Button type="button" variant="outline" className="mt-4" onClick={() => listQuery.refetch()}>
                {t('actions.retry')}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center">
              <DatabaseZap className="mx-auto mb-3 size-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">{t('states.empty.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t('states.empty.description')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.columns.map((column) => (
                      <TableHead key={column.key}>{t(column.labelKey)}</TableHead>
                    ))}
                    <TableHead className="w-32 text-center">{t('fields.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      {config.columns.map((column) => (
                        <TableCell key={column.key} className="max-w-[18rem] truncate">
                          {column.render
                            ? column.render(item, { relations })
                            : renderCellValue(item, column.key, column.relationKey, relations)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button type="button" size="icon-sm" variant="outline" onClick={() => openEditForm(item)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" disabled={page <= 1 || listQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              {t('pagination.previous')}
            </Button>
            <p className="text-sm text-muted-foreground">{t('pagination.summary', { page, totalPages })}</p>
            <Button type="button" variant="outline" disabled={page >= totalPages || listQuery.isFetching} onClick={() => setPage((current) => current + 1)}>
              {t('pagination.next')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formState.open} onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t(formState.mode === 'edit' ? 'form.editTitle' : 'form.createTitle', { entity: t(config.titleKey) })}</DialogTitle>
            <DialogDescription>{t('form.description')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {config.fields.map((field) => {
              const fieldError = formState.errors[field.name]
              const fieldId = `${config.key}-${field.name}`
              const options = field.relationKey ? relations[field.relationKey] ?? [] : []

              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={fieldId}>{t(field.labelKey)}</Label>

                  {field.type === 'textarea' ? (
                    <Textarea
                      id={fieldId}
                      value={getFieldTextValue(formState.values[field.name])}
                      placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                      onChange={(event) => updateField(field.name, event.target.value)}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={fieldId}
                      value={getFieldTextValue(formState.values[field.name])}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) => updateField(field.name, event.target.value)}
                    >
                      <option value="">{t('form.selectPlaceholder')}</option>
                      {options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'multi-select' ? (
                    <select
                      id={fieldId}
                      multiple
                      value={getFieldArrayValue(formState.values[field.name])}
                      className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) =>
                        updateField(
                          field.name,
                          Array.from(event.currentTarget.selectedOptions).map((option) => option.value)
                        )
                      }
                    >
                      {options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={fieldId}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={getFieldTextValue(formState.values[field.name])}
                      placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                      onChange={(event) => updateField(field.name, field.type === 'number' ? Number(event.target.value) : event.target.value)}
                    />
                  )}

                  {fieldError ? <p className="text-sm text-destructive">{t(fieldError)}</p> : null}
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setFormState((current) => ({ ...current, open: false }))}>
              {t('actions.cancel')}
            </Button>
            <Button type="button" disabled={saveMutation.isPending} onClick={handleSubmit}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function ClassesPage() {
  return <AcademicContentCrudPage configKey="classes" />
}

export function SubjectsPage() {
  return <AcademicContentCrudPage configKey="subjects" />
}

export function UnitsPage() {
  return <AcademicContentCrudPage configKey="units" />
}

export function LessonsPage() {
  return <AcademicContentCrudPage configKey="lessons" />
}
