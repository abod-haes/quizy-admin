import { Camera, UploadCloud, UserRound } from 'lucide-react'
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { generateFileUrl } from '@/shared/utils/file-url'

type ProfileUploadCardProps = {
  id?: string
  title: ReactNode
  description?: ReactNode
  uploadLabel: ReactNode
  recommendation?: ReactNode
  value?: string
  previewSrc?: string
  accept?: string
  disabled?: boolean
  className?: string
  onFileSelect?: (file: File | null) => void
}

export function ProfileUploadCard({
  id,
  title,
  description,
  uploadLabel,
  recommendation,
  value,
  previewSrc,
  accept = 'image/*',
  disabled = false,
  className,
  onFileSelect,
}: ProfileUploadCardProps) {
  const generatedId = useId()
  const inputId = id ?? `profile-upload-${generatedId}`
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [brokenPreviewSrc, setBrokenPreviewSrc] = useState('')
  const resolvedPreviewSrc = generateFileUrl(previewSrc)
  const shouldShowPreview = Boolean(resolvedPreviewSrc) && brokenPreviewSrc !== resolvedPreviewSrc

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileSelect?.(event.target.files?.[0] ?? null)
  }

  return (
    <Card
      data-slot="file-image-input"
      className={cn(
        'w-full min-w-0 rounded-2xl border border-primary/15 bg-[var(--quizy-surface-strong)] shadow-[var(--quizy-control-shadow)]',
        disabled && 'opacity-65',
        className,
      )}
    >
      <CardContent className="grid min-w-0 gap-4 p-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:p-4">
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />

        <button
          data-slot="file-image-dropzone"
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="group relative flex h-32 w-full min-w-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-primary/25 bg-primary/[0.025] text-center outline-none transition-[border-color,background-color,box-shadow] hover:border-primary/40 hover:bg-primary/[0.045] focus-visible:border-primary/55 focus-visible:shadow-[var(--quizy-control-focus-shadow)] disabled:cursor-not-allowed sm:h-28"
        >
          {shouldShowPreview ? (
            <>
              <img
                src={resolvedPreviewSrc}
                alt=""
                className="size-full object-cover"
                onError={() => setBrokenPreviewSrc(resolvedPreviewSrc)}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                <Camera className="size-5" />
              </span>
            </>
          ) : (
            <span className="flex max-w-28 flex-col items-center gap-2 px-3 text-muted-foreground">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="size-5" />
              </span>
              <span className="text-xs font-semibold leading-5 text-foreground">{uploadLabel}</span>
            </span>
          )}
        </button>

        <div className="min-w-0 space-y-3 text-start">
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
            {description ? <CardDescription className="text-xs leading-5">{description}</CardDescription> : null}
            {recommendation ? <p className="text-xs leading-5 text-muted-foreground">{recommendation}</p> : null}
            {value ? (
              <p className="truncate rounded-xl border border-primary/10 bg-muted/35 px-3 py-2 text-xs font-medium text-foreground" dir="auto">
                {value}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="size-4" />
            {uploadLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
