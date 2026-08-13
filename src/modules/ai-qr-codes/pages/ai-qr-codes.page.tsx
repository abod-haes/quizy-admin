import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, QrCode, RefreshCcw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { aiQrCodesService } from '@/modules/ai-qr-codes/services/ai-qr-codes.service'
import type {
  CatalogOption,
  CreateUnifiedQrRequest,
  QrGrantMode,
  UnifiedQrItem,
} from '@/modules/ai-qr-codes/types/ai-qr-codes.types'
import {
  Alert,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CustomSelect,
  FormField,
  Input,
  PaginatedDataTable,
} from '@/shared/ui'

const PAGE_SIZE = 20

function OptionChecklist({
  items,
  selected,
  emptyMessage,
  onToggle,
}: {
  items: CatalogOption[]
  selected: string[]
  emptyMessage: string
  onToggle: (id: string) => void
}) {
  return (
    <div className="max-h-52 space-y-1 overflow-y-auto rounded-2xl border border-border p-2">
      {items.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm hover:bg-muted/60">
          <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
          <span className="min-w-0 truncate">{item.name ?? item.title ?? item.id}</span>
        </label>
      ))}
      {!items.length ? <p className="p-3 text-center text-xs text-muted-foreground">{emptyMessage}</p> : null}
    </div>
  )
}

function GrantSection({
  title,
  enabled,
  mode,
  items,
  selected,
  selectedLabel,
  allLabel,
  emptyMessage,
  snapshotMessage,
  onEnabledChange,
  onModeChange,
  onToggle,
}: {
  title: string
  enabled: boolean
  mode: QrGrantMode
  items: CatalogOption[]
  selected: string[]
  selectedLabel: string
  allLabel: string
  emptyMessage: string
  snapshotMessage: string
  onEnabledChange: (value: boolean) => void
  onModeChange: (value: QrGrantMode) => void
  onToggle: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
          {title}
        </label>
        {enabled ? (
          <CustomSelect
            value={mode}
            options={[
              { value: 'SELECTED', label: selectedLabel },
              { value: 'ALL', label: allLabel },
            ]}
            onValueChange={(value) => onModeChange(value as QrGrantMode)}
          />
        ) : null}
      </div>
      {enabled && mode === 'SELECTED' ? (
        <OptionChecklist items={items} selected={selected} emptyMessage={emptyMessage} onToggle={onToggle} />
      ) : enabled ? (
        <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{snapshotMessage}</p>
      ) : null}
    </div>
  )
}

