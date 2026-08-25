import {
  useState } from 'react'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  Plus,
  RefreshCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { api } from '@/shared/api/api-client'
import type { PagedResponse } from '@/shared/api/api.types'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import { generateResourceContentUrl } from '@/shared/utils/file-url'
import { resourcesService } from '@/modules/resources/resources.service'
import {
  Button,
  CustomFileInput,
  Input,
  Label,
  Textarea,
  ToggleSwitch,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  PaginatedDataTable,
  PageHeader,
  type DataTableColumn,
} from '@/shared/ui'

type NotificationItem = {
  id: string
  title: string
  body: string
  imageUrl?: string | null
  isBroadcast?: boolean
  sentAt?: string | null
  isRead?: boolean
  targetUserIds?: string[]
  data?: Record<string, string>
}

type NotificationForm = {
  title: string
  body: string
  data: string
  isBroadcast: boolean
  userIds: string
}

type PushNotificationPayload = {
  title: string
  body: string
  data: Record<string, string>
  imageUrl: string
  isBroadcast: boolean
  userIds: string[]
}

const EMPTY_FORM: NotificationForm = {
  title: '',
  body: '',
  data: '',
  isBroadcast: true,
  userIds: '',
}

function parseData(value: string): Record<string, string> {
  const text = value.trim()
  if (!text) return {}
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('validation.jsonObject')
  return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([key, item]) => [key, String(item)]))
}

function parseUserIds(value: string): string[] {
  return value.trim() ? value.split(/[\n,;\s]+/).map((item) => item.trim()).filter(Boolean) : []
}

function errorMessage(error: unknown): string | null {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return null
}

