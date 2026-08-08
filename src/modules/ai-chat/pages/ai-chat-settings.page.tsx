import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BrainCircuit, Pencil, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react'

import { aiChatSettingsService } from '@/modules/ai-chat/services/ai-chat-settings.service'
import type { AiPlanInput, AiSubscriptionPlan } from '@/modules/ai-chat/types/ai-chat-settings.types'
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
  FormField,
  Input,
  Skeleton,
} from '@/shared/ui'

const EMPTY_FORM: AiPlanInput & { code: string } = {
  code: '',
  name: '',
  description: '',
  tokenLimit: 20000,
  tokenResetDays: 30,
  subscriptionDurationDays: 90,
  isFree: false,
  isActive: true,
  sortOrder: 0,
}

function PlanForm({
  value,
  editing,
  pending,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: AiPlanInput & { code: string }
  editing: boolean
  pending: boolean
  onChange: (patch: Partial<AiPlanInput & { code: string }>) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  return (
    <Card className="rounded-3xl border-primary/20">
      <CardHeader>
        <CardTitle>{editing ? 'تعديل خطة الذكاء الاصطناعي' : 'إضافة خطة جديدة'}</CardTitle>
        <CardDescription>الخطة محفوظة في Nest وتظهر مباشرة في الاشتراكات والـQR الموحد.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormField label="رمز الخطة">
          <Input value={value.code} disabled={editing || pending} onChange={(e) => onChange({ code: e.target.value.toUpperCase() })} placeholder="PLUS" />
        </FormField>
        <FormField label="اسم الخطة">
          <Input value={value.name} disabled={pending} onChange={(e) => onChange({ name: e.target.value })} />
        </FormField>
        <FormField label="حد التوكنات">
          <Input type="number" min={1} value={value.tokenLimit} disabled={pending} onChange={(e) => onChange({ tokenLimit: Number(e.target.value) })} />
        </FormField>
        <FormField label="إعادة التوكنات كل (يوم)">
          <Input type="number" min={1} max={3650} value={value.tokenResetDays} disabled={pending} onChange={(e) => onChange({ tokenResetDays: Number(e.target.value) })} />
        </FormField>
        <FormField label="مدة الاشتراك بالأيام">
          <Input type="number" min={1} max={3650} value={value.subscriptionDurationDays ?? ''} disabled={pending} onChange={(e) => onChange({ subscriptionDurationDays: e.target.value ? Number(e.target.value) : null })} />
        </FormField>
        <FormField label="ترتيب العرض">
          <Input type="number" value={value.sortOrder ?? 0} disabled={pending} onChange={(e) => onChange({ sortOrder: Number(e.target.value) })} />
        </FormField>
        <FormField label="الوصف" className="md:col-span-2 xl:col-span-3">
          <Input value={value.description ?? ''} disabled={pending} onChange={(e) => onChange({ description: e.target.value })} />
        </FormField>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={Boolean(value.isActive)} disabled={pending} onChange={(e) => onChange({ isActive: e.target.checked })} /> فعالة
        </label>
        {!editing ? (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={Boolean(value.isFree)} disabled={pending} onChange={(e) => onChange({ isFree: e.target.checked })} /> خطة مجانية
          </label>
        ) : null}
        <div className="flex items-center justify-end gap-2 md:col-span-2 xl:col-span-3">
          <Button variant="outline" disabled={pending} onClick={onCancel} icon={<X className="size-4" />}>إلغاء</Button>
          <Button loading={pending} onClick={onSubmit} icon={<Save className="size-4" />}>حفظ</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AiChatSettingsPage() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const plansQuery = useQuery({ queryKey: ['admin-ai', 'plans'], queryFn: aiChatSettingsService.plans })
  const analyticsQuery = useQuery({ queryKey: ['admin-ai', 'analytics'], queryFn: aiChatSettingsService.analytics })

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId
        ? aiChatSettingsService.updatePlan(editingId, form)
        : aiChatSettingsService.createPlan(form),
    onSuccess: async () => {
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await queryClient.invalidateQueries({ queryKey: ['admin-ai'] })
    },
  })
  const removeMutation = useMutation({
    mutationFn: aiChatSettingsService.removePlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ai', 'plans'] }),
  })

  const analytics = analyticsQuery.data
  const metricCards = useMemo(
    () => [
      ['المستخدمون النشطون', analytics?.summary.activeUsers ?? 0],
      ['المحادثات', analytics?.summary.conversations ?? 0],
      ['الأسئلة', analytics?.summary.questions ?? 0],
      ['إجمالي التوكنات', analytics?.summary.totalTokens ?? 0],
    ],
    [analytics],
  )

  const startCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }
  const startEdit = (plan: AiSubscriptionPlan) => {
    setEditingId(plan.id)
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description ?? '',
      tokenLimit: plan.tokenLimit,
      tokenResetDays: plan.tokenResetDays,
      subscriptionDurationDays: plan.subscriptionDurationDays,
      isFree: plan.isFree,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    })
    setShowForm(true)
  }
  const submit = () => {
    if (!form.name.trim() || (!editingId && !form.code.trim()) || form.tokenLimit <= 0 || form.tokenResetDays <= 0) return
    saveMutation.mutate()
  }

  if (plansQuery.isLoading || analyticsQuery.isLoading) {
    return <section className="space-y-4"><Skeleton className="h-32 rounded-3xl" /><Skeleton className="h-72 rounded-3xl" /></section>
  }

  return (
    <section className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BrainCircuit className="size-6" /></div>
          <div><h1 className="text-2xl font-bold">Quizy AI</h1><p className="mt-1 text-sm text-muted-foreground">إدارة خطط الاشتراك ومراقبة الاستخدام الحقيقي من Nest.</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => { void plansQuery.refetch(); void analyticsQuery.refetch() }}>تحديث</Button>
          <Button icon={<Plus className="size-4" />} onClick={startCreate}>إضافة خطة</Button>
        </div>
      </div>

      {(plansQuery.isError || analyticsQuery.isError) ? <Alert variant="destructive"><AlertTitle>تعذر تحميل بيانات الذكاء الاصطناعي.</AlertTitle></Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(([label, value]) => (
          <Card key={String(label)} className="rounded-2xl"><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{new Intl.NumberFormat().format(Number(value))}</p></CardContent></Card>
        ))}
      </div>

      {showForm ? <PlanForm value={form} editing={Boolean(editingId)} pending={saveMutation.isPending} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} onCancel={() => setShowForm(false)} onSubmit={submit} /> : null}

      <Card className="rounded-3xl">
        <CardHeader><CardTitle>خطط الاشتراك</CardTitle><CardDescription>لا يوجد enum ثابت في الواجهة؛ كل الخطط تأتي من قاعدة البيانات.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {(plansQuery.data ?? []).map((plan) => {
            const usage = analytics?.plans.find((item) => item.planId === plan.id)
            return (
              <div key={plan.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{plan.name}</p><Badge variant="outline" color="primary">{plan.code}</Badge>{plan.isFree ? <Badge variant="outline" color="emerald">مجانية</Badge> : null}{!plan.isActive ? <Badge variant="outline" color="slate">موقفة</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">{new Intl.NumberFormat().format(plan.tokenLimit)} توكن / {plan.tokenResetDays} يوم • {usage?.activeSubscriptions ?? 0} اشتراك فعال</p></div>
                <div className="flex gap-2"><Button size="sm" variant="outline" icon={<Pencil className="size-4" />} onClick={() => startEdit(plan)}>تعديل</Button>{!plan.isFree ? <Button size="sm" variant="outline" icon={<Trash2 className="size-4" />} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(plan.id)}>حذف</Button> : null}</div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </section>
  )
}
