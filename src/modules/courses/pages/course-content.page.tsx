import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileVideo,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { api } from '@/shared/api/api-client'
import type { PagedResponse, UUID } from '@/shared/api/api.types'
import { API_ORIGIN } from '@/shared/config/api-origin'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { toast } from '@/shared/lib/toast'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CustomSelect,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Textarea,
} from '@/shared/ui'

type NamedItem = { id: UUID; title?: string | null; name?: string | null }
type UploadedResource = string | { id?: UUID; entityId?: UUID | null }
type CourseMaterialType = 1 | 2
type HlsStatus = 0 | 1 | 2 | 3 | 'NotProcessed' | 'Processing' | 'Ready' | 'Failed' | string

type Material = {
  id: UUID
  title?: string | null
  description?: string | null
  materialType?: CourseMaterialType | null
  resourceId?: UUID | null
  order?: number | null
  hlsStatus?: HlsStatus | null
  isHlsReady?: boolean
  hlsError?: string | null
}

type PlaybackResponse = {
  materialId?: UUID
  playbackType?: string
  playlistUrl: string
  hlsStatus?: string
}

type TextRecord = {
  id: UUID
  content?: string | null
  authorRole?: string | null
}

type TabKey = 'materials' | 'comments' | 'notes'
type ContentTabPath = 'materials' | 'comments' | 'teacher-notes'
type DialogKind = 'material' | 'comment' | 'note'

type MaterialForm = {
  courseId: string
  sessionId: string
  title: string
  description: string
  materialType: CourseMaterialType
  file: File | null
  order: number
  currentResourceId: string | null
}

type TextForm = {
  courseId: string
  sessionId: string
  content: string
}

type DialogState = {
  open: boolean
  kind: DialogKind
  item: Material | TextRecord | null
  material: MaterialForm
  text: TextForm
}

type MaterialPayload = {
  title: string
  description?: string | null
  materialType: CourseMaterialType
  resourceId: string
  order: number
}

const LOOKUP_PAGE_SIZE = 100
const CONTENT_PAGE_SIZE = 20
const FILE_MATERIAL_ACCEPT =
  'image/*,application/*,text/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml,.zip,.rar,.7z'
const VIDEO_MATERIAL_ACCEPT = 'video/*'
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma']
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv', '.m4v', '.3gp']

const createEmptyMaterial = (courseId = '', sessionId = ''): MaterialForm => ({
  courseId,
  sessionId,
  title: '',
  description: '',
  materialType: 1,
  file: null,
  order: 0,
  currentResourceId: null,
})

const createEmptyText = (courseId = '', sessionId = ''): TextForm => ({
  courseId,
  sessionId,
  content: '',
})

function labelOf(item: NamedItem) {
  return item.title?.trim() || item.name?.trim() || '-'
}

function extractResourceId(response: UploadedResource): string | null {
  if (typeof response === 'string' && response.trim()) return response
  if (response && typeof response === 'object' && typeof response.id === 'string' && response.id.trim()) {
    return response.id
  }
  return null
}

