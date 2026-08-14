import { ImagePlus, Upload, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'

import type { MediaCollection, MediaName } from '@/shared/constants/media.enums'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'

type MediaImageUploadInputProps = {
  collectionOptions: Array<{ value: MediaCollection; label: string }>
  nameOptions: Array<{ value: MediaName; label: string }>
  defaultCollection: MediaCollection
  defaultName: MediaName
  disabled?: boolean
  accept?: string
  title?: string
  hint?: string
  uploadOnSubmit?: boolean
  hideMetaSelectors?: boolean
  onFileSelected?: (payload: { file: File | null; collection: MediaCollection; name: MediaName }) => void
  onUpload: (payload: { file: File; collection: MediaCollection; name: MediaName }) => Promise<void> | void
}

export function MediaImageUploadInput({
  collectionOptions,
  nameOptions,
  defaultCollection,
  defaultName,
  disabled = false,
  accept = 'image/*',
  title,
  hint,
  uploadOnSubmit = false,
  hideMetaSelectors = false,
  onFileSelected,
  onUpload,
}: MediaImageUploadInputProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [collection, setCollection] = useState<MediaCollection>(defaultCollection)
  const [name, setName] = useState<MediaName>(defaultName)
  const resolvedTitle =
    title ??
    t('common.media.uploadTitle', {
      ns: 'translation',
      defaultValue: 'Upload media file',
    })
  const resolvedHint =
    hint ??
    t('common.media.uploadHint', {
      ns: 'translation',
      defaultValue: 'Choose an image to preview before upload',
    })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    onFileSelected?.({ file: nextFile, collection, name })
  }

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const clearFile = () => {
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onFileSelected?.({ file: null, collection, name })
  }

  const handleClearButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    clearFile()
  }

  const handleUpload = async () => {
    if (!file || disabled || isUploading) return
    try {
      setIsUploading(true)
      await onUpload({ file, collection, name })
      clearFile()
    } finally {
      setIsUploading(false)
    }
  }

  const fileSizeLabel = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : null
  const openFilePicker = () => {
    if (disabled || isUploading) return
    fileInputRef.current?.click()
  }

  return (
    <div
      data-slot="file-image-input"
      className="w-full min-w-0 space-y-4 rounded-2xl border border-primary/15 bg-[var(--quizy-surface-strong)] p-3 shadow-[var(--quizy-control-shadow)] sm:p-4"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
        <p className="text-xs leading-5 text-muted-foreground">{resolvedHint}</p>
      </div>

      {!hideMetaSelectors ? (
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          <CustomSelect value={collection} options={collectionOptions} onValueChange={(value) => setCollection(value as MediaCollection)} disabled={disabled || isUploading} />
          <CustomSelect value={name} options={nameOptions} onValueChange={(value) => setName(value as MediaName)} disabled={disabled || isUploading} />
        </div>
      ) : null}

      <div
        data-slot="file-image-dropzone"
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openFilePicker()
          }
        }}
        className="group flex min-h-32 min-w-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-primary/25 bg-primary/[0.025] p-3 outline-none transition-[border-color,background-color,box-shadow] hover:border-primary/40 hover:bg-primary/[0.045] focus-visible:border-primary/55 focus-visible:shadow-[var(--quizy-control-focus-shadow)] sm:p-4"
      >
        <Input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || isUploading}
          className="sr-only"
        />

        {previewUrl ? (
          <div className="w-full min-w-0 space-y-3">
            <div className="overflow-hidden rounded-xl border border-primary/10 bg-background/80 p-2">
              <div className="flex min-h-52 items-center justify-center overflow-hidden rounded-lg bg-muted/25">
                <img
                  src={previewUrl}
                  alt={file?.name ?? 'Selected image preview'}
                  className="max-h-[22rem] w-full object-contain"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-primary/10 bg-muted/35 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold text-foreground" dir="auto">{file?.name}</p>
                <p className="text-xs text-muted-foreground">{fileSizeLabel}</p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {!uploadOnSubmit ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Upload className="size-4" />}
                    disabled={!file || disabled || isUploading}
                    loading={isUploading}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      void handleUpload()
                    }}
                  >
                    {isUploading
                      ? t('common.media.uploading', { ns: 'translation', defaultValue: 'Uploading...' })
                      : t('common.media.upload', { ns: 'translation', defaultValue: 'Upload' })}
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  icon={<X className="size-4" />}
                  disabled={disabled || isUploading}
                  onClick={handleClearButtonClick}
                  aria-label={t('common.actions.reset', { ns: 'translation', defaultValue: 'Reset' })}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ImagePlus className="size-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">
              {t('common.media.choosePreviewBeforeUpload', {
                ns: 'translation',
                defaultValue: 'Choose an image to preview before upload',
              })}
            </p>
            <p className="max-w-md text-xs leading-5 text-muted-foreground">{resolvedHint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
