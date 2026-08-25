import {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction } from 'react'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import { Download,
  PackagePlus,
  Printer,
  QrCode,
  RefreshCcw,
  Trash2 } from 'lucide-react'
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function downloadQrSvg(item: UnifiedQrItem) {
  if (!item.qrSvg) return
  const blob = new Blob([item.qrSvg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `quizy-qr-${item.code}.svg`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
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
        <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60">
          <input className="size-4 accent-primary" type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
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
    <div className={`rounded-xl border p-4 transition-colors ${enabled ? 'border-primary/30 bg-primary/[0.035]' : 'border-border bg-background'}`}>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 font-semibold">
          <input className="size-4 accent-primary" type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
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
        <OptionChecklist items={items} selected={selected} emptyMessage={emptyMessage} onToggle={onToggle} />
      ) : enabled ? (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">{snapshotMessage}</p>
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
  const [printingId, setPrintingId] = useState<string | null>(null)
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

  const qrQuery = useQuery({ queryKey: ['unified-qr', page], queryFn: () => aiQrCodesService.list(page, PAGE_SIZE) })
  const pointsQuery = useQuery({ queryKey: ['qr-options', 'points'], queryFn: aiQrCodesService.pointsOfSale })
  const coursesQuery = useQuery({ queryKey: ['qr-options', 'courses'], queryFn: aiQrCodesService.courses })
  const quizzesQuery = useQuery({ queryKey: ['qr-options', 'quizzes'], queryFn: aiQrCodesService.quizzes })
  const plansQuery = useQuery({ queryKey: ['qr-options', 'ai-plans'], queryFn: aiQrCodesService.plans })

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
  const isRtl = i18n.dir() === 'rtl'

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

  const printItems = (items: UnifiedQrItem[]) => {
    const printable = items.filter((item) => item.qrSvg)
    if (!printable.length) return
    const popup = window.open('', '_blank', 'width=1100,height=820')
    if (!popup) return
    popup.opener = null
    const cards = printable.map((item) => {
      const expiry = item.validUntil ? new Intl.DateTimeFormat(dateLocale).format(new Date(item.validUntil)) : t('table.noExpiry')
      return `
        <article class="qr-card">
          <img src="${escapeHtml(svgDataUri(item.qrSvg!))}" alt="QR ${escapeHtml(item.code)}" />
          <strong>${escapeHtml(item.code)}</strong>
          <span>${escapeHtml(grantSummary(item))}</span>
          <small>${escapeHtml(t('table.validUntil'))}: ${escapeHtml(expiry)}</small>
        </article>`
    }).join('')
    popup.document.open()
    popup.document.write(`<!doctype html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(t('generated.title'))}</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; color: #171226; background: #fff; }
  .sheet { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6mm; }
  .qr-card { min-height: 82mm; break-inside: avoid; border: 1px solid #ded7ef; border-radius: 4mm; padding: 5mm; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.5mm; text-align: center; }
  .qr-card img { width: 43mm; height: 43mm; display: block; }
  .qr-card strong { font: 700 10pt ui-monospace, SFMono-Regular, Menlo, monospace; direction: ltr; }
  .qr-card span { font-size: 9pt; line-height: 1.35; }
  .qr-card small { font-size: 8pt; color: #6f6685; }
  @media screen { body { padding: 20px; background: #f5f2fb; } .sheet { max-width: 1100px; margin: auto; } .qr-card { background: #fff; } }
</style>
</head>
<body><main class="sheet">${cards}</main><script>window.onload=()=>{setTimeout(()=>window.print(),120)}</script></body>
</html>`)
    popup.document.close()
  }

  const reprint = async (row: UnifiedQrItem) => {
    setPrintingId(row.id)
    try {
      const printable = await aiQrCodesService.detail(row.id)
      if (printable.qrSvg) printItems([printable])
    } finally {
      setPrintingId(null)
    }
  }

  const openCreateDialog = () => {
    resetCreateForm()
    setCreateDialogOpen(true)
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        icon={<QrCode />}
        title={t('title')}
        description={t('description')}
        actions={<><Button variant="outline" icon={<RefreshCcw />} onClick={() => void qrQuery.refetch()}>{t('actions.refresh')}</Button><Button icon={<PackagePlus />} onClick={openCreateDialog}>{t('actions.create')}</Button></>}
      />

      <PaginatedDataTable<UnifiedQrItem>
        className="min-h-0 flex-1"
        rows={rows}
        loading={qrQuery.isLoading || qrQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={t('table.summary', { count: totalCount })}
        emptyMessage={t('table.empty')}
        pagination={{ currentPage: page, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: t('table.previous'), nextLabel: t('table.next'), getPageLabel: (pageNumber) => t('table.page', { page: pageNumber }) }}
        columns={[
          { id: 'code', header: t('table.code'), renderCell: (row) => <span className="font-mono text-xs" dir="ltr">{row.code}</span> },
          { id: 'content', header: t('table.content'), renderCell: (row) => grantSummary(row) },
          { id: 'status', header: t('table.usage'), renderCell: (row) => row.redeemed ? <Badge color="emerald" variant="outline">{t('table.redeemed')}</Badge> : <Badge color="slate" variant="outline">{t('table.available')}</Badge> },
          { id: 'validUntil', header: t('table.validUntil'), renderCell: (row) => row.validUntil ? new Intl.DateTimeFormat(dateLocale).format(new Date(row.validUntil)) : t('table.noExpiry') },
          {
            id: 'actions',
            header: '',
            renderCell: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" loading={printingId === row.id} icon={<Printer className="size-4" />} onClick={() => void reprint(row)}>{t('actions.reprint')}</Button>
                <ConfirmDialog
                  title={t('actions.delete')}
                  confirmLabel={t('actions.delete')}
                  confirmingLabel={t('actions.delete')}
                  cancelLabel={t('actions.close')}
                  onConfirm={async () => { await deleteMutation.mutateAsync(row.id) }}
                  trigger={
                    <Button size="sm" variant="outline" disabled={Boolean(row.redeemed) || deleteMutation.isPending} icon={<Trash2 className="size-4" />}>
                      {t('actions.delete')}
                    </Button>
                  }
                />
              </div>
            ),
          },
        ]}
      />

      <Sheet open={createDialogOpen} onOpenChange={(open) => { if (!createMutation.isPending) setCreateDialogOpen(open) }}>
        <SheetContent className="max-w-6xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><PackagePlus className="size-5 text-primary" />{t('create.title')}</SheetTitle>
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

            <div className={`rounded-xl border p-4 transition-colors ${aiEnabled ? 'border-primary/30 bg-primary/[0.035]' : 'border-border'}`}>
              <label className="flex cursor-pointer items-center gap-2 font-semibold">
                <input className="size-4 accent-primary" type="checkbox" checked={aiEnabled} onChange={(event) => setAiEnabled(event.target.checked)} />
                {t('fields.aiSubscription')}
              </label>
              {aiEnabled ? <div className="mt-3"><FormField label={t('fields.plan')}><CustomSelect value={planId || undefined} placeholder={t('placeholders.plan')} options={planOptions} onValueChange={(value) => setPlanId(String(value ?? ''))} /></FormField></div> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField label={t('fields.count')}><Input type="number" min={1} max={500} value={count} onChange={(event) => setCount(Number(event.target.value))} /></FormField>
              <FormField label={t('fields.validDays')}><Input type="number" min={1} max={3650} value={validDays} onChange={(event) => setValidDays(Number(event.target.value))} /></FormField>
              <FormField label={t('fields.pointOfSale')}><CustomSelect value={pointOfSaleId || 'none'} options={pointOptions} onValueChange={(value) => setPointOfSaleId(value === 'none' ? '' : String(value ?? ''))} /></FormField>
            </div>

            {formError ? <Alert variant="destructive"><AlertTitle>{formError}</AlertTitle></Alert> : null}
            {createMutation.isError ? <Alert variant="destructive"><AlertTitle>{t('messages.createFailed')}</AlertTitle></Alert> : null}
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" disabled={createMutation.isPending} onClick={() => setCreateDialogOpen(false)}>{t('actions.close')}</Button>
            <Button type="button" loading={createMutation.isPending} icon={<QrCode className="size-4" />} onClick={handleCreate}>{t('actions.create')}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={generatedDialogOpen} onOpenChange={setGeneratedDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode className="size-5 text-primary" />{t('generated.title')}</DialogTitle>
            <DialogDescription>{t('generated.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTitle>{t('generated.count', { count: generatedItems.length })}</AlertTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t('generated.printHint')}</p>
            </Alert>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {generatedItems.slice(0, GENERATED_PREVIEW_LIMIT).map((item) => (
                <article key={item.id} className="flex min-w-0 flex-col items-center rounded-xl border border-border bg-background p-4 text-center">
                  {item.qrSvg ? <img className="size-40 max-w-full" src={svgDataUri(item.qrSvg)} alt={`${t('generated.singleTitle')} ${item.code}`} /> : <QrCode className="size-24 text-muted-foreground" />}
                  <strong className="mt-3 max-w-full break-all font-mono text-xs" dir="ltr">{item.code}</strong>
                  <span className="mt-1 text-xs leading-5 text-muted-foreground">{grantSummary(item)}</span>
                  {item.qrSvg ? <Button className="mt-3 w-full" size="sm" variant="outline" icon={<Download className="size-4" />} onClick={() => downloadQrSvg(item)}>{t('actions.downloadSvg')}</Button> : null}
                </article>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setGeneratedDialogOpen(false)}>{t('actions.close')}</Button>
            <Button type="button" icon={<Printer className="size-4" />} disabled={!generatedItems.some((item) => item.qrSvg)} onClick={() => printItems(generatedItems)}>{t('actions.printPdf')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}