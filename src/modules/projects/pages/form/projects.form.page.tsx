import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'
import { useProjectsCrudMutations, useProjectsById } from '@/modules/projects/hooks/use-projects-crud.hook'
import type { ProjectsCreatePayload } from '@/modules/projects/types/projects.type'
import { SUPPORTED_LANGUAGES, SUPPORTED_LANGUAGE_OPTIONS, type SupportedLanguage } from '@/shared/constants/languages'
import {
  MEDIA_COLLECTION_ENUM,
  MEDIA_NAME_ENUM,
  type MediaCollection,
  type MediaName,
} from '@/shared/constants/media.enums'
import { PROJECT_STATUS_VALUES, type ProjectStatus } from '@/shared/constants/project-statuses'
import {
  ProjectsCreateSchema,
  hasProjectsValidationErrors,
  validateProjectsPayload,
  type ProjectsFormErrors,
} from '@/modules/projects/validations/projects.validation'
import { translateFormError } from '@/shared/lib/forms/zod-form-errors'
import { Badge, Button, CustomSelect, EntityPageSkeleton, FormField, FormToggleRow, Input, MapCoordinatePicker, PageHeader, TruncatedText } from '@/shared/ui'

const ALEPPO_COORDINATES = { lat: 36.2021, lng: 37.1343 } as const

const initialState: ProjectsCreatePayload = {
  status: '',
  lat: ALEPPO_COORDINATES.lat,
  lng: ALEPPO_COORDINATES.lng,
  is_featured: false,
  sort_order: 0,
  is_active: false,
  translations: [{ lang: 'en', title: '', short_description: '', location_name: '' }],
}

type PendingProjectMediaUpload = {
  id: string
  file: File
  collection: MediaCollection
  name: MediaName
}

function getValueAtPath(target: unknown, path: string): unknown {
  const segments = path.split('.').filter(Boolean)

  let cursor: unknown = target
  for (const segment of segments) {
    if (!cursor || typeof cursor !== 'object') {
      return undefined
    }

    cursor = (cursor as Record<string, unknown>)[segment]
  }

  return cursor
}

function setValueAtPath<T extends Record<string, unknown>>(target: T, path: string, value: unknown): T {
  const segments = path.split('.').filter(Boolean)

  if (!segments.length) {
    return target
  }

  const clone = { ...target }
  let cursor: Record<string, unknown> = clone

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const isLeaf = index === segments.length - 1

    if (isLeaf) {
      cursor[segment] = value
      break
    }

    const nextValue = cursor[segment]
    const nextObject =
      nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)
        ? { ...(nextValue as Record<string, unknown>) }
        : {}

    cursor[segment] = nextObject
    cursor = nextObject
  }

  return clone as T
}

function toCreatePayload(value: unknown): ProjectsCreatePayload {
  const merged =
    value && typeof value === 'object'
      ? { ...initialState, ...(value as Record<string, unknown>) }
      : initialState

  const parsed = ProjectsCreateSchema.partial().safeParse(merged)
  if (!parsed.success) {
    return merged as ProjectsCreatePayload
  }

  return { ...initialState, ...parsed.data, section_id: null } as ProjectsCreatePayload
}

