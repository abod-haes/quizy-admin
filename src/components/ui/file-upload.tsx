import { CustomFileInput } from './custom-file-input-v2'

interface FileUploadProps {
  value?: File | null
  onChange: (file: File | null) => void
  accept?: string
  preview?: boolean
}

export function FileUpload({ value, onChange, accept, preview = false }: FileUploadProps) {
  const imageOnly = preview || accept?.trim() === 'image/*'

  return (
    <CustomFileInput
      value={value?.name}
      accept={accept ?? (imageOnly ? 'image/*' : '*/*')}
      uploadLabel={imageOnly ? 'رفع صورة' : 'رفع صورة أو ملف'}
      removeLabel={imageOnly ? 'إزالة الصورة' : 'إزالة الملف'}
      hint={
        imageOnly
          ? 'اسحب الصورة هنا أو اضغط للاختيار.'
          : 'اسحب الملف هنا أو اضغط للاختيار. يدعم المستندات والصور.'
      }
      onFileSelect={onChange}
    />
  )
}
