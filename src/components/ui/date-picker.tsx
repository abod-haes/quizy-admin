import type { ComponentProps } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  id?: string
  ariaLabel?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  displayFormat?: string
  popoverAlign?: "start" | "center" | "end"
  popoverSideOffset?: number
  popoverClassName?: string
  calendarClassName?: string
  calendarProps?: Omit<ComponentProps<typeof Calendar>, "mode" | "selected" | "onSelect">
}

function DatePicker({
  id,
  ariaLabel,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  displayFormat = "PPP",
  popoverAlign,
  popoverSideOffset = 8,
  popoverClassName,
  calendarClassName,
  calendarProps,
}: DatePickerProps) {
  const { i18n } = useTranslation()
  const isRtl = i18n.dir() === "rtl"
  const resolvedAlign = popoverAlign ?? (isRtl ? "end" : "start")

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          id={id}
          data-slot="date-picker-trigger"
          aria-label={ariaLabel}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full min-w-0 items-center justify-start gap-2 rounded-xl border border-primary/10 bg-[var(--quizy-surface-strong)] px-3.5 text-start text-sm font-medium text-foreground shadow-[var(--quizy-control-shadow)] transition-[background-color,border-color,box-shadow,transform] duration-150 outline-none hover:border-primary/25 focus-visible:-translate-y-px focus-visible:border-primary/55 focus-visible:shadow-[var(--quizy-control-focus-shadow)] data-[state=open]:border-primary/55 data-[state=open]:shadow-[var(--quizy-control-focus-shadow)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-70",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{value ? format(value, displayFormat) : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-slot="date-picker-content"
        align={resolvedAlign}
        sideOffset={popoverSideOffset}
        className={cn(
          "w-auto rounded-xl border border-primary/10 bg-popover p-1.5 text-foreground shadow-[var(--quizy-popup-shadow)] ring-0",
          popoverClassName
        )}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          className={cn("rounded-lg border-border bg-popover p-1", calendarClassName)}
          captionLayout="label"
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
