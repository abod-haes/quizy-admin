import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  LogOut,
  MessageCircle,
  Play,
  QrCode,
  RefreshCcw,
  Square,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  whatsappService,
  type WhatsAppControlAction,
} from '@/modules/whatsapp/whatsapp.service'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'

const SESSION_KEY = ['whatsapp-session'] as const
const HEALTH_KEY = ['whatsapp-readiness'] as const

export default function WhatsAppManagementPage() {
  const { t, i18n } = useTranslation('whatsapp')
  const queryClient = useQueryClient()

  const sessionQuery = useQuery({
    queryKey: SESSION_KEY,
    queryFn: whatsappService.sessionStatus,
    refetchInterval: 10_000,
  })
  const healthQuery = useQuery({
    queryKey: HEALTH_KEY,
    queryFn: whatsappService.readiness,
    refetchInterval: 10_000,
  })

  const controlMutation = useMutation({
    mutationFn: whatsappService.control,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: SESSION_KEY }),
        queryClient.invalidateQueries({ queryKey: HEALTH_KEY }),
      ])
    },
  })

  const session = sessionQuery.data
  const health = healthQuery.data
  const socketUp = health?.services.whatsappSocket === 'up'
  const staleReady = session?.status === 'READY' && !socketUp
  const busy = controlMutation.isPending

  const refresh = () => {
    void sessionQuery.refetch()
    void healthQuery.refetch()
  }

  const runAction = (action: WhatsAppControlAction) => {
    if (action === 'logout' && !window.confirm(t('actions.logoutConfirm'))) return
    controlMutation.mutate(action)
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-card p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <Badge variant="outline">{socketUp ? t('connection.live') : t('connection.offline')}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <Button variant="outline" icon={<RefreshCcw className="size-4" />} onClick={refresh}>
          {t('actions.refresh')}
        </Button>
      </div>

      {staleReady ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <div className="flex items-start gap-3">
            <WifiOff className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">{t('warnings.staleReadyTitle')}</p>
              <p className="mt-1 text-muted-foreground">{t('warnings.staleReadyDescription')}</p>
            </div>
          </div>
        </div>
      ) : null}

      {(sessionQuery.isError || healthQuery.isError) ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
          {t('errors.load')}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries({
          database: health?.services.database,
          redis: health?.services.redis,
          worker: health?.services.worker,
          whatsappSocket: health?.services.whatsappSocket,
        }).map(([key, value]) => {
          const up = value === 'up' || value === 'ready'
          return (
            <Card key={key} className="rounded-3xl">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{t(`services.${key}`)}</p>
                  <p className="mt-1 text-lg font-semibold">{value ?? '—'}</p>
                </div>
                <div className={`flex size-10 items-center justify-center rounded-2xl ${up ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                  {key === 'whatsappSocket' ? (up ? <Wifi className="size-5" /> : <WifiOff className="size-5" />) : <Activity className="size-5" />}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{t('session.title')}</CardTitle>
            <CardDescription>{t('session.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <p className="text-xs text-muted-foreground">{t('session.persistedStatus')}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{session?.status ?? '—'}</Badge>
                  {session?.status === 'READY' ? <span className="text-xs text-muted-foreground">{t('session.persistedHint')}</span> : null}
                </div>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-xs text-muted-foreground">{t('session.liveSocket')}</p>
                <div className="mt-2 flex items-center gap-2 font-semibold">
                  {socketUp ? <Wifi className="size-4 text-emerald-600" /> : <WifiOff className="size-4 text-destructive" />}
                  {socketUp ? t('connection.live') : t('connection.offline')}
                </div>
              </div>
            </div>

            <dl className="grid gap-x-8 gap-y-4 text-sm md:grid-cols-2">
              <div><dt className="text-muted-foreground">{t('session.displayName')}</dt><dd className="mt-1 font-medium">{session?.displayName || '—'}</dd></div>
              <div><dt className="text-muted-foreground">{t('session.phone')}</dt><dd className="mt-1 font-medium" dir="ltr">{session?.phoneNumber || '—'}</dd></div>
              <div><dt className="text-muted-foreground">{t('session.lastConnected')}</dt><dd className="mt-1 font-medium">{formatDate(session?.lastConnectedAt)}</dd></div>
              <div><dt className="text-muted-foreground">{t('session.lastDisconnected')}</dt><dd className="mt-1 font-medium">{formatDate(session?.lastDisconnectedAt)}</dd></div>
              <div><dt className="text-muted-foreground">{t('session.updatedAt')}</dt><dd className="mt-1 font-medium">{formatDate(session?.updatedAt)}</dd></div>
              <div><dt className="text-muted-foreground">{t('session.healthTime')}</dt><dd className="mt-1 font-medium">{formatDate(health?.time)}</dd></div>
            </dl>

            {session?.disconnectReason ? <p className="rounded-2xl border p-4 text-sm"><strong>{t('session.disconnectReason')}:</strong> {session.disconnectReason}</p> : null}
            {session?.lastError ? <p className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"><strong>{t('session.lastError')}:</strong> {session.lastError}</p> : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{t('controls.title')}</CardTitle>
            <CardDescription>{t('controls.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" icon={<Play className="size-4" />} disabled={busy || socketUp} onClick={() => runAction('start')}>{t('actions.start')}</Button>
            <Button className="w-full justify-start" variant="outline" icon={<RefreshCcw className="size-4" />} disabled={busy} onClick={() => runAction('reconnect')}>{t('actions.reconnect')}</Button>
            <Button className="w-full justify-start" variant="outline" icon={<Square className="size-4" />} disabled={busy} onClick={() => runAction('stop')}>{t('actions.stop')}</Button>
            <Button className="w-full justify-start text-destructive hover:text-destructive" variant="outline" icon={<LogOut className="size-4" />} disabled={busy} onClick={() => runAction('logout')}>{t('actions.logout')}</Button>
            {controlMutation.isSuccess ? <p className="pt-2 text-sm text-emerald-600">{t('actions.accepted')}</p> : null}
            {controlMutation.isError ? <p className="pt-2 text-sm text-destructive">{t('errors.action')}</p> : null}
          </CardContent>
        </Card>
      </div>

      {(session?.status === 'QR_READY' || session?.qrDataUrl) ? (
        <Card className="rounded-3xl border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="size-5" />{t('qr.title')}</CardTitle>
            <CardDescription>{t('qr.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {session.qrDataUrl ? (
              <div className="flex flex-col items-center gap-4 rounded-3xl border bg-white p-6 text-center">
                <img src={session.qrDataUrl} alt={t('qr.alt')} className="size-72 max-w-full object-contain" />
                <p className="max-w-xl text-sm text-slate-600">{t('qr.instructions')}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground">{t('qr.waiting')}</p>}
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
