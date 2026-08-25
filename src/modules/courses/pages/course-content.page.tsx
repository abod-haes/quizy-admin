import {
  useMemo,
  useState } from 'react'
import { useNavigate,
  useParams } from 'react-router-dom'
import { useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query'
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
import type { PagedResponse,
  UUID } from '@/shared/api/api.types'
import { env } from '@/shared/config/env'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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
  const baseUrl = env.apiBaseUrl.replace(/\/$/, '')
  if (!baseUrl) return url.startsWith('/') ? url : `/${url}`
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`
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
        return api.patch<unknown, typeof payload>(
          API_ENDPOINTS.courseTeacherNotes.update(dialog.item.id),
          payload,
        )
      }
      return api.post<unknown, typeof payload>(API_ENDPOINTS.courseSessions.notes(form.sessionId), payload)
    },
    onSuccess: async () => {
      toast.success(t('messages.saved'))
      setDialog((current) => ({ ...current, open: false }))
      await invalidateCurrent()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const removeMutation = useMutation({
    mutationFn: async (item: Material | TextRecord) => {
      if (tab === 'materials') return api.delete(API_ENDPOINTS.courseMaterials.remove(item.id))
      if (tab === 'comments') return api.delete(API_ENDPOINTS.courseComments.remove(item.id))
      return api.delete(API_ENDPOINTS.courseTeacherNotes.remove(item.id))
    },
    onSuccess: async () => {
      toast.success(t('messages.deleted'))
      setDeleteTarget(null)
      await invalidateCurrent()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const downloadMutation = useMutation({
    mutationFn: (material: Material) => api.downloadBlob(API_ENDPOINTS.courseMaterials.download(material.id)),
    onSuccess: (blob, material) => downloadBlob(blob, getBlobName(material)),
    onError: (error) => toast.error(errorMessage(error)),
  })

  const openVideoPlayback = async (material: Material) => {
    if (!isVideoReady(material)) {
      toast.info(t('messages.videoNotReady'), { description: hlsStatusLabel(material) })
      return
    }
    try {
      const playback = await api.get<PlaybackResponse>(API_ENDPOINTS.courseMaterials.playback(material.id))
      window.open(resolveApiUrl(playback.playlistUrl), '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const downloadVideoManifest = async (material: Material) => {
    if (!isVideoReady(material)) {
      toast.info(t('messages.videoNotReady'), { description: hlsStatusLabel(material) })
      return
    }
    try {
      const blob = await api.downloadBlob(API_ENDPOINTS.courseMaterials.offlineManifest(material.id))
      downloadBlob(blob, `${getBlobName(material)}-hls-manifest.json`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const openCreate = (kind: DialogKind) =>
    setDialog({
      open: true,
      kind,
      item: null,
      material: createEmptyMaterial(courseId, sessionId),
      text: createEmptyText(courseId, sessionId),
    })

  const openMaterial = (item: Material) =>
    setDialog({
      open: true,
      kind: 'material',
      item,
      material: {
        ...createEmptyMaterial(courseId, sessionId),
        title: item.title ?? '',
        description: item.description ?? '',
        materialType: item.materialType === 2 ? 2 : 1,
        order: item.order ?? 0,
        currentResourceId: item.resourceId ?? null,
      },
      text: createEmptyText(courseId, sessionId),
    })

  const openText = (kind: 'comment' | 'note', item: TextRecord) =>
    setDialog({
      open: true,
      kind,
      item,
      material: createEmptyMaterial(courseId, sessionId),
      text: { ...createEmptyText(courseId, sessionId), content: item.content ?? '' },
    })

  const openTabPage = (nextTab: TabKey) => {
    setContentPage(1)
    if (isSessionDetailRoute) {
      navigate(`/courses/${routeCourseId}/sessions/${routeSessionId}/${pathFromTab(nextTab)}`)
    }
  }

  const dialogTitle = dialog.kind === 'material'
    ? t(dialog.item ? 'form.editMaterial' : 'form.createMaterial')
    : dialog.kind === 'comment'
      ? t(dialog.item ? 'form.editComment' : 'form.createComment')
      : t(dialog.item ? 'form.editNote' : 'form.createNote')

  const deleteName = deleteTarget
    ? tab === 'materials'
      ? (deleteTarget as Material).title || t('messages.materialFallback')
      : (deleteTarget as TextRecord).content?.slice(0, 60) || t('messages.itemFallback')
    : ''

  return (
    <section className="flex min-h-0 w-full flex-col gap-3 overflow-hidden">
      <div className="rounded-[1.4rem] border border-primary/10 bg-card/95 px-4 py-3 shadow-sm sm:px-5">
        {isSessionDetailRoute ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ms-2 mb-2"
            onClick={() => navigate(`/courses/${routeCourseId}`)}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {t('backToCourse')}
          </Button>
        ) : null}
        <Badge variant="outline" color="primary" className="mb-2 rounded-full px-3">Courses</Badge>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isSessionDetailRoute ? selectedSessionLabel || t('sessionTitle') : t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSessionDetailRoute && selectedCourseLabel ? selectedCourseLabel : t('description')}
        </p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col rounded-3xl shadow-sm">
        <CardHeader className="shrink-0 space-y-3 px-4 py-3 sm:px-5">
          {!isSessionDetailRoute ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('fields.course')}</Label>
                <CustomSelect
                  value={courseId || undefined}
                  placeholder={t('placeholders.course')}
                  options={courseOptions}
                  onValueChange={(value) => {
                    setCourseId(String(value))
                    setSessionId('')
                    setContentPage(1)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('fields.session')}</Label>
                <CustomSelect
                  value={sessionId || undefined}
                  placeholder={t('placeholders.session')}
                  disabled={!courseId}
                  options={sessionOptions}
                  onValueChange={(value) => {
                    setSessionId(String(value))
                    setContentPage(1)
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(['materials', 'comments', 'notes'] as const).map((tabKey) => (
                <Button
                  key={tabKey}
                  type="button"
                  variant={tab === tabKey ? 'default' : 'outline'}
                  onClick={() => openTabPage(tabKey)}
                >
                  {t(`tabs.${tabKey}`)}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              disabled={!sessionId}
              onClick={() => openCreate(tab === 'materials' ? 'material' : tab === 'comments' ? 'comment' : 'note')}
            >
              <Plus className="size-4" /> {t('actions.add')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 sm:px-5">
          {!sessionId ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center text-muted-foreground">
              {t('placeholders.emptySelection')}
            </div>
          ) : activeQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-14 rounded-2xl" />)}
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border bg-background/70 p-3">
                <div className="grid gap-3">
                  {activeItems.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">{t('placeholders.empty')}</div>
                  ) : (
                    activeItems.map((item) => {
                      const material = item as Material
                      const textRecord = item as TextRecord
                      return (
                        <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {tab === 'materials' ? material.title || '-' : textRecord.content || '-'}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {tab === 'materials' ? (
                                <>
                                  <span>{isVideoMaterial(material) ? t('types.video') : t('types.file')}</span>
                                  {isVideoMaterial(material) ? (
                                    <Badge variant="outline" color={hlsBadgeColor(material)}>
                                      {hlsStatusLabel(material)}
                                    </Badge>
                                  ) : null}
                                </>
                              ) : (
                                <span>{textRecord.authorRole || '-'}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {tab === 'materials' ? (
                              isVideoMaterial(material) ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!isVideoReady(material)}
                                    onClick={() => void openVideoPlayback(material)}
                                  >
                                    <ExternalLink className="size-4" /> {t('actions.play')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={!isVideoReady(material)}
                                    onClick={() => void downloadVideoManifest(material)}
                                  >
                                    <FileVideo className="size-4" /> {t('actions.manifest')}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={downloadMutation.isPending}
                                    onClick={() => downloadMutation.mutate(material)}
                                  >
                                    <Download className="size-4" /> {t('actions.download')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(
                                        resolveApiUrl(API_ENDPOINTS.courseMaterials.stream(material.id)),
                                        '_blank',
                                        'noopener,noreferrer',
                                      )
                                    }
                                  >
                                    <ExternalLink className="size-4" /> {t('actions.view')}
                                  </Button>
                                </>
                              )
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                tab === 'materials'
                                  ? openMaterial(material)
                                  : openText(tab === 'comments' ? 'comment' : 'note', textRecord)
                              }
                            >
                              <Pencil className="size-4" /> {t('actions.edit')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              disabled={removeMutation.isPending}
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="size-4" /> {t('actions.delete')}
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="mt-4 flex shrink-0 items-center justify-end gap-2 border-t border-border/70 pt-4">
                <Button
                  variant="outline"
                  disabled={contentPage <= 1 || activeQuery.isFetching}
                  onClick={() => setContentPage((current) => Math.max(1, current - 1))}
                >
                  {t('actions.previous')}
                </Button>
                <Badge variant="outline">{t('pagination.summary', { page: contentPage, totalPages })}</Badge>
                <Button
                  variant="outline"
                  disabled={contentPage >= totalPages || activeQuery.isFetching}
                  onClick={() => setContentPage((current) => Math.min(totalPages, current + 1))}
                >
                  {t('actions.next')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={dialog.open}
        onOpenChange={(open) => {
          if (!saveMutation.isPending) setDialog((current) => ({ ...current, open }))
        }}
      >
        <SheetContent className="max-w-2xl">
          <SheetHeader>
            <SheetTitle>{dialogTitle}</SheetTitle>
            <SheetDescription>{dialog.kind === 'material' ? t('form.fileHint') : t('description')}</SheetDescription>
          </SheetHeader>

          {dialog.kind === 'material' ? (
            <div className="grid gap-4 py-2">
              {!isSessionDetailRoute ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('fields.course')}</Label>
                    <CustomSelect
                      value={dialog.material.courseId || undefined}
                      placeholder={t('placeholders.course')}
                      options={courseOptions}
                      onValueChange={(value) =>
                        setDialog((current) => ({
                          ...current,
                          material: { ...current.material, courseId: String(value), sessionId: '' },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('fields.session')}</Label>
                    <CustomSelect
                      value={dialog.material.sessionId || undefined}
                      placeholder={t('placeholders.session')}
                      disabled={!dialog.material.courseId}
                      options={dialogSessionOptions}
                      onValueChange={(value) =>
                        setDialog((current) => ({
                          ...current,
                          material: { ...current.material, sessionId: String(value) },
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>{t('fields.title')}</Label>
                <Input
                  value={dialog.material.title}
                  maxLength={200}
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      material: { ...current.material, title: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('fields.description')}</Label>
                <Textarea
                  value={dialog.material.description}
                  maxLength={1000}
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      material: { ...current.material, description: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('fields.materialType')}</Label>
                  <CustomSelect
                    value={String(dialog.material.materialType)}
                    options={[
                      { value: '1', label: t('types.file') },
                      { value: '2', label: t('types.video') },
                    ]}
                    onValueChange={(value) =>
                      setDialog((current) => ({
                        ...current,
                        material: {
                          ...current.material,
                          materialType: String(value) === '2' ? 2 : 1,
                          file: null,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('fields.order')}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={dialog.material.order}
                    onChange={(event) =>
                      setDialog((current) => ({
                        ...current,
                        material: { ...current.material, order: Number(event.target.value) },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('fields.file')}</Label>
                <input
                  type="file"
                  accept={dialog.material.materialType === 2 ? VIDEO_MATERIAL_ACCEPT : FILE_MATERIAL_ACCEPT}
                  className="block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      material: { ...current.material, file: event.target.files?.[0] ?? null },
                    }))
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-2">
              {!isSessionDetailRoute ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('fields.course')}</Label>
                    <CustomSelect
                      value={dialog.text.courseId || undefined}
                      placeholder={t('placeholders.course')}
                      options={courseOptions}
                      onValueChange={(value) =>
                        setDialog((current) => ({
                          ...current,
                          text: { ...current.text, courseId: String(value), sessionId: '' },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('fields.session')}</Label>
                    <CustomSelect
                      value={dialog.text.sessionId || undefined}
                      placeholder={t('placeholders.session')}
                      disabled={!dialog.text.courseId}
                      options={dialogSessionOptions}
                      onValueChange={(value) =>
                        setDialog((current) => ({
                          ...current,
                          text: { ...current.text, sessionId: String(value) },
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>{t('fields.content')}</Label>
                <Textarea
                  value={dialog.text.content}
                  maxLength={2000}
                  onChange={(event) =>
                    setDialog((current) => ({
                      ...current,
                      text: { ...current.text, content: event.target.value },
                    }))
                  }
                />
              </div>
            </div>
          )}

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={() => setDialog((current) => ({ ...current, open: false }))}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('actions.save')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !removeMutation.isPending) setDeleteTarget(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('messages.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('messages.deleteConfirm', { name: deleteName })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={removeMutation.isPending} onClick={() => setDeleteTarget(null)}>
              {t('actions.cancel')}
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMutation.isPending}
              onClick={() => deleteTarget && removeMutation.mutate(deleteTarget)}
            >
              {removeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
