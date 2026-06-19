import { useEffect, useRef, useState, type ReactNode } from 'react'

import type { ModelType } from '@/shared/constants/model-types'
import { ProfileUploadCard } from '@/components/ui/profile-upload-card'

type ModelMediaUploadResult = {
  uploadedPath?: string | null
}

type ModelMediaUploadRequest = {
  file: File
  modelType: ModelType
  modelId: string
  collection?: string
  attachmentType?: string
  notes?: string
  reservationHotelId?: string | number
}

type ModelMediaUploadCardProps = {
  id?: string
  title: ReactNode
  description?: ReactNode
  uploadLabel: ReactNode
  uploadingLabel?: ReactNode
  recommendation?: ReactNode
  value?: string
  previewSrc?: string
  accept?: string
  disabled?: boolean
  className?: string
  modelType: ModelType
  modelId?: string | number | null
  collection?: string
  attachmentType?: string
  notes?: string
  reservationHotelId?: string | number
  autoUploadWhenModelIdAvailable?: boolean
  onUpload?: (request: ModelMediaUploadRequest) => Promise<ModelMediaUploadResult | void>
  onUploadSuccess?: (result: ModelMediaUploadResult) => void
  onUploadError?: (error: unknown) => void
  onPendingFileChange?: (file: File | null) => void
  onUploadingChange?: (isUploading: boolean) => void
}

export function ModelMediaUploadCard({
  id,
  title,
  description,
  uploadLabel,
  uploadingLabel,
  recommendation,
  value,
  previewSrc,
  accept,
  disabled = false,
  className,
  modelType,
  modelId,
  collection,
  attachmentType,
  notes,
  reservationHotelId,
  autoUploadWhenModelIdAvailable = true,
  onUpload,
  onUploadSuccess,
  onUploadError,
  onPendingFileChange,
  onUploadingChange,
}: ModelMediaUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [pendingDisplayValue, setPendingDisplayValue] = useState<string | undefined>()
  const [pendingPreviewSrc, setPendingPreviewSrc] = useState<string | undefined>()
  const localPreviewUrlRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current)
      }
    },
    []
  )

  const handleUploadingState = (nextValue: boolean) => {
    setIsUploading(nextValue)
    onUploadingChange?.(nextValue)
  }

  const uploadSelectedFile = async (file: File): Promise<void> => {
    const normalizedModelId =
      modelId === null || modelId === undefined ? '' : String(modelId).trim()

    if (!normalizedModelId) {
      return
    }
    if (!onUpload) {
      return
    }

    handleUploadingState(true)
    try {
      const result = await onUpload({
        file,
        modelType,
        modelId: normalizedModelId,
        collection,
        attachmentType,
        notes,
        reservationHotelId,
      })

      onUploadSuccess?.(result ?? {})
      onPendingFileChange?.(null)

      const uploadedPath = result?.uploadedPath ?? null
      setPendingDisplayValue(uploadedPath || undefined)
      setPendingPreviewSrc(uploadedPath || undefined)
    } catch (error) {
      onUploadError?.(error)
    } finally {
      handleUploadingState(false)
    }
  }

  const handleFileSelect = (file: File | null) => {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current)
      localPreviewUrlRef.current = null
    }

    onPendingFileChange?.(file)

    if (!file) {
      setPendingDisplayValue(undefined)
      setPendingPreviewSrc(undefined)
      return
    }

    const localPreviewUrl = URL.createObjectURL(file)
    localPreviewUrlRef.current = localPreviewUrl

    setPendingDisplayValue(file.name)
    setPendingPreviewSrc(localPreviewUrl)

    if (!autoUploadWhenModelIdAvailable) {
      return
    }

    const normalizedModelId =
      modelId === null || modelId === undefined ? '' : String(modelId).trim()

    if (!normalizedModelId) {
      return
    }

    void uploadSelectedFile(file)
  }

  return (
    <ProfileUploadCard
      id={id}
      title={title}
      description={description}
      recommendation={recommendation}
      uploadLabel={isUploading && uploadingLabel ? uploadingLabel : uploadLabel}
      value={pendingDisplayValue ?? value}
      previewSrc={pendingPreviewSrc ?? previewSrc ?? value}
      accept={accept}
      disabled={disabled || isUploading}
      className={className}
      onFileSelect={handleFileSelect}
    />
  )
}
