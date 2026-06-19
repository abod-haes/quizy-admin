import { Camera, UserRound } from 'lucide-react'
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
  const shouldShowPreview =
    Boolean(previewSrc) && brokenPreviewSrc !== previewSrc

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileSelect?.(event.target.files?.[0] ?? null)
  }

  return (
    <Card className={cn('rounded-md border border-border bg-card', className)}>
      <CardContent className="space-y-4 p-5 text-center">
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />

        <div className="relative mx-auto flex size-28 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40">
          {shouldShowPreview ? (
            <img
              src={previewSrc}
              alt=""
              className="size-full object-cover"
              onError={() => setBrokenPreviewSrc(previewSrc ?? '')}
            />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-md bg-background text-muted-foreground [&_svg]:size-6">
              <UserRound />
            </span>
          )}

          <span className="absolute -bottom-1 -end-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground [&_svg]:size-3.5">
            <Camera />
          </span>
        </div>

        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs leading-5">{description}</CardDescription>
          ) : null}
          {recommendation ? <p className="text-[11px] text-muted-foreground">{recommendation}</p> : null}
          {value ? (
            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {value}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {uploadLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
