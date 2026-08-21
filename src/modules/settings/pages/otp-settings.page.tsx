import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  const isLoading = clientsQuery.isLoading || apiKeysQuery.isLoading || requestsQuery.isLoading

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
          <Table><TableHeader><TableRow><TableHead>{t('clients.name')}</TableHead><TableHead>{t('clients.slug')}</TableHead><TableHead>{t('clients.hourlyLimit')}</TableHead><TableHead>{t('clients.dailyLimit')}</TableHead><TableHead>{t('clients.keys')}</TableHead><TableHead>{t('clients.status')}</TableHead><TableHead>{t('actions.actions')}</TableHead></TableRow></TableHeader>
            <TableBody>{clients.map((client) => <TableRow key={client.id}><TableCell>{client.name}</TableCell><TableCell dir="ltr">{client.slug}</TableCell><TableCell>{client.hourlyOtpLimit}</TableCell><TableCell>{client.dailyOtpLimit}</TableCell><TableCell>{client.apiKeyCount}</TableCell><TableCell>{client.isActive ? t('status.active') : t('status.inactive')}</TableCell><TableCell><Button size="sm" variant="outline" disabled={toggleClientMutation.isPending} onClick={() => toggleClientMutation.mutate({ id: client.id, isActive: !client.isActive })}>{client.isActive ? t('actions.disable') : t('actions.enable')}</Button></TableCell></TableRow>)}</TableBody>
          </Table>
          {!isLoading && clients.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t('clients.empty')}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('keys.title')}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table><TableHeader><TableRow><TableHead>{t('keys.name')}</TableHead><TableHead>{t('keys.client')}</TableHead><TableHead>{t('keys.prefix')}</TableHead><TableHead>{t('keys.status')}</TableHead><TableHead>{t('keys.lastUsed')}</TableHead><TableHead>{t('actions.actions')}</TableHead></TableRow></TableHeader>
            <TableBody>{apiKeys.map((key) => <TableRow key={key.id}><TableCell>{key.name}</TableCell><TableCell>{key.client.name}</TableCell><TableCell dir="ltr">{key.prefix}</TableCell><TableCell>{key.status}</TableCell><TableCell>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : '-'}</TableCell><TableCell>{key.status === 'ACTIVE' ? <Button size="sm" variant="outline" disabled={revokeKeyMutation.isPending} onClick={() => revokeKeyMutation.mutate(key.id)}>{t('actions.revoke')}</Button> : '-'}</TableCell></TableRow>)}</TableBody>
          </Table>
          {!isLoading && apiKeys.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t('keys.empty')}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('requests.title')}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table><TableHeader><TableRow><TableHead>{t('requests.phone')}</TableHead><TableHead>{t('requests.client')}</TableHead><TableHead>{t('requests.purpose')}</TableHead><TableHead>{t('requests.status')}</TableHead><TableHead>{t('requests.createdAt')}</TableHead></TableRow></TableHeader>
            <TableBody>{requests.map((request) => <TableRow key={request.requestId}><TableCell dir="ltr">{request.phoneNumber}</TableCell><TableCell>{request.client?.name ?? '-'}</TableCell><TableCell>{request.purpose}</TableCell><TableCell>{request.status}</TableCell><TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell></TableRow>)}</TableBody>
          </Table>
          {!isLoading && requests.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t('requests.empty')}</p> : null}
        </CardContent>
      </Card>
    </section>
  )
}
