import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Ban, Loader2, Plus, RefreshCcw, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PaginatedDataTable,
  ToggleSwitch,
} from '@/shared/ui'

type AiPlan = {
  id: string
  code: string
  name: string
  isActive: boolean
  isFree: boolean
}

type StudentOption = {
  id: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
}

type AiSubscriptionAssignment = {
  id: string
  userId: string
  userName?: string | null
  userPhone?: string | null
  planId: string
  planCode: string
  planName: string
  status: string
  maxTokens: number
  usedTokens: number
  remainingTokens: number
  startsAt: string
  expiresAt?: string | null
  periodEndsAt?: string | null
  autoRenewTokens: boolean
  source: string
}

type AssignPayload = {
  planId: string
  durationDays?: number
  autoRenewTokens?: boolean
  source?: string
}

const ALL = '__all__'
const PAGE_SIZE = 20

function studentLabel(student: StudentOption) {
  const name = student.name || [student.firstName, student.lastName].filter(Boolean).join(' ').trim()
  return [name, student.phoneNumber].filter(Boolean).join(' — ') || student.id
}

export default function AiSubscriptionsPage() {
  const { t } = useTranslation('admin-pages')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [assignOpen, setAssignOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [planId, setPlanId] = useState('')
  const [durationDays, setDurationDays] = useState('')
  const [autoRenewTokens, setAutoRenewTokens] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<AiSubscriptionAssignment | null>(null)

  const assignmentsQuery = useQuery({
    queryKey: ['admin-ai', 'subscriptions'],
    queryFn: () => api.get<AiSubscriptionAssignment[]>(API_ENDPOINTS.ai.subscriptions),
  })
  const plansQuery = useQuery({
    queryKey: ['admin-ai', 'plans', 'subscriptions'],
    queryFn: () => api.get<AiPlan[]>(API_ENDPOINTS.ai.plans, { params: { includeInactive: true } }),
    staleTime: 5 * 60 * 1000,
  })
  const studentsQuery = useQuery({
    queryKey: ['admin-ai', 'subscription-students'],
    queryFn: () => api.get<StudentOption[]>(API_ENDPOINTS.students.brief),
    staleTime: 5 * 60 * 1000,
  })

  const planOptions = useMemo(() => (plansQuery.data ?? []).map((plan) => ({
    value: plan.id,
    label: `${plan.name} (${plan.code})${plan.isActive ? '' : ` — ${t('aiSubscriptions.inactive')}`}`,
  })), [plansQuery.data, t])
  const activePlanOptions = useMemo(() => (plansQuery.data ?? []).filter((plan) => plan.isActive).map((plan) => ({
    value: plan.id,
    label: `${plan.name} (${plan.code})`,
  })), [plansQuery.data])
  const studentOptions = useMemo(() => (studentsQuery.data ?? []).map((student) => ({
    value: student.id,
    label: studentLabel(student),
  })), [studentsQuery.data])

  const normalizedSearch = search.trim().toLowerCase()
  const filtered = (assignmentsQuery.data ?? []).filter((assignment) => {
    if (planFilter !== ALL && assignment.planId !== planFilter) return false
    if (statusFilter !== ALL && assignment.status !== statusFilter) return false
    if (!normalizedSearch) return true
    return [assignment.userName, assignment.userPhone, assignment.planName, assignment.planCode]
      .filter((value): value is string => typeof value === 'string')
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const closeAssign = () => {
    setAssignOpen(false)
    setUserId('')
    setPlanId('')
    setDurationDays('')
    setAutoRenewTokens(true)
  }

  const assignMutation = useMutation({
    mutationFn: () => {
      const payload: AssignPayload = {
        planId,
        ...(durationDays ? { durationDays: Number(durationDays) } : {}),
        autoRenewTokens,
        source: 'dashboard',
      }
      return api.post(
        `${API_ENDPOINTS.ai.subscriptions}/users/${encodeURIComponent(userId)}/assign`,
        payload,
      )
    },
    onSuccess: async () => {
      toast.success(t('aiSubscriptions.assigned'))
      closeAssign()
      await queryClient.invalidateQueries({ queryKey: ['admin-ai', 'subscriptions'] })
    },
    onError: () => toast.error(t('aiSubscriptions.assignError')),
  })

  const cancelMutation = useMutation({
    mutationFn: (targetUserId: string) => api.post(
      `${API_ENDPOINTS.ai.subscriptions}/users/${encodeURIComponent(targetUserId)}/cancel`,
    ),
    onSuccess: async () => {
      toast.success(t('aiSubscriptions.cancelled'))
      setCancelTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-ai', 'subscriptions'] })
    },
    onError: () => toast.error(t('aiSubscriptions.cancelError')),
  })

  const statusOptions = [
    { value: ALL, label: t('aiSubscriptions.allStatuses') },
    { value: 'active', label: t('aiSubscriptions.status.active') },
    { value: 'cancelled', label: t('aiSubscriptions.status.cancelled') },
    { value: 'expired', label: t('aiSubscriptions.status.expired') },
    { value: 'replaced', label: t('aiSubscriptions.status.replaced') },
  ]

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('aiSubscriptions.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('aiSubscriptions.description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={assignmentsQuery.isFetching} onClick={() => void assignmentsQuery.refetch()}><RefreshCcw className="size-4" />{t('common.refresh')}</Button>
          <Button onClick={() => setAssignOpen(true)}><Plus className="size-4" />{t('aiSubscriptions.assign')}</Button>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1fr_16rem_14rem]">
        <label className="relative block">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-10" value={search} placeholder={t('aiSubscriptions.searchPlaceholder')} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        </label>
        <CustomSelect value={planFilter} options={[{ value: ALL, label: t('aiSubscriptions.allPlans') }, ...planOptions]} onValueChange={(value) => { setPlanFilter(String(value)); setPage(1) }} />
        <CustomSelect value={statusFilter} options={statusOptions} onValueChange={(value) => { setStatusFilter(String(value)); setPage(1) }} />
      </div>

      <Card className="rounded-3xl"><CardContent className="p-4">
        <PaginatedDataTable<AiSubscriptionAssignment>
          rows={rows}
          loading={assignmentsQuery.isLoading || assignmentsQuery.isFetching}
          getRowId={(row) => row.id}
          summaryText={t('aiSubscriptions.summary', { count: filtered.length })}
          emptyMessage={t('aiSubscriptions.empty')}
          pagination={{ currentPage: safePage, totalPages, pageSize: PAGE_SIZE, onPageChange: setPage, previousLabel: t('common.previous'), nextLabel: t('common.next'), getPageLabel: (pageNumber) => t('common.page', { page: pageNumber }) }}
          columns={[
            { id: 'user', header: t('aiSubscriptions.user'), renderCell: (row) => <div><p className="font-semibold">{row.userName || '-'}</p><p className="text-xs text-muted-foreground">{row.userPhone || '-'}</p></div> },
            { id: 'plan', header: t('aiSubscriptions.plan'), renderCell: (row) => `${row.planName} (${row.planCode})` },
            { id: 'tokens', header: t('aiSubscriptions.tokens'), renderCell: (row) => `${row.usedTokens} / ${row.maxTokens}` },
            { id: 'status', header: t('aiSubscriptions.statusLabel'), renderCell: (row) => <Badge variant="outline" color={row.status === 'active' ? 'emerald' : 'slate'}>{t(`aiSubscriptions.status.${row.status}`, { defaultValue: row.status })}</Badge> },
            { id: 'expiry', header: t('aiSubscriptions.expiresAt'), renderCell: (row) => row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : t('aiSubscriptions.noExpiry') },
            { id: 'actions', header: '', renderCell: (row) => row.status === 'active' ? <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancelTarget(row)}><Ban className="size-4" />{t('aiSubscriptions.cancelSubscription')}</Button> : null },
          ]}
        />
      </CardContent></Card>

      <Dialog open={assignOpen} onOpenChange={(open) => { if (!open && !assignMutation.isPending) closeAssign() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('aiSubscriptions.assignTitle')}</DialogTitle><DialogDescription>{t('aiSubscriptions.assignDescription')}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2"><Label>{t('aiSubscriptions.user')}</Label><CustomSelect value={userId || undefined} placeholder={t('aiSubscriptions.selectUser')} options={studentOptions} onValueChange={(value) => setUserId(String(value))} /></div>
            <div className="space-y-2"><Label>{t('aiSubscriptions.plan')}</Label><CustomSelect value={planId || undefined} placeholder={t('aiSubscriptions.selectPlan')} options={activePlanOptions} onValueChange={(value) => setPlanId(String(value))} /></div>
            <div className="space-y-2"><Label>{t('aiSubscriptions.durationDays')}</Label><Input type="number" min={1} max={3650} value={durationDays} placeholder={t('aiSubscriptions.defaultDuration')} onChange={(event) => setDurationDays(event.target.value)} /></div>
            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3"><span className="text-sm font-medium">{t('aiSubscriptions.autoRenew')}</span><ToggleSwitch checked={autoRenewTokens} onCheckedChange={setAutoRenewTokens} /></div>
          </div>
          <DialogFooter><Button variant="outline" disabled={assignMutation.isPending} onClick={closeAssign}>{t('common.cancel')}</Button><Button disabled={!userId || !planId || assignMutation.isPending} onClick={() => assignMutation.mutate()}>{assignMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}{t('aiSubscriptions.assign')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => { if (!open && !cancelMutation.isPending) setCancelTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t('aiSubscriptions.cancelTitle')}</DialogTitle><DialogDescription>{cancelTarget ? t('aiSubscriptions.cancelConfirm', { name: cancelTarget.userName || cancelTarget.userPhone || cancelTarget.userId }) : ''}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" disabled={cancelMutation.isPending} onClick={() => setCancelTarget(null)}>{t('common.cancel')}</Button><Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={cancelMutation.isPending} onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget.userId)}>{cancelMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('aiSubscriptions.cancelSubscription')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
