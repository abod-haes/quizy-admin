import {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Download,
  PackagePlus,
  Printer,
  QrCode,
  RefreshCcw,
  Trash2,
} from 'lucide-react'
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
  ConfirmDialog,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  PaginatedDataTable,
  PageHeader,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui'

const PAGE_SIZE = 20
const DEFAULT_COUNT = 1
const DEFAULT_VALID_DAYS = 30
const GENERATED_PREVIEW_LIMIT = 24

function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function qrSvgWithCode(item: UnifiedQrItem) {
  if (!item.qrSvg) return null
  const openingEnd = item.qrSvg.indexOf('>')
  const closingStart = item.qrSvg.lastIndexOf('</svg>')
  if (openingEnd < 0 || closingStart < 0) return item.qrSvg

  const qrBody = item.qrSvg.slice(openingEnd + 1, closingStart)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="370" viewBox="0 0 320 370">
  <rect width="320" height="370" fill="#ffffff"/>
  <g transform="translate(20 20)">${qrBody}</g>
  <text x="160" y="340" text-anchor="middle" direction="ltr" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" font-weight="700" fill="#171226">${escapeXml(item.code)}</text>
</svg>`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}

function printPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.src = url
  frame.title = 'Quizy QR PDF'
  frame.style.position = 'fixed'
  frame.style.width = '1px'
  frame.style.height = '1px'
  frame.style.insetInlineEnd = '0'
  frame.style.bottom = '0'
  frame.style.opacity = '0'
  frame.style.pointerEvents = 'none'

  frame.onload = () => {
    window.setTimeout(() => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    }, 250)
  }

  document.body.appendChild(frame)
  window.setTimeout(() => {
    frame.remove()
    URL.revokeObjectURL(url)
  }, 60_000)
}

function downloadQrSvg(item: UnifiedQrItem) {
  const svg = qrSvgWithCode(item)
  if (!svg) return
  downloadBlob(
    new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
    `quizy-qr-${item.code}.svg`,
  )
}

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
    <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
      {items.map((item) => (
        <label
          key={item.id}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60"
        >
          <input
            className="size-4 accent-primary"
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => onToggle(item.id)}
          />
          <span className="min-w-0 truncate">{item.name ?? item.title ?? item.id}</span>
        </label>
      ))}
      {!items.length ? (
        <p className="p-3 text-center text-xs text-muted-foreground">{emptyMessage}</p>
      ) : null}
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
    <div
      className={`rounded-xl border p-4 transition-colors ${
        enabled
          ? 'border-primary/25 bg-primary/[0.025]'
          : 'border-border bg-background'
      }`}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 font-semibold">
          <input
            className="size-4 accent-primary"
            type="checkbox"
            checked={enabled}
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          {title}
        </label>
        {enabled ? (
          <div className="w-full sm:w-64">
            <CustomSelect
              value={mode}
              options={[
                { value: 'SELECTED', label: selectedLabel },
                { value: 'ALL', label: allLabel },
              ]}
              onValueChange={(value) => onModeChange(value as QrGrantMode)}
            />
          </div>
        ) : null}
      </div>

      {enabled && mode === 'SELECTED' ? (
        <OptionChecklist
          items={items}
          selected={selected}
          emptyMessage={emptyMessage}
          onToggle={onToggle}
        />
      ) : enabled ? (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">
          {snapshotMessage}
        </p>
      ) : null}
    </div>
  )
}

export default function AiQrCodesPage() {
  const { t, i18n } = useTranslation('ai-qr-codes')
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [generatedDialogOpen, setGeneratedDialogOpen] = useState(false)
  const [generatedItems, setGeneratedItems] = useState<UnifiedQrItem[]>([])
  const [downloadingQrId, setDownloadingQrId] = useState<string | null>(null)
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [validDays, setValidDays] = useState(DEFAULT_VALID_DAYS)
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

  const qrQuery = useQuery({
    queryKey: ['unified-qr', page],
    queryFn: () => aiQrCodesService.list(page, PAGE_SIZE),
  })
  const pointsQuery = useQuery({
    queryKey: ['qr-options', 'points'],
    queryFn: aiQrCodesService.pointsOfSale,
  })
  const coursesQuery = useQuery({
    queryKey: ['qr-options', 'courses'],
    queryFn: aiQrCodesService.courses,
  })
  const quizzesQuery = useQuery({
    queryKey: ['qr-options', 'quizzes'],
    queryFn: aiQrCodesService.quizzes,
  })
  const plansQuery = useQuery({
    queryKey: ['qr-options', 'ai-plans'],
    queryFn: aiQrCodesService.plans,
  })

  const createMutation = useMutation({
    mutationFn: aiQrCodesService.create,
    onSuccess: async (result) => {
      setFormError('')
      setGeneratedItems(result.items)
      setCreateDialogOpen(false)
      setGeneratedDialogOpen(true)
      setPage(1)
      await queryClient.invalidateQueries({ queryKey: ['unified-qr'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: aiQrCodesService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unified-qr'] }),
  })

  const pdfMutation = useMutation({
    mutationFn: (ids: string[]) => aiQrCodesService.downloadPdf(ids),
    onSuccess: (blob) => downloadBlob(blob, 'quizy-qr-codes.pdf'),
  })

  const printMutation = useMutation({
    mutationFn: (ids: string[]) => aiQrCodesService.downloadPdf(ids),
    onSuccess: printPdfBlob,
  })

  const resetCreateForm = () => {
    setCount(DEFAULT_COUNT)
    setValidDays(DEFAULT_VALID_DAYS)
    setPointOfSaleId('')
    setCourseEnabled(false)
    setCourseMode('SELECTED')
    setCourseIds([])
    setQuizEnabled(false)
    setQuizMode('SELECTED')
    setQuizIds([])
    setAiEnabled(false)
    setPlanId('')
    setFormError('')
    createMutation.reset()
  }

  const toggle = (setter: Dispatch<SetStateAction<string[]>>, id: string) =>
    setter((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )

  const handleCreate = () => {
    const grants: CreateUnifiedQrRequest['grants'] = []

    if (courseEnabled) {
      if (courseMode === 'SELECTED' && !courseIds.length) {
        setFormError(t('validation.courseRequired'))
        return
      }
      grants.push({
        kind: 'COURSE',
        mode: courseMode,
        ...(courseMode === 'SELECTED' ? { entityIds: courseIds } : {}),
      })
    }

    if (quizEnabled) {
      if (quizMode === 'SELECTED' && !quizIds.length) {
        setFormError(t('validation.quizRequired'))
        return
      }
      grants.push({
        kind: 'QUIZ',
        mode: quizMode,
        ...(quizMode === 'SELECTED' ? { entityIds: quizIds } : {}),
      })
    }

    if (aiEnabled) {
      if (!planId) {
        setFormError(t('validation.planRequired'))
        return
      }
      grants.push({ kind: 'AI_SUBSCRIPTION', mode: 'SELECTED', planId })
    }

    if (!grants.length) {
      setFormError(t('validation.grantRequired'))
      return
    }
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      setFormError(t('validation.countRange'))
      return
    }
    if (!Number.isInteger(validDays) || validDays < 1 || validDays > 3650) {
      setFormError(t('validation.validDaysRange'))
      return
    }

    setFormError('')
    createMutation.mutate({
      grants,
      count,
      validDays,
      ...(pointOfSaleId ? { pointOfSaleId } : {}),
    })
  }

  const pointOptions = useMemo(
    () => [
      { value: 'none', label: t('placeholders.noPointOfSale') },
      ...(pointsQuery.data?.items ?? []).map((item) => ({
        value: item.id,
        label: item.name ?? item.id,
      })),
    ],
    [pointsQuery.data?.items, t],
  )

  const planOptions = (plansQuery.data ?? []).map((plan) => ({
    value: plan.id,
    label: `${plan.name} (${plan.code})`,
  }))

  const rows = qrQuery.data?.items ?? []
  const totalCount = qrQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const dateLocale = i18n.resolvedLanguage?.startsWith('ar') ? 'ar-SY' : 'en-US'

  const grantSummary = (row: UnifiedQrItem) => {
    const labels = (row.grants ?? []).map((grant) => {
      if (grant.kind === 'COURSE') {
        return grant.mode === 'ALL'
          ? t('summary.allCourses')
          : t('summary.courses', { count: grant.items?.length ?? 0 })
      }
      if (grant.kind === 'QUIZ') {
        return grant.mode === 'ALL'
          ? t('summary.allQuizzes')
          : t('summary.quizzes', { count: grant.items?.length ?? 0 })
      }
      return grant.plan?.name
        ? t('summary.aiPlan', { name: grant.plan.name })
        : t('summary.aiSubscription')
    })
    return labels.length ? labels.join(' + ') : t('summary.bundle')
  }

  const downloadSingleQr = async (row: UnifiedQrItem) => {
    if (row.qrSvg) {
      downloadQrSvg(row)
      return
    }

    setDownloadingQrId(row.id)
    try {
      const detailed = await aiQrCodesService.detail(row.id)
      downloadQrSvg(detailed)
    } finally {
      setDownloadingQrId(null)
    }
  }

  const openCreateDialog = () => {
    resetCreateForm()
    setCreateDialogOpen(true)
  }

  const deleteAction = (row: UnifiedQrItem) => (
    <ConfirmDialog
      title={t('actions.delete')}
      confirmLabel={t('actions.delete')}
      confirmingLabel={t('actions.delete')}
      cancelLabel={t('actions.close')}
      onConfirm={async () => {
        await deleteMutation.mutateAsync(row.id)
      }}
      trigger={
        <Button
          size="sm"
          variant="outline"
          disabled={Boolean(row.redeemed) || deleteMutation.isPending}
          icon={<Trash2 className="size-4" />}
        >
          {t('actions.delete')}
        </Button>
      }
    />
  )

  const generatedIds = generatedItems.map((item) => item.id)
  const generatedBusy = pdfMutation.isPending || printMutation.isPending

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<QrCode />}
        title={t('title')}
        description={t('description')}
        actions={
          <>
            <Button
              variant="outline"
              icon={<RefreshCcw />}
              onClick={() => void qrQuery.refetch()}
            >
              {t('actions.refresh')}
            </Button>
            <Button icon={<PackagePlus />} onClick={openCreateDialog}>
              {t('actions.create')}
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 md:hidden">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-1">
          {!qrQuery.isLoading && !rows.length ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {t('table.empty')}
            </div>
          ) : null}

          {rows.map((row) => (
            <article
              key={row.id}
              className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-base font-bold text-foreground" dir="ltr">
                    {row.code}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {grantSummary(row)}
                  </p>
                </div>
                {row.redeemed ? (
                  <Badge color="emerald" variant="outline">
                    {t('table.redeemed')}
                  </Badge>
                ) : (
                  <Badge color="slate" variant="outline">
                    {t('table.available')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{t('table.validUntil')}</span>
                <span>
                  {row.validUntil
                    ? new Intl.DateTimeFormat(dateLocale).format(new Date(row.validUntil))
                    : t('table.noExpiry')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={downloadingQrId === row.id}
                  icon={<Download className="size-4" />}
                  onClick={() => void downloadSingleQr(row)}
                >
                  {t('actions.downloadQr')}
                </Button>
                {deleteAction(row)}
              </div>
            </article>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
          <span className="text-xs text-muted-foreground">
            {t('table.summary', { count: totalCount })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t('table.previous')}
            </Button>
            <span className="min-w-8 text-center text-sm font-semibold">
              {page}/{totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              {t('table.next')}
            </Button>
          </div>
        </div>
      </div>

      <PaginatedDataTable<UnifiedQrItem>
        className="hidden min-h-0 flex-1 md:flex"
        rows={rows}
        loading={qrQuery.isLoading || qrQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('table.summary', { count: totalCount })}
        emptyMessage={t('table.empty')}
        pagination={{
          currentPage: page,
          totalPages,
          pageSize: PAGE_SIZE,
          onPageChange: setPage,
          previousLabel: t('table.previous'),
          nextLabel: t('table.next'),
          getPageLabel: (pageNumber) => t('table.page', { page: pageNumber }),
        }}
        columns={[
          {
            id: 'code',
            header: t('table.code'),
            renderCell: (row) => (
              <span className="font-mono text-xs" dir="ltr">
                {row.code}
              </span>
            ),
          },
          {
            id: 'content',
            header: t('table.content'),
            renderCell: (row) => grantSummary(row),
          },
          {
            id: 'status',
            header: t('table.usage'),
            renderCell: (row) =>
              row.redeemed ? (
                <Badge color="emerald" variant="outline">
                  {t('table.redeemed')}
                </Badge>
              ) : (
                <Badge color="slate" variant="outline">
                  {t('table.available')}
                </Badge>
              ),
          },
          {
            id: 'validUntil',
            header: t('table.validUntil'),
            renderCell: (row) =>
              row.validUntil
                ? new Intl.DateTimeFormat(dateLocale).format(new Date(row.validUntil))
                : t('table.noExpiry'),
          },
          {
            id: 'actions',
            header: '',
            renderCell: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={downloadingQrId === row.id}
                  icon={<Download className="size-4" />}
                  onClick={() => void downloadSingleQr(row)}
                >
                  {t('actions.downloadQr')}
                </Button>
                {deleteAction(row)}
              </div>
            ),
          },
        ]}
      />

      <Sheet
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!createMutation.isPending) setCreateDialogOpen(open)
        }}
      >
        <SheetContent className="max-w-6xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <PackagePlus className="size-5 text-primary" />
              {t('create.title')}
            </SheetTitle>
            <SheetDescription>{t('create.description')}</SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
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

            <div
              className={`rounded-xl border p-4 transition-colors ${
                aiEnabled ? 'border-primary/25 bg-primary/[0.025]' : 'border-border'
              }`}
            >
              <label className="flex cursor-pointer items-center gap-2 font-semibold">
                <input
                  className="size-4 accent-primary"
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(event) => setAiEnabled(event.target.checked)}
                />
                {t('fields.aiSubscription')}
              </label>
              {aiEnabled ? (
                <div className="mt-3">
                  <FormField label={t('fields.plan')}>
                    <CustomSelect
                      value={planId || undefined}
                      placeholder={t('placeholders.plan')}
                      options={planOptions}
                      onValueChange={(value) => setPlanId(String(value ?? ''))}
                    />
                  </FormField>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField label={t('fields.count')}>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                />
              </FormField>
              <FormField label={t('fields.validDays')}>
                <Input
                  type="number"
                  min={1}
                  max={3650}
                  value={validDays}
                  onChange={(event) => setValidDays(Number(event.target.value))}
                />
              </FormField>
              <FormField label={t('fields.pointOfSale')}>
                <CustomSelect
                  value={pointOfSaleId || 'none'}
                  options={pointOptions}
                  onValueChange={(value) =>
                    setPointOfSaleId(value === 'none' ? '' : String(value ?? ''))
                  }
                />
              </FormField>
            </div>

            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>{formError}</AlertTitle>
              </Alert>
            ) : null}
            {createMutation.isError ? (
              <Alert variant="destructive">
                <AlertTitle>{t('messages.createFailed')}</AlertTitle>
              </Alert>
            ) : null}
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setCreateDialogOpen(false)}
            >
              {t('actions.close')}
            </Button>
            <Button
              type="button"
              loading={createMutation.isPending}
              icon={<QrCode className="size-4" />}
              onClick={handleCreate}
            >
              {t('actions.create')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={generatedDialogOpen} onOpenChange={setGeneratedDialogOpen}>
        <DialogContent className="max-h-[88svh] max-w-3xl overflow-hidden p-0">
          <div className="flex max-h-[88svh] flex-col">
            <DialogHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <QrCode className="size-5" />
                </span>
                {t('generated.title')}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t('generated.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="mb-4 rounded-lg bg-muted/45 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {t('generated.count', { count: generatedItems.length })}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t('generated.downloadHint')}
                </p>
              </div>

              <div
                className={
                  generatedItems.length === 1
                    ? 'mx-auto max-w-sm'
                    : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
                }
              >
                {generatedItems
                  .slice(0, GENERATED_PREVIEW_LIMIT)
                  .map((item) => (
                    <article
                      key={item.id}
                      className="flex min-w-0 flex-col items-center rounded-xl bg-muted/25 p-4 text-center shadow-sm ring-1 ring-border/60"
                    >
                      <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-black/5">
                        {item.qrSvg ? (
                          <img
                            className="size-44 max-w-full"
                            src={svgDataUri(item.qrSvg)}
                            alt={`${t('generated.singleTitle')} ${item.code}`}
                          />
                        ) : (
                          <div className="flex size-44 items-center justify-center">
                            <QrCode className="size-24 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <strong
                        className="mt-3 max-w-full break-all font-mono text-xs"
                        dir="ltr"
                      >
                        {item.code}
                      </strong>
                      <span className="mt-1 text-xs leading-5 text-muted-foreground">
                        {grantSummary(item)}
                      </span>
                      {item.qrSvg ? (
                        <Button
                          className="mt-3 w-full"
                          size="sm"
                          variant="outline"
                          icon={<Download className="size-4" />}
                          onClick={() => downloadQrSvg(item)}
                        >
                          {t('actions.downloadQr')}
                        </Button>
                      ) : null}
                    </article>
                  ))}
              </div>

              {pdfMutation.isError || printMutation.isError ? (
                <Alert className="mt-4" variant="destructive">
                  <AlertTitle>{t('messages.pdfFailed')}</AlertTitle>
                </Alert>
              ) : null}
            </div>

            <DialogFooter className="border-t border-border/60 bg-background px-5 py-4 sm:px-6">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={generatedBusy}
                  onClick={() => setGeneratedDialogOpen(false)}
                >
                  {t('actions.close')}
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    loading={printMutation.isPending}
                    icon={<Printer className="size-4" />}
                    disabled={!generatedItems.length || pdfMutation.isPending}
                    onClick={() => printMutation.mutate(generatedIds)}
                  >
                    {t('actions.print')}
                  </Button>
                  <Button
                    type="button"
                    loading={pdfMutation.isPending}
                    icon={<Download className="size-4" />}
                    disabled={!generatedItems.length || printMutation.isPending}
                    onClick={() => pdfMutation.mutate(generatedIds)}
                  >
                    {t('actions.downloadPdf')}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
