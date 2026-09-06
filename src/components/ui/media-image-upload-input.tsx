import { Upload } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { MediaCollection, MediaName } from '@/shared/constants/media.enums'
import { Button } from '@/components/ui/button'
import { CustomFileInput } from '@/components/ui/custom-file-input-v2'
import { CustomSelect } from '@/components/ui/custom-select'

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
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [resetVersion, setResetVersion] = useState(0)
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
  const chooseLabel = t('common.media.choosePreviewBeforeUpload', {
    ns: 'translation',
    defaultValue: 'Choose an image to preview before upload',
  })
  const removeLabel = t('common.actions.reset', {
    ns: 'translation',
    defaultValue: 'Reset',
  })

  const selectFile = (nextFile: File | null) => {
    setFile(nextFile)
    onFileSelected?.({ file: nextFile, collection, name })
  }

  const clearFile = () => {
    setFile(null)
    setResetVersion((current) => current + 1)
    onFileSelected?.({ file: null, collection, name })
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

  return (
    <div
      data-slot="file-image-input"
      className="w-full min-w-0 space-y-4 rounded-[var(--quizy-control-radius)] border border-primary/15 bg-[var(--quizy-surface-strong)] p-3 shadow-[var(--quizy-control-shadow)] sm:p-4"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
        <p className="text-xs leading-5 text-muted-foreground">{resolvedHint}</p>
      </div>

      {!hideMetaSelectors ? (
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          <CustomSelect
            value={collection}
            options={collectionOptions}
            onValueChange={(value) => setCollection(value as MediaCollection)}
            disabled={disabled || isUploading}
          />
          <CustomSelect
            value={name}
            options={nameOptions}
            onValueChange={(value) => setName(value as MediaName)}
            disabled={disabled || isUploading}
          />
        </div>
      ) : null}

      <CustomFileInput
        key={`media-upload-${resetVersion}`}
        value={file?.name}
        accept={accept}
        disabled={disabled || isUploading}
        uploadLabel={chooseLabel}
        removeLabel={removeLabel}
        hint={resolvedHint}
        onFileSelect={selectFile}
      />

      {file && !uploadOnSubmit ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Upload className="size-4" />}
            disabled={disabled || isUploading}
            loading={isUploading}
            onClick={() => void handleUpload()}
          >
            {isUploading
              ? t('common.media.uploading', {
                  ns: 'translation',
                  defaultValue: 'Uploading...',
                })
              : t('common.media.upload', {
                  ns: 'translation',
                  defaultValue: 'Upload',
                })}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
