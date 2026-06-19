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
    <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
          <p className="text-xs text-muted-foreground">{resolvedHint}</p>
        </div>
      </div>

      {!hideMetaSelectors ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CustomSelect value={collection} options={collectionOptions} onValueChange={(value) => setCollection(value as MediaCollection)} disabled={disabled || isUploading} />
          <CustomSelect value={name} options={nameOptions} onValueChange={(value) => setName(value as MediaName)} disabled={disabled || isUploading} />
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openFilePicker()
          }
        }}
        className="group flex min-h-44 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border/80 bg-gradient-to-b from-muted/20 to-muted/35 p-4 transition-colors hover:border-primary/45 hover:from-muted/35 hover:to-muted/50"
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
        <div className="w-full space-y-3">
          <div className="overflow-hidden rounded-xl border border-border/80 bg-background p-2">
            <div className="flex min-h-60 items-center justify-center overflow-hidden rounded-lg bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.04)_10px,transparent_10px,transparent_20px)] dark:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_10px,transparent_10px,transparent_20px)]">
              <img
                src={previewUrl}
                alt={file?.name ?? 'Selected image preview'}
                className="max-h-[22rem] w-full object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/15 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-semibold text-foreground">{file?.name}</p>
              <p className="text-xs text-muted-foreground">{fileSizeLabel}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
            <span className="rounded-full border border-border bg-background p-2">
              <ImagePlus className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
            </span>
            <p className="text-sm font-medium text-foreground">
              {t('common.media.choosePreviewBeforeUpload', {
                ns: 'translation',
                defaultValue: 'Choose an image to preview before upload',
              })}
            </p>
            <p className="text-xs text-muted-foreground">{resolvedHint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
