import { ImagePlus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type CustomFileInputProps = {
  id?: string
  value?: string
  previewSrc?: string
  accept?: string
  disabled?: boolean
  className?: string
  uploadLabel: string
  removeLabel: string
  hint?: string
  onFileSelect?: (file: File | null) => void
  onClear?: () => void
}

export function CustomFileInput({
  id,
  value,
  previewSrc,
  accept = 'image/*',
  disabled = false,
  className,
  uploadLabel,
  removeLabel,
  hint,
  onFileSelect,
  onClear,
}: CustomFileInputProps) {
  const generatedId = useId()
  const inputId = id ?? `custom-file-input-${generatedId}`
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [localPreview, setLocalPreview] = useState('')

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null

    if (localPreview) {
      URL.revokeObjectURL(localPreview)
      setLocalPreview('')
    }

    if (nextFile) {
      setLocalPreview(URL.createObjectURL(nextFile))
    }

    onFileSelect?.(nextFile)
  }

  const handleClear = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
      setLocalPreview('')
    }

    if (inputRef.current) {
      inputRef.current.value = ''
    }

    onClear?.()
    onFileSelect?.(null)
  }

  const effectivePreview = localPreview || previewSrc || ''

  return (
    <div className={cn('rounded-md border border-border/80 bg-muted/20 p-3', className)}>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          className="flex h-28 w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-border/90 bg-background sm:w-36"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {effectivePreview ? (
            <img src={effectivePreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus className="size-5" />
              <span className="text-xs">{uploadLabel}</span>
            </span>
          )}
        </button>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {uploadLabel}
            </Button>
            {(value?.trim() || localPreview) ? (
              <Button type="button" variant="ghost" disabled={disabled} onClick={handleClear}>
                <X className="me-1 size-4" />
                {removeLabel}
              </Button>
            ) : null}
          </div>

          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          {value?.trim() ? (
            <p className="truncate text-xs text-muted-foreground" dir="ltr">
              {value}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
