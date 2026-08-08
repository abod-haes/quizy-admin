import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, QrCode, RefreshCcw, Trash2 } from 'lucide-react'

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
  onToggle,
}: {
  items: CatalogOption[]
  selected: string[]
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
      {!items.length ? <p className="p-3 text-center text-xs text-muted-foreground">لا يوجد محتوى متاح.</p> : null}
    </div>
  )
}

function GrantSection({
  title,
  enabled,
  mode,
  items,
  selected,
  onEnabledChange,
  onModeChange,
  onToggle,
}: {
  title: string
  enabled: boolean
  mode: QrGrantMode
  items: CatalogOption[]
  selected: string[]
  onEnabledChange: (value: boolean) => void
  onModeChange: (value: QrGrantMode) => void
  onToggle: (id: string) => void
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} />
          {title}
        </label>
        {enabled ? (
          <CustomSelect
            value={mode}
            options={[
              { value: 'SELECTED', label: 'عناصر محددة' },
              { value: 'ALL', label: 'كل الموجود وقت إنشاء الرمز' },
            ]}
            onValueChange={(value) => onModeChange(value as QrGrantMode)}
          />
        ) : null}
      </div>
      {enabled && mode === 'SELECTED' ? (
        <OptionChecklist items={items} selected={selected} onToggle={onToggle} />
      ) : enabled ? (
        <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          سيتم أخذ Snapshot لكل {title} المنشورة حالياً، لذلك أي محتوى يضاف لاحقاً لن يدخل في هذا الرمز تلقائياً.
        </p>
      ) : null}
    </div>
  )
}

function grantSummary(row: UnifiedQrItem) {
  const labels = (row.grants ?? []).map((grant) => {
    if (grant.kind === 'COURSE') return grant.mode === 'ALL' ? 'كل الكورسات' : `${grant.items?.length ?? 0} كورس`
    if (grant.kind === 'QUIZ') return grant.mode === 'ALL' ? 'كل الاختبارات' : `${grant.items?.length ?? 0} اختبار`
    return grant.plan?.name ? `AI: ${grant.plan.name}` : 'اشتراك AI'
  })
  return labels.length ? labels.join(' + ') : 'حزمة محتوى'
}

