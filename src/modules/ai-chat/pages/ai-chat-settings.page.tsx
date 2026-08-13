import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BrainCircuit, Pencil, Plus, RefreshCcw, Save, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { aiChatSettingsService } from '@/modules/ai-chat/services/ai-chat-settings.service'
import type {
  AiSubscriptionPlan,
  CreateAiPlanInput,
  UpdateAiPlanInput,
} from '@/modules/ai-chat/types/ai-chat-settings.types'
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

type AiPlanFormValue = {
  code: string
  name: string
  description: string
  tokenLimit: number
  tokenResetDays: number
  subscriptionDurationDays: number | ''
  isFree: boolean
  isActive: boolean
  sortOrder: number
}

const EMPTY_FORM: AiPlanFormValue = {
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
  value: AiPlanFormValue
  editing: boolean
  pending: boolean
  onChange: (patch: Partial<AiPlanFormValue>) => void
  onCancel: () => void
  onSubmit: () => void
}) {
  const { t } = useTranslation('ai-chat')

  return (
    <Card className="rounded-3xl border-primary/20">
      <CardHeader>
        <CardTitle>{t(editing ? 'form.editTitle' : 'form.createTitle')}</CardTitle>
        <CardDescription>{t('form.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormField label={t('form.code')}>
          <Input
            value={value.code}
            disabled={editing || pending}
            onChange={(event) => onChange({ code: event.target.value.toUpperCase() })}
            placeholder="PLUS"
          />
        </FormField>
        <FormField label={t('form.name')}>
          <Input value={value.name} disabled={pending} onChange={(event) => onChange({ name: event.target.value })} />
        </FormField>
        <FormField label={t('form.tokenLimit')}>
          <Input type="number" min={1} value={value.tokenLimit} disabled={pending} onChange={(event) => onChange({ tokenLimit: Number(event.target.value) })} />
        </FormField>
        <FormField label={t('form.tokenResetDays')}>
          <Input type="number" min={1} max={3650} value={value.tokenResetDays} disabled={pending} onChange={(event) => onChange({ tokenResetDays: Number(event.target.value) })} />
        </FormField>
        <FormField label={t('form.subscriptionDurationDays')}>
          <Input
            type="number"
            min={1}
            max={3650}
            value={value.subscriptionDurationDays}
            disabled={pending}
            onChange={(event) => onChange({ subscriptionDurationDays: event.target.value ? Number(event.target.value) : '' })}
          />
        </FormField>
        <FormField label={t('form.sortOrder')}>
          <Input type="number" value={value.sortOrder} disabled={pending} onChange={(event) => onChange({ sortOrder: Number(event.target.value) })} />
        </FormField>
        <FormField label={t('form.descriptionField')} className="md:col-span-2 xl:col-span-3">
          <Input value={value.description} disabled={pending} onChange={(event) => onChange({ description: event.target.value })} />
        </FormField>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={value.isActive} disabled={pending} onChange={(event) => onChange({ isActive: event.target.checked })} />
          {t('form.active')}
        </label>
        {!editing ? (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={value.isFree} disabled={pending} onChange={(event) => onChange({ isFree: event.target.checked })} />
            {t('form.free')}
          </label>
        ) : null}
        <div className="flex items-center justify-end gap-2 md:col-span-2 xl:col-span-3">
          <Button variant="outline" disabled={pending} onClick={onCancel} icon={<X className="size-4" />}>
            {t('actions.cancel')}
          </Button>
          <Button loading={pending} onClick={onSubmit} icon={<Save className="size-4" />}>
            {t('actions.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AiChatSettingsPage() {
  const { t } = useTranslation('ai-chat')
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AiPlanFormValue>(EMPTY_FORM)

  const plansQuery = useQuery({ queryKey: ['admin-ai', 'plans'], queryFn: aiChatSettingsService.plans })
  const analyticsQuery = useQuery({ queryKey: ['admin-ai', 'analytics'], queryFn: aiChatSettingsService.analytics })

  const saveMutation = useMutation({
    mutationFn: () => {
      const sharedPayload = {
        name: form.name.trim(),
        description: form.description.trim(),
        tokenLimit: form.tokenLimit,
        tokenResetDays: form.tokenResetDays,
        ...(form.subscriptionDurationDays === '' ? {} : { subscriptionDurationDays: form.subscriptionDurationDays }),
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      }

      if (editingId) {
        const payload: UpdateAiPlanInput = sharedPayload
        return aiChatSettingsService.updatePlan(editingId, payload)
      }

      const payload: CreateAiPlanInput = {
        ...sharedPayload,
        code: form.code.trim().toUpperCase(),
        isFree: form.isFree,
      }
      return aiChatSettingsService.createPlan(payload)
    },
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
      [t('metrics.activeUsers'), analytics?.summary.activeUsers ?? 0],
      [t('metrics.conversations'), analytics?.summary.conversations ?? 0],
      [t('metrics.questions'), analytics?.summary.questions ?? 0],
      [t('metrics.totalTokens'), analytics?.summary.totalTokens ?? 0],
    ],
    [analytics, t],
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
      subscriptionDurationDays: plan.subscriptionDurationDays ?? '',
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
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BrainCircuit className="size-6" /></div>
          <div><h1 className="text-2xl font-bold">{t('title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('description')}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => { void plansQuery.refetch(); void analyticsQuery.refetch() }}>{t('actions.refresh')}</Button>
          <Button icon={<Plus className="size-4" />} onClick={startCreate}>{t('actions.addPlan')}</Button>
        </div>
      </div>

      {(plansQuery.isError || analyticsQuery.isError) ? <Alert variant="destructive"><AlertTitle>{t('states.errorTitle')}</AlertTitle></Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(([label, value]) => (
          <Card key={String(label)} className="rounded-2xl"><CardContent className="pt-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{new Intl.NumberFormat().format(Number(value))}</p></CardContent></Card>
        ))}
      </div>

      {showForm ? <PlanForm value={form} editing={Boolean(editingId)} pending={saveMutation.isPending} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} onCancel={() => setShowForm(false)} onSubmit={submit} /> : null}

      <Card className="rounded-3xl">
        <CardHeader><CardTitle>{t('plans.title')}</CardTitle><CardDescription>{t('plans.description')}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {(plansQuery.data ?? []).map((plan) => {
            const usage = analytics?.plans.find((item) => item.planId === plan.id)
            return (
              <div key={plan.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{plan.name}</p><Badge variant="outline" color="primary">{plan.code}</Badge>{plan.isFree ? <Badge variant="outline" color="emerald">{t('plans.free')}</Badge> : null}{!plan.isActive ? <Badge variant="outline" color="slate">{t('plans.inactive')}</Badge> : null}</div><p className="mt-1 text-sm text-muted-foreground">{t('plans.usage', { tokens: new Intl.NumberFormat().format(plan.tokenLimit), days: plan.tokenResetDays, subscriptions: usage?.activeSubscriptions ?? 0 })}</p></div>
                <div className="flex gap-2"><Button size="sm" variant="outline" icon={<Pencil className="size-4" />} onClick={() => startEdit(plan)}>{t('actions.edit')}</Button>{!plan.isFree ? <Button size="sm" variant="outline" icon={<Trash2 className="size-4" />} disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(plan.id)}>{t('actions.delete')}</Button> : null}</div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </section>
  )
}
