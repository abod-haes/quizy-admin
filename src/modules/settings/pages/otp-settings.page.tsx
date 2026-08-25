import {
  useState } from 'react'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import { KeyRound,
  Loader2,
  RefreshCcw,
  ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { toast } from '@/shared/lib/toast'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CustomSelect,
  Input,
  Label,
  DataTable,
  type DataTableColumn,
} from '@/shared/ui'
import {
  otpSettingsService,
  type CreatedOtpApiKey,
} from '@/modules/settings/services/otp-settings.service'

function messageFromError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return null
}

export default function OtpSettingsPage() {
  const { t } = useTranslation('otp-settings')
  const queryClient = useQueryClient()
  const [clientName, setClientName] = useState('')
  const [clientSlug, setClientSlug] = useState('')
  const [hourlyLimit, setHourlyLimit] = useState(100)
  const [dailyLimit, setDailyLimit] = useState(500)
  const [keyClientId, setKeyClientId] = useState('')
  const [keyName, setKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<CreatedOtpApiKey | null>(null)

  const clientsQuery = useQuery({ queryKey: ['otp-settings', 'clients'], queryFn: otpSettingsService.clients })
  const apiKeysQuery = useQuery({ queryKey: ['otp-settings', 'api-keys'], queryFn: otpSettingsService.apiKeys })
  const requestsQuery = useQuery({ queryKey: ['otp-settings', 'requests'], queryFn: () => otpSettingsService.requests(1, 10) })
  const summaryQuery = useQuery({ queryKey: ['otp-settings', 'summary'], queryFn: otpSettingsService.summary })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['otp-settings'] })
  }

  const createClientMutation = useMutation({
    mutationFn: () => otpSettingsService.createClient({
      name: clientName.trim(),
      slug: clientSlug.trim(),
      hourlyOtpLimit: hourlyLimit,
      dailyOtpLimit: dailyLimit,
    }),
    onSuccess: async () => {
      toast.success(t('messages.clientCreated'))
      setClientName('')
      setClientSlug('')
      setHourlyLimit(100)
      setDailyLimit(500)
      await refresh()
    },
    onError: (error) => toast.error(messageFromError(error) ?? t('messages.error')),
  })

  const toggleClientMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => otpSettingsService.updateClient(id, { isActive }),
    onSuccess: refresh,
    onError: (error) => toast.error(messageFromError(error) ?? t('messages.error')),
  })

  const createKeyMutation = useMutation({
    mutationFn: () => otpSettingsService.createApiKey({ clientId: keyClientId, name: keyName.trim() }),
    onSuccess: async (result) => {
      setCreatedKey(result)
      setKeyName('')
      toast.success(t('messages.keyCreated'))
      await refresh()
    },
    onError: (error) => toast.error(messageFromError(error) ?? t('messages.error')),
  })

  const revokeKeyMutation = useMutation({
    mutationFn: otpSettingsService.revokeApiKey,
    onSuccess: async () => {
      toast.success(t('messages.keyRevoked'))
      await refresh()
    },
    onError: (error) => toast.error(messageFromError(error) ?? t('messages.error')),
  })

  const clients = clientsQuery.data ?? []
  const apiKeys = apiKeysQuery.data ?? []
  const requests = requestsQuery.data?.items ?? []

  const clientColumns: DataTableColumn<(typeof clients)[number]>[] = [
    { id: 'name', header: t('clients.name'), renderCell: (client) => client.name },
    { id: 'slug', header: t('clients.slug'), renderCell: (client) => <span dir="ltr">{client.slug}</span> },
    { id: 'hourlyLimit', header: t('clients.hourlyLimit'), renderCell: (client) => client.hourlyOtpLimit },
    { id: 'dailyLimit', header: t('clients.dailyLimit'), renderCell: (client) => client.dailyOtpLimit },
    { id: 'keys', header: t('clients.keys'), renderCell: (client) => client.apiKeyCount },
    { id: 'status', header: t('clients.status'), renderCell: (client) => client.isActive ? t('status.active') : t('status.inactive') },
    { id: 'actions', header: t('actions.actions'), renderCell: (client) => <Button size="sm" variant="outline" disabled={toggleClientMutation.isPending} onClick={() => toggleClientMutation.mutate({ id: client.id, isActive: !client.isActive })}>{client.isActive ? t('actions.disable') : t('actions.enable')}</Button> },
  ]

  const apiKeyColumns: DataTableColumn<(typeof apiKeys)[number]>[] = [
    { id: 'name', header: t('keys.name'), renderCell: (key) => key.name },
    { id: 'client', header: t('keys.client'), renderCell: (key) => key.client.name },
    { id: 'prefix', header: t('keys.prefix'), renderCell: (key) => <span dir="ltr">{key.prefix}</span> },
    { id: 'status', header: t('keys.status'), renderCell: (key) => key.status },
    { id: 'lastUsed', header: t('keys.lastUsed'), renderCell: (key) => key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : '-' },
    { id: 'actions', header: t('actions.actions'), renderCell: (key) => key.status === 'ACTIVE' ? <Button size="sm" variant="outline" disabled={revokeKeyMutation.isPending} onClick={() => revokeKeyMutation.mutate(key.id)}>{t('actions.revoke')}</Button> : '-' },
  ]

  const requestColumns: DataTableColumn<(typeof requests)[number]>[] = [
    { id: 'phone', header: t('requests.phone'), renderCell: (request) => <span dir="ltr">{request.phoneNumber}</span> },
    { id: 'client', header: t('requests.client'), renderCell: (request) => request.client?.name ?? '-' },
    { id: 'purpose', header: t('requests.purpose'), renderCell: (request) => request.purpose },
    { id: 'status', header: t('requests.status'), renderCell: (request) => request.status },
    { id: 'createdAt', header: t('requests.createdAt'), renderCell: (request) => new Date(request.createdAt).toLocaleString() },
  ]

  return (
    <section className="flex min-h-0 w-full flex-col gap-4 overflow-auto pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={() => void refresh()}>
          {t('actions.refresh')}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('summary.clients')}</p><p className="mt-1 text-2xl font-bold">{clients.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('summary.sent')}</p><p className="mt-1 text-2xl font-bold">{summaryQuery.data?.today.sent ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('summary.verified')}</p><p className="mt-1 text-2xl font-bold">{summaryQuery.data?.today.verified ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{t('summary.worker')}</p><p className="mt-1 text-lg font-bold">{summaryQuery.data?.worker.status ?? '-'}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('clients.createTitle')}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="otp-client-name">{t('clients.name')}</Label><Input id="otp-client-name" value={clientName} onChange={(event) => setClientName(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="otp-client-slug">{t('clients.slug')}</Label><Input id="otp-client-slug" value={clientSlug} onChange={(event) => setClientSlug(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="otp-hourly-limit">{t('clients.hourlyLimit')}</Label><Input id="otp-hourly-limit" type="number" min={1} value={hourlyLimit} onChange={(event) => setHourlyLimit(Number(event.target.value))} /></div>
            <div className="space-y-2"><Label htmlFor="otp-daily-limit">{t('clients.dailyLimit')}</Label><Input id="otp-daily-limit" type="number" min={1} value={dailyLimit} onChange={(event) => setDailyLimit(Number(event.target.value))} /></div>
            <div className="sm:col-span-2"><Button disabled={!clientName.trim() || !clientSlug.trim() || createClientMutation.isPending} onClick={() => createClientMutation.mutate()}>{createClientMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('actions.createClient')}</Button></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('keys.createTitle')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>{t('keys.client')}</Label><CustomSelect value={keyClientId || undefined} onValueChange={setKeyClientId} placeholder={t('keys.selectClient')} options={clients.map((client) => ({ value: client.id, label: `${client.name} (${client.slug})` }))} /></div>
            <div className="space-y-2"><Label htmlFor="otp-key-name">{t('keys.name')}</Label><Input id="otp-key-name" value={keyName} onChange={(event) => setKeyName(event.target.value)} /></div>
            <Button disabled={!keyClientId || !keyName.trim() || createKeyMutation.isPending} onClick={() => createKeyMutation.mutate()}>{createKeyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}{t('actions.createKey')}</Button>
            {createdKey ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-4" />{t('keys.oneTimeTitle')}</div>
                <p className="mt-2 text-sm text-muted-foreground">{t('keys.oneTimeHint')}</p>
                <code className="mt-3 block break-all rounded-xl bg-background p-3 text-xs" dir="ltr">{createdKey.apiKey}</code>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(createdKey.apiKey)}>{t('actions.copy')}</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('clients.title')}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="h-80 overflow-hidden rounded-xl border border-border"><DataTable rows={clients} columns={clientColumns} getRowId={(client) => client.id} loading={clientsQuery.isLoading} emptyMessage={t('clients.empty')} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('keys.title')}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="h-80 overflow-hidden rounded-xl border border-border"><DataTable rows={apiKeys} columns={apiKeyColumns} getRowId={(key) => key.id} loading={apiKeysQuery.isLoading} emptyMessage={t('keys.empty')} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('requests.title')}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="h-80 overflow-hidden rounded-xl border border-border"><DataTable rows={requests} columns={requestColumns} getRowId={(request) => request.requestId} loading={requestsQuery.isLoading} emptyMessage={t('requests.empty')} /></div>
        </CardContent>
      </Card>
    </section>
  )
}