function getBlobName(material: Material) {
  return (material.title?.trim() || 'course-material')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .slice(0, 80)
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function tabFromPath(value: string | undefined): TabKey {
  if (value === 'comments') return 'comments'
  if (value === 'teacher-notes') return 'notes'
  return 'materials'
}

function pathFromTab(value: TabKey): ContentTabPath {
  if (value === 'comments') return 'comments'
  if (value === 'notes') return 'teacher-notes'
  return 'materials'
}

function fileExtension(file: File) {
  const index = file.name.lastIndexOf('.')
  return index >= 0 ? file.name.slice(index).toLowerCase() : ''
}

function isAudioFile(file: File) {
  return file.type.startsWith('audio/') || AUDIO_EXTENSIONS.includes(fileExtension(file))
}

function isVideoFile(file: File) {
  return file.type.startsWith('video/') || VIDEO_EXTENSIONS.includes(fileExtension(file))
}

function isVideoMaterial(material: Material) {
  return material.materialType === 2
}

function normalizeHlsStatus(status: Material['hlsStatus']) {
  if (status === 2 || status === '2' || status === 'Ready') return 'Ready'
  if (status === 1 || status === '1' || status === 'Processing') return 'Processing'
  if (status === 3 || status === '3' || status === 'Failed') return 'Failed'
  return 'NotProcessed'
}

function isVideoReady(material: Material) {
  return Boolean(material.isHlsReady) || normalizeHlsStatus(material.hlsStatus) === 'Ready'
}

function hlsBadgeColor(material: Material): 'emerald' | 'amber' | 'rose' | 'slate' {
  const status = normalizeHlsStatus(material.hlsStatus)
  if (isVideoReady(material)) return 'emerald'
  if (status === 'Processing') return 'amber'
  if (status === 'Failed') return 'rose'
  return 'slate'
}

function resolveApiUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

export default function CourseContentPage() {
  const { t } = useTranslation('course-content')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const {
    courseId: routeCourseId = '',
    sessionId: routeSessionId = '',
    contentTab = '',
  } = useParams()

  const isSessionDetailRoute = Boolean(routeSessionId)
  const [courseId, setCourseId] = useState(routeCourseId)
  const [sessionId, setSessionId] = useState(routeSessionId)
  const [contentPage, setContentPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Material | TextRecord | null>(null)
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    kind: 'material',
    item: null,
    material: createEmptyMaterial(routeCourseId, routeSessionId),
    text: createEmptyText(routeCourseId, routeSessionId),
  })

  const tab = tabFromPath(contentTab)
  const dialogCourseId = dialog.kind === 'material' ? dialog.material.courseId : dialog.text.courseId

  const coursesQuery = useQuery({
    queryKey: ['course-content', 'courses'],
    queryFn: () =>
      api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.courses.list, {
        params: { page: 1, perPage: LOOKUP_PAGE_SIZE },
      }),
    enabled: !isSessionDetailRoute,
  })

  const sessionsQuery = useQuery({
    queryKey: ['course-content', 'sessions', courseId],
    queryFn: () =>
      api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.courses.sessions(courseId), {
        params: { page: 1, perPage: LOOKUP_PAGE_SIZE },
      }),
    enabled: Boolean(courseId && !isSessionDetailRoute),
  })

  const detailCourseQuery = useQuery({
    queryKey: ['course-content', 'course', routeCourseId],
    queryFn: () => api.get<NamedItem>(API_ENDPOINTS.courses.detail(routeCourseId)),
    enabled: Boolean(isSessionDetailRoute && routeCourseId),
  })

  const detailSessionQuery = useQuery({
    queryKey: ['course-content', 'session', routeSessionId],
    queryFn: () => api.get<NamedItem>(API_ENDPOINTS.courseSessions.detail(routeSessionId)),
    enabled: Boolean(isSessionDetailRoute && routeSessionId),
  })

  const dialogSessionsQuery = useQuery({
    queryKey: ['course-content', 'dialog-sessions', dialogCourseId],
    queryFn: () =>
      api.get<PagedResponse<NamedItem>>(API_ENDPOINTS.courses.sessions(dialogCourseId), {
        params: { page: 1, perPage: LOOKUP_PAGE_SIZE },
      }),
    enabled: Boolean(dialog.open && dialogCourseId && !isSessionDetailRoute),
  })

  const materialsQuery = useQuery({
    queryKey: ['course-content', 'materials', sessionId, contentPage],
    queryFn: () =>
      api.get<PagedResponse<Material>>(API_ENDPOINTS.courseSessions.materials(sessionId), {
        params: { page: contentPage, perPage: CONTENT_PAGE_SIZE },
      }),
    enabled: Boolean(sessionId && tab === 'materials'),
  })

  const commentsQuery = useQuery({
    queryKey: ['course-content', 'comments', sessionId, contentPage],
    queryFn: () =>
      api.get<PagedResponse<TextRecord>>(API_ENDPOINTS.courseSessions.comments(sessionId), {
        params: { page: contentPage, perPage: CONTENT_PAGE_SIZE },
      }),
    enabled: Boolean(sessionId && tab === 'comments'),
  })

  const notesQuery = useQuery({
    queryKey: ['course-content', 'notes', sessionId, contentPage],
    queryFn: () =>
      api.get<PagedResponse<TextRecord>>(API_ENDPOINTS.courseSessions.notes(sessionId), {
        params: { page: contentPage, perPage: CONTENT_PAGE_SIZE },
      }),
    enabled: Boolean(sessionId && tab === 'notes'),
  })

  const courseOptions = useMemo(
    () => (coursesQuery.data?.items ?? []).map((item) => ({ value: item.id, label: labelOf(item) })),
    [coursesQuery.data?.items],
  )
  const sessionOptions = useMemo(
    () => (sessionsQuery.data?.items ?? []).map((item) => ({ value: item.id, label: labelOf(item) })),
    [sessionsQuery.data?.items],
  )
  const dialogSessionOptions = useMemo(
    () =>
      (dialogSessionsQuery.data?.items ?? []).map((item) => ({ value: item.id, label: labelOf(item) })),
    [dialogSessionsQuery.data?.items],
  )

  const selectedCourseLabel = isSessionDetailRoute
    ? labelOf(detailCourseQuery.data ?? { id: routeCourseId })
    : courseOptions.find((item) => item.value === courseId)?.label ?? ''
  const selectedSessionLabel = isSessionDetailRoute
    ? labelOf(detailSessionQuery.data ?? { id: routeSessionId })
    : sessionOptions.find((item) => item.value === sessionId)?.label ?? ''

  const activeQuery = tab === 'materials' ? materialsQuery : tab === 'comments' ? commentsQuery : notesQuery
  const activeItems = activeQuery.data?.items ?? []
  const totalCount = activeQuery.data?.totalCount ?? 0
  const pageSize = activeQuery.data?.pageSize ?? CONTENT_PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const errorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message
      if (typeof message === 'string' && message.trim()) return message
    }
    return t('messages.requestFailed')
  }

  const hlsStatusLabel = (material: Material) => {
    const status = normalizeHlsStatus(material.hlsStatus)
    if (isVideoReady(material)) return t('hls.ready')
    if (status === 'Processing') return t('hls.processing')
    if (status === 'Failed') return material.hlsError || t('hls.failed')
    return t('hls.notReady')
  }

  const invalidateCurrent = async () => {
    await queryClient.invalidateQueries({ queryKey: ['course-content', tab, sessionId] })
  }

  const uploadResource = async (material: MaterialForm) => {
    if (!material.file) return material.currentResourceId
    if (material.materialType === 2 && (!isVideoFile(material.file) || isAudioFile(material.file))) {
      throw new Error(t('validation.videoOnly'))
    }
    if (material.materialType === 1 && (isVideoFile(material.file) || isAudioFile(material.file))) {
      throw new Error(t('validation.fileOnly'))
    }

    const formData = new FormData()
    formData.append('file', material.file)
    formData.append('entityId', material.courseId)
    formData.append('isImage', String(material.file.type.startsWith('image/')))
    const resource = await api.upload<UploadedResource>(API_ENDPOINTS.resources.upload, formData)
    const resourceId = extractResourceId(resource)
    if (!resourceId) throw new Error(t('validation.uploadMissingId'))
    return resourceId
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (dialog.kind === 'material') {
        const form = dialog.material
        if (!form.courseId) throw new Error(t('validation.courseRequired'))
        if (!form.sessionId) throw new Error(t('validation.sessionRequired'))
        const title = form.title.trim()
        const description = form.description.trim()
        if (title.length < 2 || title.length > 200) throw new Error(t('validation.titleLength'))
        if (description.length > 1000) throw new Error(t('validation.descriptionMax'))
        if (!Number.isInteger(form.order) || form.order < 0) throw new Error(t('validation.order'))

        const resourceId = await uploadResource(form)
        if (!resourceId) throw new Error(t('validation.resourceRequired'))

        const payload: MaterialPayload = {
          title,
          description: description || null,
          materialType: form.materialType,
          resourceId,
          order: form.order,
        }

        if (dialog.item?.id) {
          return api.patch<unknown, MaterialPayload>(
            API_ENDPOINTS.courseMaterials.update(dialog.item.id),
            payload,
          )
        }
        return api.post<unknown, MaterialPayload>(
          API_ENDPOINTS.courseSessions.materials(form.sessionId),
          payload,
        )
      }

      const form = dialog.text
      if (!form.courseId) throw new Error(t('validation.courseRequired'))
      if (!form.sessionId) throw new Error(t('validation.sessionRequired'))
      const content = form.content.trim()
      if (content.length < 1 || content.length > 2000) throw new Error(t('validation.contentLength'))
      const payload = { content }

      if (dialog.kind === 'comment') {
        if (dialog.item?.id) {
          return api.patch<unknown, typeof payload>(API_ENDPOINTS.courseComments.update(dialog.item.id), payload)
        }
        return api.post<unknown, typeof payload>(API_ENDPOINTS.courseSessions.comments(form.sessionId), payload)
      }

      if (dialog.item?.id) {
        return api.patch<unknown, typeof payload>(API_ENDPOINTS.courseNotes.update(dialog.item.id), payload)
      }
      return api.post<unknown, typeof payload>(API_ENDPOINTS.courseSessions.notes(form.sessionId), payload)
    },
    onSuccess: async () => {
      toast.success(dialog.item ? t('messages.updated') : t('messages.created'))
      setDialog((current) => ({ ...current, open: false }))
      await invalidateCurrent()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget?.id) return
      if (tab === 'materials') await api.delete(API_ENDPOINTS.courseMaterials.remove(deleteTarget.id))
      else if (tab === 'comments') await api.delete(API_ENDPOINTS.courseComments.remove(deleteTarget.id))
      else await api.delete(API_ENDPOINTS.courseNotes.remove(deleteTarget.id))
    },
    onSuccess: async () => {
      toast.success(t('messages.deleted'))
      setDeleteTarget(null)
      await invalidateCurrent()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const downloadMutation = useMutation({
    mutationFn: async (material: Material) => {
      if (isVideoMaterial(material)) {
        const blob = await api.downloadBlob(API_ENDPOINTS.courseMaterials.offlineManifest(material.id))
        downloadBlob(blob, `${getBlobName(material)}-offline.json`)
        return
      }
      if (!material.resourceId) throw new Error(t('validation.resourceRequired'))
      const blob = await api.downloadBlob(API_ENDPOINTS.resources.download(material.resourceId))
      downloadBlob(blob, getBlobName(material))
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const playbackMutation = useMutation({
    mutationFn: (material: Material) => api.get<PlaybackResponse>(API_ENDPOINTS.courseMaterials.playback(material.id)),
    onSuccess: (response) => {
      const url = resolveApiUrl(response.playlistUrl)
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const openMaterialDialog = (material?: Material) => {
    setDialog({
      open: true,
      kind: 'material',
      item: material ?? null,
      material: material
        ? {
            courseId,
            sessionId,
            title: material.title ?? '',
            description: material.description ?? '',
            materialType: material.materialType === 2 ? 2 : 1,
            file: null,
            order: Number(material.order ?? 0),
            currentResourceId: material.resourceId ?? null,
          }
        : createEmptyMaterial(courseId, sessionId),
      text: createEmptyText(courseId, sessionId),
    })
  }

  const openTextDialog = (kind: Exclude<DialogKind, 'material'>, item?: TextRecord) => {
    setDialog({
      open: true,
      kind,
      item: item ?? null,
      material: createEmptyMaterial(courseId, sessionId),
      text: {
        courseId,
        sessionId,
        content: item?.content ?? '',
      },
    })
  }

  const contentPagePath = (nextTab: TabKey) => {
    const tabPath = pathFromTab(nextTab)
    return `/courses/${encodeURIComponent(courseId)}/sessions/${encodeURIComponent(sessionId)}/${tabPath}`
  }

  const canOpenMaterialDialog = Boolean(courseId && sessionId)
  const canOpenTextDialog = Boolean(courseId && sessionId)

  if (isSessionDetailRoute && (detailCourseQuery.isLoading || detailSessionQuery.isLoading)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <Card className="rounded-3xl border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.035] shadow-sm">
        <CardHeader className="gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ms-2 w-fit"
                onClick={() => navigate('/courses')}
              >
                <ArrowLeft className="size-4 rtl:rotate-180" />
                {t('hero.back')}
              </Button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" color="fuchsia">{t('hero.badge')}</Badge>
                  {selectedCourseLabel ? <span className="text-sm font-semibold text-foreground">{selectedCourseLabel}</span> : null}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{selectedSessionLabel || t('hero.title')}</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{t('hero.description')}</p>
              </div>
            </div>

            <div className="quizy-course-content-hero-actions flex flex-wrap items-center gap-2">
              {tab === 'materials' ? (
                <Button type="button" onClick={() => openMaterialDialog()} disabled={!canOpenMaterialDialog}>
                  <Plus className="size-4" />
                  {t('actions.addMaterial')}
                </Button>
              ) : (
                <Button type="button" onClick={() => openTextDialog(tab === 'comments' ? 'comment' : 'note')} disabled={!canOpenTextDialog}>
                  <Plus className="size-4" />
                  {tab === 'comments' ? t('actions.addComment') : t('actions.addNote')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {!isSessionDetailRoute ? (
        <div className="grid gap-4 rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:grid-cols-2 sm:p-5">
          <div className="space-y-2">
            <Label>{t('filters.course')}</Label>
            <CustomSelect value={courseId || undefined} placeholder={t('filters.coursePlaceholder')} options={courseOptions} onValueChange={(value) => { setCourseId(String(value)); setSessionId(''); setContentPage(1) }} />
          </div>
          <div className="space-y-2">
            <Label>{t('filters.session')}</Label>
            <CustomSelect value={sessionId || undefined} placeholder={t('filters.sessionPlaceholder')} options={sessionOptions} disabled={!courseId || sessionsQuery.isLoading} onValueChange={(value) => { setSessionId(String(value)); setContentPage(1) }} />
          </div>
        </div>
      ) : null}

      {sessionId ? (
        <div className="flex flex-wrap gap-2">
          {(['materials', 'comments', 'notes'] as const).map((key) => (
            <Button
              key={key}
              type="button"
              variant={tab === key ? 'default' : 'outline'}
              onClick={() => {
                setContentPage(1)
                if (isSessionDetailRoute) navigate(contentPagePath(key))
              }}
            >
              {t(`tabs.${key}`)}
            </Button>
          ))}
        </div>
      ) : null}

      <Card className="rounded-3xl border-border/70 shadow-sm">
        <CardContent className="p-0">
          {activeQuery.isLoading ? (
            <div className="space-y-3 p-5"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
          ) : !sessionId ? (
            <div className="p-10 text-center text-sm text-muted-foreground">{t('states.selectSession')}</div>
          ) : activeItems.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">{t('states.empty')}</div>
          ) : (
            <div className="divide-y divide-border/70">
              {activeItems.map((item) => {
                if (tab === 'materials') {
                  const material = item as Material
                  return (
                    <div key={material.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{material.title || material.id}</p>
                          <Badge variant="outline" color={isVideoMaterial(material) ? 'fuchsia' : 'slate'}>{isVideoMaterial(material) ? t('material.video') : t('material.file')}</Badge>
                          {isVideoMaterial(material) ? <Badge variant="outline" color={hlsBadgeColor(material)}>{hlsStatusLabel(material)}</Badge> : null}
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{material.description || t('states.noDescription')}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isVideoMaterial(material) ? (
                          <Button type="button" variant="outline" size="sm" disabled={!isVideoReady(material) || playbackMutation.isPending} onClick={() => playbackMutation.mutate(material)}>
                            <ExternalLink className="size-4" />
                            {t('actions.play')}
                          </Button>
                        ) : null}
                        <Button type="button" variant="outline" size="sm" disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate(material)}>
                          <Download className="size-4" />
                          {t('actions.download')}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openMaterialDialog(material)}>
                          <Pencil className="size-4" />
                          {t('actions.edit')}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteTarget(material)}>
                          <Trash2 className="size-4" />
                          {t('actions.delete')}
                        </Button>
                      </div>
                    </div>
                  )
                }

                const record = item as TextRecord
                return (
                  <div key={record.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{record.content || '—'}</p>
                      {record.authorRole ? <p className="text-xs text-muted-foreground">{record.authorRole}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openTextDialog(tab === 'comments' ? 'comment' : 'note', record)}><Pencil className="size-4" />{t('actions.edit')}</Button>
                      <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setDeleteTarget(record)}><Trash2 className="size-4" />{t('actions.delete')}</Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {sessionId && totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-border/70 p-4">
              <span className="text-xs text-muted-foreground">{t('pagination.summary', { page: contentPage, totalPages })}</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={contentPage <= 1} onClick={() => setContentPage((current) => Math.max(1, current - 1))}>{t('pagination.previous')}</Button>
                <Button type="button" variant="outline" size="sm" disabled={contentPage >= totalPages} onClick={() => setContentPage((current) => Math.min(totalPages, current + 1))}>{t('pagination.next')}</Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={(open) => { if (!open && !saveMutation.isPending) setDialog((current) => ({ ...current, open: false })) }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t(dialog.kind === 'material' ? (dialog.item ? 'dialogs.materialEditTitle' : 'dialogs.materialCreateTitle') : dialog.kind === 'comment' ? (dialog.item ? 'dialogs.commentEditTitle' : 'dialogs.commentCreateTitle') : (dialog.item ? 'dialogs.noteEditTitle' : 'dialogs.noteCreateTitle'))}</DialogTitle>
            <DialogDescription>{t('dialogs.description')}</DialogDescription>
          </DialogHeader>
          {dialog.kind === 'material' ? (
            <div className="grid gap-4 py-2 md:grid-cols-2">
              {!isSessionDetailRoute ? <><div className="space-y-2"><Label>{t('filters.course')}</Label><CustomSelect value={dialog.material.courseId || undefined} placeholder={t('filters.coursePlaceholder')} options={courseOptions} onValueChange={(value) => setDialog((current) => ({ ...current, material: { ...current.material, courseId: String(value), sessionId: '' } }))} /></div><div className="space-y-2"><Label>{t('filters.session')}</Label><CustomSelect value={dialog.material.sessionId || undefined} placeholder={t('filters.sessionPlaceholder')} options={dialogSessionOptions} disabled={!dialog.material.courseId || dialogSessionsQuery.isLoading} onValueChange={(value) => setDialog((current) => ({ ...current, material: { ...current.material, sessionId: String(value) } }))} /></div></> : null}
              <div className="space-y-2 md:col-span-2"><Label>{t('fields.title')}</Label><Input value={dialog.material.title} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, title: event.target.value } }))} /></div>
              <div className="space-y-2 md:col-span-2"><Label>{t('fields.description')}</Label><Textarea value={dialog.material.description} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, description: event.target.value } }))} /></div>
              <div className="space-y-2"><Label>{t('fields.type')}</Label><CustomSelect value={String(dialog.material.materialType)} options={[{ value: '1', label: t('material.file') }, { value: '2', label: t('material.video') }]} onValueChange={(value) => setDialog((current) => ({ ...current, material: { ...current.material, materialType: Number(value) === 2 ? 2 : 1, file: null } }))} /></div>
              <div className="space-y-2"><Label>{t('fields.order')}</Label><Input type="number" min={0} step={1} value={dialog.material.order} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, order: Number(event.target.value) } }))} /></div>
              <div className="space-y-2 md:col-span-2"><Label>{dialog.material.materialType === 2 ? t('fields.videoFile') : t('fields.file')}</Label><Input type="file" accept={dialog.material.materialType === 2 ? VIDEO_MATERIAL_ACCEPT : FILE_MATERIAL_ACCEPT} onChange={(event) => setDialog((current) => ({ ...current, material: { ...current.material, file: event.target.files?.[0] ?? null } }))} /></div>
              {dialog.item && !dialog.material.file ? <p className="text-xs text-muted-foreground md:col-span-2">{t('fields.keepExistingResource')}</p> : null}
            </div>
          ) : (
            <div className="space-y-2 py-2"><Label>{t('fields.content')}</Label><Textarea rows={8} value={dialog.text.content} onChange={(event) => setDialog((current) => ({ ...current, text: { ...current.text, content: event.target.value } }))} /></div>
          )}
          <DialogFooter><Button type="button" variant="outline" disabled={saveMutation.isPending} onClick={() => setDialog((current) => ({ ...current, open: false }))}>{t('actions.cancel')}</Button><Button type="button" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>{t('actions.save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteTarget(null) }}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>{t('delete.title')}</DialogTitle><DialogDescription>{t('delete.description')}</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={deleteMutation.isPending} onClick={() => setDeleteTarget(null)}>{t('actions.cancel')}</Button><Button type="button" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>{t('actions.delete')}</Button></DialogFooter></DialogContent>
      </Dialog>
    </section>
  )
}
