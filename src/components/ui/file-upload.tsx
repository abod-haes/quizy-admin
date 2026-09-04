import { useRef } from "react";
import type { ChangeEvent } from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  preview?: boolean;
}

export function FileUpload({ value, onChange, accept, preview = false }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null);
  };

  return (
    <div
      className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] p-6 transition hover:bg-primary/[0.06]"
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />

      {value ? (
        <div className="flex w-full items-center justify-between rounded-xl bg-background p-3">
          <div className="flex items-center gap-3">
            {preview && value.type.startsWith("image/") ? (
              <img src={URL.createObjectURL(value)} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
            <span className="max-w-56 truncate text-sm">{value.name}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="rounded-full p-2 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-full bg-primary/10 p-3">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium">اسحب الملف هنا أو اختر ملف</p>
          <p className="mt-1 text-xs text-muted-foreground">يدعم رفع المستندات والصور</p>
        </>
      )}
    </div>
  );
}