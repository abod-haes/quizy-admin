import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { generateFileUrl } from '@/shared/utils/file-url'

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

export function CustomFileInput({ id, value, previewSrc, accept = 'image/*', disabled = false, className, uploadLabel, removeLabel, hint, onFileSelect, onClear }: CustomFileInputProps) {
  const generatedId = useId()
  const inputId = id ?? `custom-file-input-${generatedId}`
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [localPreview, setLocalPreview] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [brokenPreview, setBrokenPreview] = useState('')

  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview) }, [localPreview])

  const applyFile = (nextFile: File | null) => {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(nextFile?.type.startsWith('image/') ? URL.createObjectURL(nextFile) : '')
    setSelectedFileName(nextFile?.name ?? '')
    setBrokenPreview('')
    onFileSelect?.(nextFile)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => applyFile(event.target.files?.[0] ?? null)
  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (!disabled) applyFile(event.dataTransfer.files?.[0] ?? null)
  }
  const handleClear = () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview('')
    setSelectedFileName('')
    setBrokenPreview('')
    if (inputRef.current) inputRef.current.value = ''
    onClear?.()
    onFileSelect?.(null)
  }

  const effectivePreview = generateFileUrl(localPreview || previewSrc || '')
  const showPreview = Boolean(effectivePreview) && brokenPreview !== effectivePreview
  const effectiveFileLabel = selectedFileName || value?.trim() || ''
  const hasFile = Boolean(effectiveFileLabel || effectivePreview)

  return (
    <div
      data-slot="file-image-input"
      className={cn(
        'w-full min-w-0 rounded-[var(--quizy-control-radius)] border border-primary/15 bg-[var(--quizy-surface-strong)] p-3 shadow-[var(--quizy-control-shadow)] sm:p-4',
        disabled && 'opacity-65',
        className,
      )}
    >
      <input id={inputId} ref={inputRef} type="file" accept={accept} className="sr-only" disabled={disabled} onChange={handleFileChange} />
      <div className="grid min-w-0 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:gap-4">
        <button
          data-slot="file-image-dropzone"
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => { event.preventDefault(); if (!disabled) setIsDragging(true) }}
          onDragOver={(event) => { event.preventDefault(); if (!disabled) setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'group relative flex h-32 w-full min-w-0 items-center justify-center overflow-hidden rounded-[var(--quizy-control-radius)] border border-dashed border-primary/25 bg-primary/[0.025] text-center outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-primary/40 hover:bg-primary/[0.045] focus-visible:border-primary/55 focus-visible:shadow-[var(--quizy-control-focus-shadow)] sm:h-28',
            isDragging && 'scale-[0.99] border-primary/60 bg-primary/[0.075] shadow-[var(--quizy-control-focus-shadow)]',
            disabled && 'cursor-not-allowed',
          )}
        >
          {showPreview ? (
            <>
              <img src={effectivePreview} alt="" className="size-full object-cover" onError={() => setBrokenPreview(effectivePreview)} />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-semibold text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">{uploadLabel}</span>
            </>
          ) : (
            <span className="flex max-w-28 flex-col items-center gap-2 px-3 text-muted-foreground">
              <span className="flex size-10 items-center justify-center rounded-[var(--quizy-control-radius)] bg-primary/10 text-primary"><Icon.uploadCloud className="size-5" /></span>
              <span className="text-xs font-semibold leading-5 text-foreground">{uploadLabel}</span>
            </span>
          )}
        </button>

        <div className="min-w-0 space-y-3">
          <div className="min-w-0 space-y-1">
            {effectiveFileLabel ? (
              <div className="flex min-w-0 items-center gap-2 rounded-[var(--quizy-control-radius)] border border-primary/10 bg-muted/35 px-3 py-2">
                <Icon.file className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground" dir="auto">{effectiveFileLabel}</span>
              </div>
            ) : null}
            {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="outline" disabled={disabled} onClick={() => inputRef.current?.click()} className="w-full sm:w-auto" icon={<Icon.uploadCloud />}>
              {uploadLabel}
            </Button>
            {hasFile ? (
              <Button type="button" variant="ghost" disabled={disabled} onClick={handleClear} className="w-full text-muted-foreground hover:text-destructive sm:w-auto" icon={<Icon.close />}>
                {removeLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