export default function NotificationsPage() {
  const { t, i18n } = useTranslation('content-crud')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<NotificationForm>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')

  const listQuery = useQuery({
    queryKey: ['notifications', page, search],
    queryFn: () => api.get<PagedResponse<NotificationItem>>(API_ENDPOINTS.notifications.list, {
      params: {
        Page: page,
        PerPage: 20,
        ...(search.trim() ? { search: search.trim() } : {}),
      },
    }),
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.body.trim()) throw new Error('validation.required')

      const userIds = form.isBroadcast ? [] : parseUserIds(form.userIds)
      if (!form.isBroadcast && userIds.length === 0) throw new Error('validation.userIdsRequired')

      const data = parseData(form.data)
      let imageUrl = ''
      if (imageFile) {
        const resource = await resourcesService.uploadPublicImage(imageFile)
        imageUrl = generateResourceContentUrl(resource.id)
        if (!imageUrl) throw new Error('errors.notificationImageUpload')
      }

      const payload: PushNotificationPayload = {
        title: form.title.trim(),
        body: form.body.trim(),
        data,
        imageUrl,
        isBroadcast: form.isBroadcast,
        userIds,
      }
      return api.post<unknown, PushNotificationPayload>(API_ENDPOINTS.notifications.push, payload)
    },
    onSuccess: async () => {
      toast.success(t('messages.sent'))
      setOpen(false)
      setForm(EMPTY_FORM)
      setImageFile(null)
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      const message = errorMessage(error)
      setFormError(message && message.startsWith('validation.') ? t(message) : message ?? t('errors.generic'))
      toast.error(message && message.startsWith('validation.') ? t(message) : message ?? t('errors.generic'))
    },
  })

  const items = listQuery.data?.items ?? []
  const totalCount = listQuery.data?.totalCount ?? 0
  const pageSize = listQuery.data?.pageSize ?? 20
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const notificationImageHint = i18n.dir() === 'rtl'
    ? 'يتم رفع الصورة عبر Resources أولًا ثم إرسال رابطها مع الإشعار.'
    : 'The image is uploaded through Resources first, then its URL is sent with the notification.'

  const closeDialog = () => {
    if (sendMutation.isPending) return
    setOpen(false)
    setForm(EMPTY_FORM)
    setImageFile(null)
    setFormError('')
  }

  const updateForm = <K extends keyof NotificationForm>(key: K, value: NotificationForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFormError('')
  }

  const notificationColumns: DataTableColumn<NotificationItem>[] = [
    { id: 'title', header: t('fields.title'), renderCell: (item) => item.title },
    { id: 'body', header: t('fields.body'), renderCell: (item) => item.body },
    { id: 'image', header: t('fields.image'), renderCell: (item) => item.imageUrl ? <a className="text-primary underline" href={item.imageUrl} target="_blank" rel="noreferrer">{t('fields.image')}</a> : '-' },
    { id: 'isBroadcast', header: t('fields.isBroadcast'), renderCell: (item) => item.isBroadcast ? '✓' : '—' },
    { id: 'sentAt', header: t('fields.sentAt'), renderCell: (item) => item.sentAt ? new Date(item.sentAt).toLocaleString() : '-' },
    { id: 'targetUserIds', header: t('fields.targetUserIds'), renderCell: (item) => Array.isArray(item.targetUserIds) ? item.targetUserIds.length : '-' },
  ]

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
      <PageHeader
        title={t('modules.notifications.title')}
        description={t('modules.notifications.description')}
        search={{
          value: search,
          placeholder: t('filters.searchPlaceholder'),
          onChange: (value) => { setSearch(value); setPage(1) },
        }}
        actions={<><Button variant="outline" icon={<RefreshCcw />} onClick={() => void listQuery.refetch()}>{t('actions.refresh')}</Button><Button icon={<Plus />} onClick={() => setOpen(true)}>{t('actions.sendNotification')}</Button></>}
      />

      <PaginatedDataTable<NotificationItem>
        className="min-h-0 flex-1"
        rows={items}
        columns={notificationColumns}
        getRowId={(item) => item.id}
        loading={listQuery.isLoading || listQuery.isFetching}
        summaryText={t('table.description', { count: totalCount })}
        emptyMessage={t('states.empty.title')}
        pagination={{
          currentPage: page,
          totalPages,
          pageSize,
          onPageChange: setPage,
          previousLabel: t('pagination.previous'),
          nextLabel: t('pagination.next'),
          getPageLabel: (pageNumber) => t('table.page', { page: pageNumber, totalPages }),
        }}
      />

      <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) closeDialog() }}>
        <SheetContent className="flex max-h-[88svh] max-w-3xl flex-col overflow-hidden">
          <SheetHeader><SheetTitle>{t('actions.sendNotification')}</SheetTitle><SheetDescription>{t('modules.notifications.description')}</SheetDescription></SheetHeader>
          <div className="grid min-h-0 gap-4 overflow-y-auto py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="notification-title">{t('fields.title')}</Label><Input id="notification-title" value={form.title} onChange={(event) => updateForm('title', event.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="notification-body">{t('fields.body')}</Label><Textarea id="notification-body" value={form.body} onChange={(event) => updateForm('body', event.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('fields.image')}</Label>
              <CustomFileInput value={imageFile?.name ?? ''} uploadLabel={t('actions.chooseImage')} removeLabel={t('actions.deleteImage')} hint={notificationImageHint} disabled={sendMutation.isPending} onFileSelect={setImageFile} onClear={() => setImageFile(null)} />
            </div>
            <div className="flex h-11 items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 text-sm sm:col-span-2"><span>{t('fields.isBroadcast')}</span><ToggleSwitch checked={form.isBroadcast} onCheckedChange={(checked) => updateForm('isBroadcast', checked)} /></div>
            {!form.isBroadcast ? <div className="space-y-2 sm:col-span-2"><Label htmlFor="notification-users">{t('fields.targetUserIds')}</Label><Textarea id="notification-users" value={form.userIds} placeholder={t('placeholders.userIds')} onChange={(event) => updateForm('userIds', event.target.value)} /></div> : null}
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="notification-data">{t('fields.data')}</Label><Textarea id="notification-data" value={form.data} placeholder={t('placeholders.notificationData')} onChange={(event) => updateForm('data', event.target.value)} /></div>
            {formError ? <p className="text-sm text-destructive sm:col-span-2">{formError}</p> : null}
          </div>
          <SheetFooter className="border-t border-border pt-4"><Button variant="outline" disabled={sendMutation.isPending} onClick={closeDialog}>{t('actions.cancel')}</Button><Button disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}>{sendMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}{t('actions.send')}</Button></SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  )
}
