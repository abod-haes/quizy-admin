import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DatabaseZap, Loader2, Pencil, Plus, RefreshCcw, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { academicContentConfigs } from '@/modules/content-crud/content-crud.config'
import type { AcademicContentItem, ContentCrudConfig, ContentFieldConfig, ContentFormValue, ContentFormValues, ContentRelationOption } from '@/modules/content-crud/content-crud.types'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import { Button, Card, CardContent, CardHeader, CustomMultiSelect, CustomSelect, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from '@/shared/ui'

const DEFAULT_PAGE_SIZE = 20
const ALL_FILTER_VALUE = '__all__'

type AcademicCrudPageProps = { configKey: ContentCrudConfig['key'] }
type FormMode = 'create' | 'edit'
type FormState = { open: boolean; mode: FormMode; item: AcademicContentItem | null; values: ContentFormValues; errors: Record<string, string> }
type FilterState = { search: string; relations: Record<string, string> }

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

function renderCellValue(item: AcademicContentItem, key: string, relationKey: string | undefined, relations: Record<string, ContentRelationOption[]>): string {
  const rawValue = valueFromItem(item, key)
  if (relationKey && typeof rawValue === 'string') return relations[relationKey]?.find((option) => option.id === rawValue)?.name ?? '-'
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
  const values = [item.name, item.title, item.key, item.code, item.body, item.content, item.firstName, item.lastName, item.phoneNumber, item.countryCallingCode, item.desc, item.description, item.currency, item.url, item.teacherName]
  return values.some((value) => typeof value === 'string' && value.toLowerCase().includes(normalized))
}

function itemMatchesRelationFilter(item: AcademicContentItem, fieldName: string, selectedId: string): boolean {
  if (!selectedId) return true
  const value = getRelationFieldValue(item, fieldName)
  return Array.isArray(value) ? value.includes(selectedId) : value === selectedId
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
  if (field.type === 'textarea' || field.type === 'json') return 'sm:col-span-2 xl:col-span-3'
  if (field.type === 'checkbox') return 'sm:col-span-1'
  return 'sm:col-span-1'
}

function readInitialPage(searchParams: URLSearchParams): number {
  const page = Number(searchParams.get('page') ?? 1)
  return Number.isFinite(page) && page > 0 ? page : 1
}

function readInitialFilters(searchParams: URLSearchParams): FilterState {
  const relations: Record<string, string> = {}
  searchParams.forEach((value, key) => { if (key.startsWith('filter_') && value) relations[key.replace('filter_', '')] = value })
  return { search: searchParams.get('search') ?? '', relations }
}

async function fetchRelations(config: ContentCrudConfig): Promise<Record<string, ContentRelationOption[]>> {
  const entries = await Promise.all((config.relations ?? []).map(async (relation) => {
    const options = await api.get<ContentRelationOption[]>(relation.endpoint)
    return [relation.key, options] as const
  }))
  return Object.fromEntries(entries)
}

function getDeleteItemName(item: AcademicContentItem, fallback: string) {
  return item.name || item.title || item.firstName || item.phoneNumber || fallback
}

function AcademicContentCrudPage({ configKey }: AcademicCrudPageProps) {
  const config = academicContentConfigs[configKey]
  const { t, i18n } = useTranslation('content-crud')
  const queryClient = useQueryClient()
  const isRtl = i18n.dir() === 'rtl'
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(() => readInitialPage(searchParams))
  const [filters, setFilters] = useState<FilterState>(() => readInitialFilters(searchParams))
  const [deleteTarget, setDeleteTarget] = useState<AcademicContentItem | null>(null)
  const [formState, setFormState] = useState<FormState>({ open: false, mode: 'create', item: null, values: config.emptyValues, errors: {} })
  const relationFields = useMemo(() => config.fields.filter((field) => field.relationKey && (field.type === 'select' || field.type === 'multi-select')), [config.fields])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (filters.search.trim()) nextParams.set('search', filters.search.trim())
    Object.entries(filters.relations).forEach(([key, value]) => { if (value) nextParams.set(`filter_${key}`, value) })
    setSearchParams(nextParams, { replace: true })
  }, [filters, page, setSearchParams])

  const listQueryKey = useMemo(() => ['content-crud', config.key, 'list', page, DEFAULT_PAGE_SIZE], [config.key, page])
  const relationQuery = useQuery({ queryKey: ['content-crud', config.key, 'relations'], queryFn: () => fetchRelations(config), staleTime: 1000 * 60 * 5 })
  const listQuery = useQuery({ queryKey: listQueryKey, queryFn: () => api.get<PagedResponse<AcademicContentItem>>(config.endpoints.list, { params: { Page: page, PerPage: DEFAULT_PAGE_SIZE } }) })
  const relations = relationQuery.data ?? {}
  const items = useMemo(() => {
    const sourceItems = listQuery.data?.items ?? []
    return sourceItems.filter((item) => itemMatchesSearch(item, filters.search) && relationFields.every((field) => itemMatchesRelationFilter(item, field.name, filters.relations[field.name] ?? '')))
  }, [filters, listQuery.data?.items, relationFields])
  const totalCount = listQuery.data?.totalCount ?? 0
  const pageSize = listQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const paginationItems = getPaginationItems(page, totalPages)
  const tableScrollClass = config.key === 'quizzes' ? 'h-full max-h-full' : 'max-h-[min(62vh,46rem)]'

  const saveMutation = useMutation({
    mutationFn: async (values: ContentFormValues) => {
      const payload = config.toPayload(values)
      if (formState.mode === 'edit' && formState.item?.id) {
        const updateUrl = config.endpoints.update(formState.item.id)
        return config.updateMethod === 'patch' ? api.patch<unknown, Record<string, unknown>>(updateUrl, payload) : api.put<unknown, Record<string, unknown>>(updateUrl, payload)
      }
      return api.post<unknown, Record<string, unknown>>(config.endpoints.create, payload)
    },
    onSuccess: async () => {
      toast.success(t(formState.mode === 'edit' ? 'messages.updated' : 'messages.created'))
      setFormState((current) => ({ ...current, open: false, item: null, errors: {} }))
      await queryClient.invalidateQueries({ queryKey: ['content-crud', config.key] })
    },
    onError: (error) => { toast.error(t(getApiErrorMessage(error))) },
  })

  const deleteMutation = useMutation({
    mutationFn: (item: AcademicContentItem) => api.delete<unknown>(config.endpoints.remove(item.id)),
    onSuccess: async () => {
      toast.success(t('messages.deleted'))
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['content-crud', config.key] })
    },
    onError: (error) => { toast.error(t(getApiErrorMessage(error))) },
  })

  const openCreateForm = () => setFormState({ open: true, mode: 'create', item: null, values: { ...config.emptyValues }, errors: {} })
  const openEditForm = (item: AcademicContentItem) => setFormState({ open: true, mode: 'edit', item, values: config.getInitialValues(item), errors: {} })
  const updateField = (fieldName: string, value: ContentFormValue) => setFormState((current) => ({ ...current, values: { ...current.values, [fieldName]: value }, errors: { ...current.errors, [fieldName]: '' } }))
  const updateSearch = (value: string) => { setPage(1); setFilters((current) => ({ ...current, search: value })) }
  const updateRelationFilter = (fieldName: string, value: string) => { setPage(1); setFilters((current) => ({ ...current, relations: { ...current.relations, [fieldName]: value === ALL_FILTER_VALUE ? '' : value } })) }
  const goToPage = (nextPage: number) => setPage(Math.min(totalPages, Math.max(1, nextPage)))
  const handleSubmit = () => {
    const validation = config.validate(formState.values)
    if (!validation.success) { setFormState((current) => ({ ...current, errors: validation.errors })); return }
    saveMutation.mutate(validation.data)
  }
  const handleDelete = (item: AcademicContentItem) => setDeleteTarget(item)
  const confirmDelete = () => { if (deleteTarget) deleteMutation.mutate(deleteTarget) }

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 rounded-3xl border border-primary/10 bg-card/95 p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-1"><h1 className="text-2xl font-bold tracking-tight text-foreground">{t(config.titleKey)}</h1><p className="line-clamp-1 text-sm leading-6 text-muted-foreground">{t(config.descriptionKey)}</p></div>
        <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => listQuery.refetch()} disabled={listQuery.isFetching}><RefreshCcw className="size-4" />{t('actions.refresh')}</Button>{config.fields.length > 0 ? <Button type="button" size="sm" onClick={openCreateForm}><Plus className="size-4" />{t('actions.create')}</Button> : null}</div>
      </div>
      <Card className={`flex min-h-0 flex-1 flex-col rounded-3xl shadow-sm ${config.key === 'quizzes' ? 'quizy-quizzes-table-card' : ''}`}>
        <CardHeader className="shrink-0 space-y-3 py-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="grid flex-1 gap-2 md:grid-cols-2 xl:grid-cols-4 lg:max-w-5xl"><label className="relative block md:col-span-2 xl:col-span-1"><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 ps-10" value={filters.search} placeholder={t('filters.searchPlaceholder')} onChange={(event) => updateSearch(event.target.value)} /></label>{relationFields.map((field) => { const options = field.relationKey ? relations[field.relationKey] ?? [] : []; const selected = filters.relations[field.name] || ALL_FILTER_VALUE; return <CustomSelect key={field.name} value={selected} variant="filter" icon={<SlidersHorizontal />} placeholder={t('filters.all', { field: t(field.labelKey) })} options={[{ value: ALL_FILTER_VALUE, label: t('filters.all', { field: t(field.labelKey) }) }, ...options.map((option) => ({ value: option.id, label: option.name }))]} onValueChange={(value) => updateRelationFilter(field.name, value)} /> })}</div></div></CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
          {listQuery.isLoading ? <div className="space-y-3">{[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-14 w-full rounded-2xl" />)}</div> : listQuery.isError ? <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-destructive/30 bg-destructive/5 p-10 text-center"><DatabaseZap className="mb-3 size-10 text-destructive" /><h2 className="text-lg font-semibold text-foreground">{t('states.error.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t(getApiErrorMessage(listQuery.error))}</p><Button type="button" variant="outline" className="mt-4" onClick={() => listQuery.refetch()}>{t('actions.retry')}</Button></div> : items.length === 0 ? <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center"><DatabaseZap className="mx-auto mb-3 size-10 text-muted-foreground" /><h2 className="text-lg font-semibold text-foreground">{t('states.empty.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('states.empty.description')}</p></div> : <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-background/70"><div className={`${tableScrollClass} min-h-0 overflow-auto`}><Table className={config.key === 'quizzes' ? 'min-w-[920px]' : 'min-w-[760px]'}><TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur"><TableRow>{config.columns.map((column) => <TableHead key={column.key}>{t(column.labelKey)}</TableHead>)}<TableHead className="w-32 text-center">{t('fields.actions')}</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}>{config.columns.map((column) => <TableCell key={column.key} className="max-w-[18rem] truncate">{column.render ? column.render(item, { relations }) : renderCellValue(item, column.key, column.relationKey, relations)}</TableCell>)}<TableCell><div className="flex justify-center gap-2">{config.fields.length > 0 ? <Button type="button" size="icon-sm" variant="outline" onClick={() => openEditForm(item)}><Pencil className="size-4" /></Button> : null}<Button type="button" size="icon-sm" variant="outline" className="text-destructive hover:text-destructive" disabled={deleteMutation.isPending} onClick={() => handleDelete(item)}><Trash2 className="size-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div></div>}
          <div className="mt-3 flex shrink-0 justify-end border-t border-border/70 pt-3"><div className="flex flex-wrap items-center gap-1.5"><Button type="button" size="icon-sm" variant="outline" disabled={page <= 1 || listQuery.isFetching} onClick={() => goToPage(1)} aria-label={t('pagination.first')}>{isRtl ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}</Button><Button type="button" size="icon-sm" variant="outline" disabled={page <= 1 || listQuery.isFetching} onClick={() => goToPage(page - 1)} aria-label={t('pagination.previous')}>{isRtl ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}</Button>{paginationItems.map((item) => item === 'ellipsis-left' || item === 'ellipsis-right' ? <span key={item} className="px-2 text-sm text-muted-foreground">…</span> : <Button key={item} type="button" size="sm" variant={item === page ? 'default' : 'outline'} className="min-w-9 px-3" disabled={listQuery.isFetching} onClick={() => goToPage(item)}>{item}</Button>)}<Button type="button" size="icon-sm" variant="outline" disabled={page >= totalPages || listQuery.isFetching} onClick={() => goToPage(page + 1)} aria-label={t('pagination.next')}>{isRtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}</Button><Button type="button" size="icon-sm" variant="outline" disabled={page >= totalPages || listQuery.isFetching} onClick={() => goToPage(totalPages)} aria-label={t('pagination.last')}>{isRtl ? <ChevronsLeft className="size-4" /> : <ChevronsRight className="size-4" />}</Button></div></div>
        </CardContent>
      </Card>
      <Dialog open={formState.open} onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}>
        <DialogContent className="flex max-h-[88svh] max-w-4xl flex-col overflow-hidden"><DialogHeader className="shrink-0"><DialogTitle>{t(formState.mode === 'edit' ? 'form.editTitle' : 'form.createTitle', { entity: t(config.titleKey) })}</DialogTitle><DialogDescription>{t('form.description')}</DialogDescription></DialogHeader><div className="grid min-h-0 flex-1 gap-4 overflow-y-auto py-2 pe-1 sm:grid-cols-2 xl:grid-cols-3">{config.fields.map((field) => { const fieldError = formState.errors[field.name]; const fieldId = `${config.key}-${field.name}`; const options = field.relationKey ? relations[field.relationKey] ?? [] : []; const optionItems = options.map((option) => ({ value: option.id, label: option.name })); const value = formState.values[field.name]; return <div key={field.name} className={`space-y-2 ${getFieldGridClass(field)}`}><Label htmlFor={fieldId}>{t(field.labelKey)}</Label>{field.type === 'textarea' || field.type === 'json' ? <Textarea id={fieldId} value={getFieldTextValue(value)} placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined} onChange={(event) => updateField(field.name, event.target.value)} /> : field.type === 'checkbox' ? <label className="flex h-11 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-sm"><input type="checkbox" checked={value === true} onChange={(event) => updateField(field.name, event.target.checked)} />{t(field.labelKey)}</label> : field.name === 'countryCallingCode' ? <CountryCodeSelect id={fieldId} value={getFieldTextValue(value)} placeholder={t('form.selectPlaceholder')} onValueChange={(nextValue) => updateField(field.name, nextValue)} /> : field.type === 'select' ? <CustomSelect id={fieldId} value={getFieldTextValue(value) || undefined} placeholder={t('form.selectPlaceholder')} options={optionItems} onValueChange={(nextValue) => updateField(field.name, nextValue)} /> : field.type === 'multi-select' ? <CustomMultiSelect id={fieldId} value={getFieldArrayValue(value)} placeholder={t('form.selectPlaceholder')} options={optionItems} onValueChange={(nextValue) => updateField(field.name, nextValue)} /> : <Input id={fieldId} type={field.type === 'number' ? 'number' : 'text'} value={getFieldTextValue(value)} placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined} onChange={(event) => updateField(field.name, field.type === 'number' ? Number(event.target.value) : event.target.value)} />}{fieldError ? <p className="text-sm text-destructive">{t(fieldError)}</p> : null}</div> })}</div><DialogFooter className="shrink-0 border-t border-border/70 pt-4"><Button type="button" variant="outline" onClick={() => setFormState((current) => ({ ...current, open: false }))}>{t('actions.cancel')}</Button><Button type="button" disabled={saveMutation.isPending} onClick={handleSubmit}>{saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('actions.save')}</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle><DialogDescription>{deleteTarget ? t('messages.deleteConfirm', { name: getDeleteItemName(deleteTarget, t('messages.item')) }) : ''}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('actions.cancel')}</Button><Button type="button" disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>{deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}حذف</Button></DialogFooter></DialogContent>
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
export function QuizzesPage() { return <AcademicContentCrudPage configKey="quizzes" /> }
export function QuestionsPage() { return <AcademicContentCrudPage configKey="questions" /> }
export function CoursesPage() { return <AcademicContentCrudPage configKey="courses" /> }
export function ResourcesPage() { return <AcademicContentCrudPage configKey="resources" /> }
export function AdsPage() { return <AcademicContentCrudPage configKey="ads" /> }
export function PointsOfSalePage() { return <AcademicContentCrudPage configKey="pointsOfSale" /> }
export function QrCodesPage() { return <AcademicContentCrudPage configKey="qrCodes" /> }
export function NotificationsPage() { return <AcademicContentCrudPage configKey="notifications" /> }
export function PageContentsPage() { return <AcademicContentCrudPage configKey="pageContents" /> }
