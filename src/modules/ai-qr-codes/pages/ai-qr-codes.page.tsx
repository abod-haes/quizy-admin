import { useState } from 'react'
import { Plus, QrCode, Sparkles } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { aiQrCodesService } from '@/modules/ai-qr-codes/services/ai-qr-codes.service'
import {
  AiSubscriptionPlan,
  type AiQrCode,
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
  useToast,
} from '@/shared/ui'

const PAGE_SIZE = 20
const ZERO_GUID = '00000000-0000-0000-0000-000000000000'

const getPlanLabel = (plan?: AiSubscriptionPlan | null) => {
  if (plan === AiSubscriptionPlan.Pro) return 'Pro'
  if (plan === AiSubscriptionPlan.Ultra) return 'Ultra'
  return 'Plus'
}

export default function AiQrCodesPage() {
  const { t, i18n } = useTranslation('ai-qr-codes')
  const { success } = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(10)
  const [pointOfSaleId, setPointOfSaleId] = useState('')
  const [plan, setPlan] = useState<AiSubscriptionPlan>(AiSubscriptionPlan.Plus)
  const [formError, setFormError] = useState('')

  const qrQuery = useQuery({
    queryKey: ['ai-qr-codes', page, PAGE_SIZE],
    queryFn: () => aiQrCodesService.list(page, PAGE_SIZE),
  })
  const pointsQuery = useQuery({
    queryKey: ['points-of-sale', 'ai-qr-options'],
    queryFn: aiQrCodesService.pointsOfSale,
  })

  const createMutation = useMutation({
    mutationFn: aiQrCodesService.createBulk,
    onSuccess: () => {
      success(t('messages.created'))
      void queryClient.invalidateQueries({ queryKey: ['ai-qr-codes'] })
    },
  })

  const handleCreate = () => {
    if (!Number.isInteger(count) || count <= 0 || !pointOfSaleId) {
      setFormError(t('validation.required'))
      return
    }
    setFormError('')
    createMutation.mutate({
      count,
      subjectId: ZERO_GUID,
      pointOfSaleId,
      qrType: 8,
      aiSubscriptionPlan: plan,
    })
  }

  const rows = qrQuery.data?.items ?? []
  const totalCount = qrQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const pointOptions = (pointsQuery.data?.items ?? []).map((item) => ({
    value: item.id,
    label: item.name ?? item.title ?? item.code ?? item.id,
  }))

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-primary/15 bg-card p-6 shadow-sm">
        <Badge variant="outline" color="primary" className="mb-3 rounded-full px-3">
          <Sparkles className="size-3.5" /> {t('badge')}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="size-5" />{t('create.title')}</CardTitle>
          <CardDescription>{t('create.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <FormField label={t('fields.pointOfSale')}>
            <CustomSelect
              value={pointOfSaleId || undefined}
              placeholder={t('placeholders.pointOfSale')}
              options={pointOptions}
              disabled={pointsQuery.isLoading || createMutation.isPending}
              onValueChange={(value) => setPointOfSaleId(String(value ?? ''))}
            />
          </FormField>
          <FormField label={t('fields.plan')}>
            <CustomSelect
              value={String(plan)}
              options={[
                { value: '1', label: 'Plus' },
                { value: '2', label: 'Pro' },
                { value: '3', label: 'Ultra' },
              ]}
              disabled={createMutation.isPending}
              onValueChange={(value) => setPlan(Number(value) as AiSubscriptionPlan)}
            />
          </FormField>
          <FormField label={t('fields.count')} error={formError || undefined}>
            <Input
              type="number"
              min={1}
              step={1}
              value={count}
              disabled={createMutation.isPending}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </FormField>
          <div className="lg:col-span-3 flex justify-end">
            <Button
              icon={<QrCode className="size-4" />}
              loading={createMutation.isPending}
              onClick={handleCreate}
            >
              {t('actions.create')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {createMutation.isError ? <Alert variant="destructive"><AlertTitle>{t('messages.createFailed')}</AlertTitle></Alert> : null}

      <PaginatedDataTable<AiQrCode>
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
            renderCell: (row: AiQrCode) => row.code ?? row.qrCode ?? '-',
          },
          {
            id: 'plan',
            header: t('table.plan'),
            renderCell: (row: AiQrCode) => <Badge variant="outline" color="primary">{getPlanLabel(row.aiSubscriptionPlan)}</Badge>,
          },
          {
            id: 'pointOfSale',
            header: t('table.pointOfSale'),
            renderCell: (row: AiQrCode) => row.pointOfSaleName ?? row.pointOfSale?.name ?? '-',
          },
          {
            id: 'assigned',
            header: t('table.assigned'),
            renderCell: (row: AiQrCode) => row.isAssigned || row.studentId ? t('values.yes') : t('values.no'),
          },
          {
            id: 'active',
            header: t('table.active'),
            renderCell: (row: AiQrCode) => row.isActive === false ? t('values.no') : t('values.yes'),
          },
          {
            id: 'createdAt',
            header: t('table.createdAt'),
            renderCell: (row: AiQrCode) => row.createdAt ? new Intl.DateTimeFormat(i18n.language).format(new Date(row.createdAt)) : '-',
          },
        ]}
      />
    </section>
  )
}