export default function ProjectsFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation('projects')
  const entitySingular = t('entity.singular', { defaultValue: 'Project' })

  const isEdit = useMemo(() => Boolean(id), [id])
  const detailQuery = useProjectsById(id ?? '', isEdit)
  const { createMutation, updateMutation, addMediaMutation, removeMediaMutation } = useProjectsCrudMutations()

  const [draft, setDraft] = useState<Partial<ProjectsCreatePayload>>({})
  const [errors, setErrors] = useState<ProjectsFormErrors>({})
  const [pendingMediaUploads, setPendingMediaUploads] = useState<PendingProjectMediaUpload[]>([])

  const baseForm = useMemo<ProjectsCreatePayload>(() => toCreatePayload(detailQuery.data), [detailQuery.data])

  const form = useMemo<ProjectsCreatePayload>(() => ({ ...baseForm, ...draft }), [baseForm, draft])

  const localizedLanguageOptions = useMemo(
    () =>
      SUPPORTED_LANGUAGE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(`form.languages.${option.value}`, { defaultValue: option.label }),
      })),
    [t]
  )
  const translations = ((getValueAtPath(form, 'translations') as ProjectsCreatePayload['translations'] | undefined) ?? [])
  const selectedLanguages = useMemo(
    () => new Set(translations.map((entry) => entry?.lang).filter(Boolean)),
    [translations]
  )
  const getLanguageOptionsForIndex = (index: number) =>
    localizedLanguageOptions.map((option) => ({
      ...option,
      disabled:
        selectedLanguages.has(option.value as SupportedLanguage) &&
        translations[index]?.lang !== option.value,
    }))
  const canAddTranslation = selectedLanguages.size < localizedLanguageOptions.length
  const projectMedia = detailQuery.data?.media ?? []

  if (isEdit && detailQuery.isLoading) {
    return (
      <section className="space-y-6 w-full">
        <PageHeader
          breadcrumbs={<AppBreadcrumbs />}
          title={(isEdit ? t('common.actions.edit', { ns: 'translation' }) : t('common.actions.add', { ns: 'translation' })) + ' ' + entitySingular}
          description={isEdit ? t('common.form.updateDescription', { ns: 'translation' }) : t('common.form.createDescription', { ns: 'translation' })}
        />
        <EntityPageSkeleton mode="form" />
      </section>
    )
  }

  const updateTranslationField = (
    index: number,
    field: 'lang' | 'title' | 'short_description' | 'location_name',
    value: string
  ) => {
    setDraft((previous) => {
      const current = (getValueAtPath({ ...form, ...previous }, 'translations') as ProjectsCreatePayload['translations'] | undefined) ?? []
      const nextArray = [...current]
      const nextItem = { ...(nextArray[index] ?? { lang: 'en', title: '', short_description: '', location_name: '' }) }
      ;(nextItem as Record<string, string>)[field] = value
      nextArray[index] = nextItem
      return setValueAtPath(previous as Record<string, unknown>, 'translations', nextArray) as Partial<ProjectsCreatePayload>
    })
  }

  const handleSubmit = async () => {
    const nextForm = { ...(form as ProjectsCreatePayload), section_id: null }
    const nextErrors = validateProjectsPayload(nextForm)
    setErrors(nextErrors)

    if (hasProjectsValidationErrors(nextErrors)) {
      return
    }

    const savedEntity =
      isEdit && id
        ? await updateMutation.mutateAsync({ identifier: id, data: nextForm })
        : await createMutation.mutateAsync(nextForm)

    const targetId = isEdit && id ? id : String(savedEntity.id)
    if (targetId && pendingMediaUploads.length) {
      for (const mediaUpload of pendingMediaUploads) {
        await addMediaMutation.mutateAsync({
          identifier: targetId,
          file: mediaUpload.file,
          collection: mediaUpload.collection,
          name: mediaUpload.name,
        })
      }
      setPendingMediaUploads([])
    }

    navigate(APP_ROUTES.projects.path)
  }

  const handleRemoveMedia = async (mediaId: number) => {
    if (!id) return
    await removeMediaMutation.mutateAsync({ identifier: id, mediaId })
    await detailQuery.refetch()
  }

  const handleAddPendingMediaFiles = (files: FileList | File[]) => {
    const nextUploads = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        collection: MEDIA_COLLECTION_ENUM.projects,
        name: MEDIA_NAME_ENUM.image,
      }))

    if (!nextUploads.length) {
      return
    }

    setPendingMediaUploads((previous) => [...previous, ...nextUploads])
  }

  const handleRemovePendingMediaUpload = (uploadId: string) => {
    setPendingMediaUploads((previous) => previous.filter((upload) => upload.id !== uploadId))
  }

  return (
    <section className="space-y-6 w-full">
      <PageHeader
        breadcrumbs={<AppBreadcrumbs />}
        title={(isEdit ? t('common.actions.edit', { ns: 'translation' }) : t('common.actions.add', { ns: 'translation' })) + ' ' + entitySingular}
        description={isEdit ? t('common.form.updateDescription', { ns: 'translation' }) : t('common.form.createDescription', { ns: 'translation' })}
      />

      <div className="space-y-6 rounded-md border border-border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="space-y-4 rounded-md border border-border/70 bg-muted/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('common.form.basicInfo', { ns: 'translation', defaultValue: 'معلومات أساسية' })}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField htmlFor="projects-status" label={`${t('form.fields.status')} *`} error={translateFormError(errors['status'], t)}>
              <CustomSelect
                id="projects-status"
                value={(getValueAtPath(form, 'status') as ProjectStatus | '' | undefined) || undefined}
                placeholder={t('form.fields.status')}
                options={PROJECT_STATUS_VALUES.map((value) => ({
                  value,
                  label: t(`form.statusValues.${value}`, { defaultValue: value }),
                }))}
                onValueChange={(value) =>
                  setDraft((previous) =>
                    setValueAtPath(previous as Record<string, unknown>, 'status', String(value)) as Partial<ProjectsCreatePayload>
                  )
                }
              />
            </FormField>

            {isEdit ? (
              <FormField htmlFor="projects-sort_order" label={t('form.fields.sortOrder')} error={translateFormError(errors['sort_order'], t)}>
                <Input
                  id="projects-sort_order"
                  type="number"
                  value={String((getValueAtPath(form, 'sort_order') as number | undefined) ?? '')}
                  onChange={(event) =>
                    setDraft((previous) =>
                      setValueAtPath(previous as Record<string, unknown>, 'sort_order', event.target.value === '' ? undefined : Number(event.target.value)) as Partial<ProjectsCreatePayload>
                    )
                  }
                />
              </FormField>
            ) : null}

            <FormToggleRow
              label={t('form.fields.isFeatured')}
              checked={Boolean(getValueAtPath(form, 'is_featured'))}
              onCheckedChange={(checked) =>
                setDraft((previous) =>
                  setValueAtPath(previous as Record<string, unknown>, 'is_featured', checked) as Partial<ProjectsCreatePayload>
                )
              }
            />

            <FormToggleRow
              label={t('form.fields.isActive')}
              checked={Boolean(getValueAtPath(form, 'is_active'))}
              onCheckedChange={(checked) =>
                setDraft((previous) =>
                  setValueAtPath(previous as Record<string, unknown>, 'is_active', checked) as Partial<ProjectsCreatePayload>
                )
              }
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{t('form.fields.mapCoordinates', { defaultValue: 'Map Coordinates' })}</p>
            <MapCoordinatePicker
              lat={Number(getValueAtPath(form, 'lat') ?? ALEPPO_COORDINATES.lat)}
              lng={Number(getValueAtPath(form, 'lng') ?? ALEPPO_COORDINATES.lng)}
              onChange={({ lat, lng }) =>
                setDraft((previous) => {
                  const withLat = setValueAtPath(previous as Record<string, unknown>, 'lat', lat) as Partial<ProjectsCreatePayload>
                  return setValueAtPath(withLat as Record<string, unknown>, 'lng', lng) as Partial<ProjectsCreatePayload>
                })
              }
            />
            {(errors.lat || errors.lng) ? (
              <p className="text-xs text-destructive">
                {translateFormError(errors.lat, t) || translateFormError(errors.lng, t)}
              </p>
            ) : null}
          </div>
          </div>

          <div className="space-y-4 rounded-md border border-border/70 bg-muted/20 p-4">
            <h3 className="text-sm font-semibold text-foreground">{t('form.fields.projectImages', { defaultValue: 'Project Images' })}</h3>
            <label
              htmlFor="project-images"
              className="flex min-h-32 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/50 px-4 py-6 text-center transition-colors hover:border-primary/45 hover:bg-muted/20"
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {t('form.fields.projectImagesHint', { defaultValue: 'Choose images to preview before upload' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('form.fields.projectImagesHint', { defaultValue: 'Choose images to preview before upload' })}
                </p>
              </div>
            </label>
            <Input
              id="project-images"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={createMutation.isPending || updateMutation.isPending || addMediaMutation.isPending}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                if (!files.length) {
                  return
                }
                handleAddPendingMediaFiles(files)
                event.target.value = ''
              }}
            />

            {pendingMediaUploads.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {pendingMediaUploads.map((upload) => (
                  <PendingProjectMediaCard
                    key={upload.id}
                    file={upload.file}
                    onRemove={() => handleRemovePendingMediaUpload(upload.id)}
                  />
                ))}
              </div>
            ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {projectMedia.map((media) => (
              <div key={media.id} className="rounded-lg border border-border/80 bg-card p-3">
                <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
                  <img src={media.thumb_url || media.url} alt={media.name || media.file_name} className="h-28 w-full object-cover" />
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-foreground">{media.name || media.file_name}</p>
                  <TruncatedText text={media.url} maxLength={60} className="text-xs text-muted-foreground" />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={removeMediaMutation.isPending}
                    onClick={() => void handleRemoveMedia(media.id)}
                  >
                    {t('common.actions.delete', { ns: 'translation' })}
                  </Button>
                </div>
              </div>
            ))}
            {!projectMedia.length ? <p className="text-xs text-muted-foreground">{t('form.fields.noProjectImages', { defaultValue: 'No images uploaded yet.' })}</p> : null}
          </div>
          </div>
        </div>

        <div className="space-y-4 rounded-md border border-border/70 bg-muted/20 p-4">
          <FormField
            htmlFor="projects-translations"
            label={`${t('form.fields.translations')} *`}
            error={translateFormError(errors['translations'], t)}
          >
            <div className="space-y-3">
              {translations.map((item, index) => {
                const rowErrors = {
                  lang: errors[`translations.${index}.lang`],
                  title: errors[`translations.${index}.title`],
                  location_name: errors[`translations.${index}.location_name`],
                  short_description: errors[`translations.${index}.short_description`],
                }

                return (
                  <div key={index} className="space-y-3 rounded-md border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" color="blue">
                        {t('form.fields.translations', { defaultValue: 'Translations' })} #{index + 1}
                      </Badge>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setDraft((previous) => {
                            const current = (getValueAtPath({ ...form, ...previous }, 'translations') as unknown[] | undefined) ?? []
                            const nextArray = current.filter((_, entryIndex) => entryIndex !== index)
                            return setValueAtPath(previous as Record<string, unknown>, 'translations', nextArray) as Partial<ProjectsCreatePayload>
                          })
                        }
                      >
                        {t('common.actions.delete', { ns: 'translation' })}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-8">
                      <div className="space-y-1">
                        <CustomSelect
                          id={index === 0 ? 'projects-translations-lang' : undefined}
                          placeholder={t('form.fields.translationLang')}
                          value={(item?.lang as SupportedLanguage | undefined) ?? undefined}
                          options={getLanguageOptionsForIndex(index)}
                          onValueChange={(value) => updateTranslationField(index, 'lang', String(value))}
                        />
                        {rowErrors.lang ? (
                          <p className="text-xs text-destructive">{translateFormError(rowErrors.lang, t)}</p>
                        ) : null}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Input
                          id={index === 0 ? 'projects-translations-title' : undefined}
                          placeholder={t('form.fields.translationTitle')}
                          value={String(item?.title ?? '')}
                          onChange={(event) => updateTranslationField(index, 'title', event.target.value)}
                          onBlur={() => {
                            const value = String(item?.title ?? '').trim()
                            const key = `translations.${index}.title`
                            setErrors((previous) => {
                              if (!value) {
                                return { ...previous, [key]: 'common.validation.required' }
                              }
                              if (!previous[key]) {
                                return previous
                              }
                              const next = { ...previous }
                              delete next[key]
                              return next
                            })
                          }}
                        />
                        {rowErrors.title ? (
                          <p className="text-xs text-destructive">{translateFormError(rowErrors.title, t)}</p>
                        ) : null}
                      </div>
                    

                    <Input
                      id={index === 0 ? 'projects-translations-location_name' : undefined}
                      placeholder={t('form.fields.translationLocationName')}
                      value={String(item?.location_name ?? '')}
                      className="md:col-span-2"
                      onChange={(event) => updateTranslationField(index, 'location_name', event.target.value)}
                      />
                        <Input
                      id={index === 0 ? 'projects-translations-short_description' : undefined}
                      placeholder={t('form.fields.translationShortDescription')}
                      value={String(item?.short_description ?? '')}
                      className="md:col-span-3"
                      onChange={(event) => updateTranslationField(index, 'short_description', event.target.value)}
                    />
                    </div>

                  
                  </div>
                )
              })}

              <Button
                type="button"
                variant="secondary"
                disabled={!canAddTranslation}
                onClick={() =>
                  setDraft((previous) => {
                    const current = (getValueAtPath({ ...form, ...previous }, 'translations') as ProjectsCreatePayload['translations'] | undefined) ?? []
                    const used = new Set(current.map((entry) => entry?.lang).filter(Boolean))
                    const nextLanguage = (SUPPORTED_LANGUAGES.find((lang) => !used.has(lang)) ?? 'en') as SupportedLanguage
                    return setValueAtPath(
                      previous as Record<string, unknown>,
                      'translations',
                      [...current, { lang: nextLanguage, title: '', short_description: '', location_name: '' }]
                    ) as Partial<ProjectsCreatePayload>
                  })
                }
              >
                {t('common.actions.add', { ns: 'translation' })} {t('form.fields.translations')}
              </Button>
            </div>
          </FormField>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/80 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(APP_ROUTES.projects.path)}>
            {t('common.actions.cancel', { ns: 'translation' })}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            loading={createMutation.isPending || updateMutation.isPending || addMediaMutation.isPending}
            disabled={createMutation.isPending || updateMutation.isPending || addMediaMutation.isPending}
          >
            {isEdit ? t('common.actions.update', { ns: 'translation' }) : t('common.actions.create', { ns: 'translation' })}
          </Button>
        </div>
      </div>
    </section>
  )
}

function PendingProjectMediaCard({ file, onRemove }: { file: File; onRemove: () => void }) {
  const { t } = useTranslation('translation')
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  return (
    <div className="rounded-lg border border-border/80 bg-card p-3">
      <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
        {previewUrl ? <img src={previewUrl} alt={file.name} className="h-28 w-full object-cover" /> : null}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          {t('common.actions.delete', { defaultValue: 'Delete' })}
        </Button>
      </div>
    </div>
  )
}