export default function AiQrCodesPage() {
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

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) =>
    setter((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const handleCreate = () => {
    const grants: CreateUnifiedQrRequest['grants'] = []
    if (courseEnabled) {
      if (courseMode === 'SELECTED' && !courseIds.length) return setFormError('اختر كورساً واحداً على الأقل أو اختر كل الكورسات.')
      grants.push({ kind: 'COURSE', mode: courseMode, ...(courseMode === 'SELECTED' ? { entityIds: courseIds } : {}) })
    }
    if (quizEnabled) {
      if (quizMode === 'SELECTED' && !quizIds.length) return setFormError('اختر اختباراً واحداً على الأقل أو اختر كل الاختبارات.')
      grants.push({ kind: 'QUIZ', mode: quizMode, ...(quizMode === 'SELECTED' ? { entityIds: quizIds } : {}) })
    }
    if (aiEnabled) {
      if (!planId) return setFormError('اختر خطة Quizy AI.')
      grants.push({ kind: 'AI_SUBSCRIPTION', mode: 'SELECTED', planId })
    }
    if (!grants.length) return setFormError('اختر كورسات أو اختبارات أو اشتراك AI على الأقل.')
    if (!Number.isInteger(count) || count < 1 || count > 500) return setFormError('عدد الرموز يجب أن يكون بين 1 و500.')
    if (!Number.isInteger(validDays) || validDays < 1 || validDays > 3650) return setFormError('مدة الصلاحية يجب أن تكون بين يوم و3650 يوم.')

    setFormError('')
    createMutation.mutate({ grants, count, validDays, ...(pointOfSaleId ? { pointOfSaleId } : {}) })
  }

  const pointOptions = useMemo(
    () => [{ value: 'none', label: 'بدون نقطة بيع' }, ...(pointsQuery.data?.items ?? []).map((item) => ({ value: item.id, label: item.name ?? item.id }))],
    [pointsQuery.data?.items],
  )
  const planOptions = (plansQuery.data ?? []).map((plan) => ({ value: plan.id, label: `${plan.name} (${plan.code})` }))
  const rows = qrQuery.data?.items ?? []
  const totalCount = qrQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <section className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-primary"><QrCode className="size-5" /><span className="text-sm font-bold">Unified QR</span></div><h1 className="text-2xl font-bold">رموز Quizy</h1><p className="mt-1 text-sm text-muted-foreground">رمز واحد يمكن أن يفتح كورسات واختبارات واشتراك AI معاً بأي تركيبة.</p></div>
        <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void qrQuery.refetch()}>تحديث</Button>
      </div>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><PackagePlus className="size-5" />إنشاء حزمة QR</CardTitle><CardDescription>اختر نوعاً واحداً أو عدة أنواع. يمكن توليد حتى 500 رمز بنفس الحزمة.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <GrantSection title="الكورسات" enabled={courseEnabled} mode={courseMode} items={coursesQuery.data?.items ?? []} selected={courseIds} onEnabledChange={setCourseEnabled} onModeChange={setCourseMode} onToggle={(id) => toggle(setCourseIds, id)} />
            <GrantSection title="الاختبارات" enabled={quizEnabled} mode={quizMode} items={quizzesQuery.data?.items ?? []} selected={quizIds} onEnabledChange={setQuizEnabled} onModeChange={setQuizMode} onToggle={(id) => toggle(setQuizIds, id)} />
          </div>

          <div className="rounded-2xl border border-border p-4">
            <label className="mb-3 flex items-center gap-2 font-bold"><input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />اشتراك Quizy AI</label>
            {aiEnabled ? <FormField label="الخطة"><CustomSelect value={planId || undefined} placeholder="اختر الخطة" options={planOptions} onValueChange={(value) => setPlanId(String(value ?? ''))} /></FormField> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="عدد الرموز"><Input type="number" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value))} /></FormField>
            <FormField label="مدة الصلاحية بالأيام"><Input type="number" min={1} max={3650} value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} /></FormField>
            <FormField label="نقطة البيع"><CustomSelect value={pointOfSaleId || 'none'} options={pointOptions} onValueChange={(value) => setPointOfSaleId(value === 'none' ? '' : String(value ?? ''))} /></FormField>
          </div>

          {formError ? <Alert variant="destructive"><AlertTitle>{formError}</AlertTitle></Alert> : null}
          {createMutation.isError ? <Alert variant="destructive"><AlertTitle>فشل إنشاء رموز QR.</AlertTitle></Alert> : null}
          <div className="flex justify-end"><Button loading={createMutation.isPending} icon={<QrCode className="size-4" />} onClick={handleCreate}>إنشاء الرموز</Button></div>
        </CardContent>
      </Card>

      <PaginatedDataTable<UnifiedQrItem>
        rows={rows}
        loading={qrQuery.isLoading || qrQuery.isFetching}
        getRowId={(row) => row.id}
        summaryText={`${totalCount} رمز`}
        emptyMessage="لا توجد رموز QR موحدة بعد."
        pagination={{ currentPage: page, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: 'السابق', nextLabel: 'التالي', getPageLabel: (pageNumber) => `صفحة ${pageNumber}` }}
        columns={[
          { id: 'code', header: 'الكود', renderCell: (row) => <span className="font-mono text-xs">{row.code}</span> },
          { id: 'content', header: 'المحتوى', renderCell: (row) => grantSummary(row) },
          { id: 'status', header: 'الاستخدام', renderCell: (row) => row.redeemed ? <Badge color="emerald" variant="outline">مستخدم</Badge> : <Badge color="slate" variant="outline">متاح</Badge> },
          { id: 'validUntil', header: 'الصلاحية', renderCell: (row) => row.validUntil ? new Intl.DateTimeFormat('ar-SY').format(new Date(row.validUntil)) : 'بدون انتهاء' },
          { id: 'actions', header: '', renderCell: (row) => <Button size="sm" variant="outline" disabled={Boolean(row.redeemed) || deleteMutation.isPending} icon={<Trash2 className="size-4" />} onClick={() => deleteMutation.mutate(row.id)}>حذف</Button> },
        ]}
      />
    </section>
  )
}