export default function AiQrCodesPage() {
  const { t, i18n } = useTranslation('ai-qr-codes')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(1)
  const [validDays, setValidDays] = useState(30)
  const [pointOfSaleId, setPointOfSaleId] = useState('')
  const [courseEnabled, setCourseEnabled] = useState(false)
  const [courseMode, setCourseMode] = useState<QrGrantMode>('SELECTED')
  const [courseIds, setCourseIds] = useState<string[]>([])
  const [quizEnabled, setQuizEnabled] = useState(false)
  const [quizMode, setQuizMode] = useState<QrGrantMode>('SELECTED')
  const [quizIds, setQuizIds] = useState<string[]>([])
  const [aiEnabled, setAiEnabled] = useState(false)
  const [planId, setPlanId] = useState('')
  const [formError, setFormError] = useState('')

  const qrQuery = useQuery({ queryKey: ['unified-qr', page], queryFn: () => aiQrCodesService.list(page, PAGE_SIZE) })
  const pointsQuery = useQuery({ queryKey: ['qr-options', 'points'], queryFn: aiQrCodesService.pointsOfSale })
  const coursesQuery = useQuery({ queryKey: ['qr-options', 'courses'], queryFn: aiQrCodesService.courses })
  const quizzesQuery = useQuery({ queryKey: ['qr-options', 'quizzes'], queryFn: aiQrCodesService.quizzes })
  const plansQuery = useQuery({ queryKey: ['qr-options', 'ai-plans'], queryFn: aiQrCodesService.plans })

  const createMutation = useMutation({
    mutationFn: aiQrCodesService.create,
    onSuccess: async () => {
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['unified-qr'] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: aiQrCodesService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unified-qr'] }),
  })

  const toggle = (setter: Dispatch<SetStateAction<string[]>>, id: string) =>
    setter((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const handleCreate = () => {
    const grants: CreateUnifiedQrRequest['grants'] = []
    if (courseEnabled) {
      if (courseMode === 'SELECTED' && !courseIds.length) return setFormError(t('validation.courseRequired'))
      grants.push({ kind: 'COURSE', mode: courseMode, ...(courseMode === 'SELECTED' ? { entityIds: courseIds } : {}) })
    }
    if (quizEnabled) {
      if (quizMode === 'SELECTED' && !quizIds.length) return setFormError(t('validation.quizRequired'))
      grants.push({ kind: 'QUIZ', mode: quizMode, ...(quizMode === 'SELECTED' ? { entityIds: quizIds } : {}) })
    }
    if (aiEnabled) {
      if (!planId) return setFormError(t('validation.planRequired'))
      grants.push({ kind: 'AI_SUBSCRIPTION', mode: 'SELECTED', planId })
    }
    if (!grants.length) return setFormError(t('validation.grantRequired'))
    if (!Number.isInteger(count) || count < 1 || count > 500) return setFormError(t('validation.countRange'))
    if (!Number.isInteger(validDays) || validDays < 1 || validDays > 3650) return setFormError(t('validation.validDaysRange'))

    setFormError('')
    createMutation.mutate({ grants, count, validDays, ...(pointOfSaleId ? { pointOfSaleId } : {}) })
  }

  const pointOptions = useMemo(
    () => [
      { value: 'none', label: t('placeholders.noPointOfSale') },
      ...(pointsQuery.data?.items ?? []).map((item) => ({ value: item.id, label: item.name ?? item.id })),
    ],
    [pointsQuery.data?.items, t],
  )
  const planOptions = (plansQuery.data ?? []).map((plan) => ({ value: plan.id, label: `${plan.name} (${plan.code})` }))
  const rows = qrQuery.data?.items ?? []
  const totalCount = qrQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const dateLocale = i18n.resolvedLanguage?.startsWith('ar') ? 'ar-SY' : 'en-US'

  const grantSummary = (row: UnifiedQrItem) => {
    const labels = (row.grants ?? []).map((grant) => {
      if (grant.kind === 'COURSE') {
        return grant.mode === 'ALL' ? t('summary.allCourses') : t('summary.courses', { count: grant.items?.length ?? 0 })
      }
      if (grant.kind === 'QUIZ') {
        return grant.mode === 'ALL' ? t('summary.allQuizzes') : t('summary.quizzes', { count: grant.items?.length ?? 0 })
      }
      return grant.plan?.name ? t('summary.aiPlan', { name: grant.plan.name }) : t('summary.aiSubscription')
    })
    return labels.length ? labels.join(' + ') : t('summary.bundle')
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary"><QrCode className="size-5" /><span className="text-sm font-bold">{t('badge')}</span></div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void qrQuery.refetch()}>{t('actions.refresh')}</Button>
      </div>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><PackagePlus className="size-5" />{t('create.title')}</CardTitle><CardDescription>{t('create.description')}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <GrantSection
              title={t('fields.courses')}
              enabled={courseEnabled}
              mode={courseMode}
              items={coursesQuery.data?.items ?? []}
              selected={courseIds}
              selectedLabel={t('modes.selected')}
              allLabel={t('modes.all')}
              emptyMessage={t('placeholders.emptyOptions')}
              snapshotMessage={t('modes.snapshot', { title: t('fields.courses') })}
              onEnabledChange={setCourseEnabled}
              onModeChange={setCourseMode}
              onToggle={(id) => toggle(setCourseIds, id)}
            />
            <GrantSection
              title={t('fields.quizzes')}
              enabled={quizEnabled}
              mode={quizMode}
              items={quizzesQuery.data?.items ?? []}
              selected={quizIds}
              selectedLabel={t('modes.selected')}
              allLabel={t('modes.all')}
              emptyMessage={t('placeholders.emptyOptions')}
              snapshotMessage={t('modes.snapshot', { title: t('fields.quizzes') })}
              onEnabledChange={setQuizEnabled}
              onModeChange={setQuizMode}
              onToggle={(id) => toggle(setQuizIds, id)}
            />
          </div>

          <div className="rounded-2xl border border-border p-4">
            <label className="mb-3 flex items-center gap-2 font-bold"><input type="checkbox" checked={aiEnabled} onChange={(event) => setAiEnabled(event.target.checked)} />{t('fields.aiSubscription')}</label>
            {aiEnabled ? <FormField label={t('fields.plan')}><CustomSelect value={planId || undefined} placeholder={t('placeholders.plan')} options={planOptions} onValueChange={(value) => setPlanId(String(value ?? ''))} /></FormField> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField label={t('fields.count')}><Input type="number" min={1} max={500} value={count} onChange={(event) => setCount(Number(event.target.value))} /></FormField>
            <FormField label={t('fields.validDays')}><Input type="number" min={1} max={3650} value={validDays} onChange={(event) => setValidDays(Number(event.target.value))} /></FormField>
            <FormField label={t('fields.pointOfSale')}><CustomSelect value={pointOfSaleId || 'none'} options={pointOptions} onValueChange={(value) => setPointOfSaleId(value === 'none' ? '' : String(value ?? ''))} /></FormField>
          </div>

          {formError ? <Alert variant="destructive"><AlertTitle>{formError}</AlertTitle></Alert> : null}
          {createMutation.isError ? <Alert variant="destructive"><AlertTitle>{t('messages.createFailed')}</AlertTitle></Alert> : null}
          <div className="flex justify-end"><Button loading={createMutation.isPending} icon={<QrCode className="size-4" />} onClick={handleCreate}>{t('actions.create')}</Button></div>
        </CardContent>
      </Card>

      <PaginatedDataTable<UnifiedQrItem>
        rows={rows}
        loading={qrQuery.isLoading || qrQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('table.summary', { count: totalCount })}
        emptyMessage={t('table.empty')}
        pagination={{ currentPage: page, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: t('table.previous'), nextLabel: t('table.next'), getPageLabel: (pageNumber) => t('table.page', { page: pageNumber }) }}
        columns={[
          { id: 'code', header: t('table.code'), renderCell: (row) => <span className="font-mono text-xs">{row.code}</span> },
          { id: 'content', header: t('table.content'), renderCell: (row) => grantSummary(row) },
          { id: 'status', header: t('table.usage'), renderCell: (row) => row.redeemed ? <Badge color="emerald" variant="outline">{t('table.redeemed')}</Badge> : <Badge color="slate" variant="outline">{t('table.available')}</Badge> },
          { id: 'validUntil', header: t('table.validUntil'), renderCell: (row) => row.validUntil ? new Intl.DateTimeFormat(dateLocale).format(new Date(row.validUntil)) : t('table.noExpiry') },
          { id: 'actions', header: '', renderCell: (row) => <Button size="sm" variant="outline" disabled={Boolean(row.redeemed) || deleteMutation.isPending} icon={<Trash2 className="size-4" />} onClick={() => deleteMutation.mutate(row.id)}>{t('actions.delete')}</Button> },
        ]}
      />
    </section>
  )
}
