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
          aria-label={ariaLabel}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-start gap-2 rounded-md border border-input bg-card px-3 text-start text-sm text-foreground transition-[background-color,border-color] duration-150 outline-none hover:border-muted-foreground/45 focus-visible:border-primary/55 focus-visible:ring-1 focus-visible:ring-primary/20 data-[state=open]:border-primary/55 data-[state=open]:ring-1 data-[state=open]:ring-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-70",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="truncate">{value ? format(value, displayFormat) : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={resolvedAlign}
        sideOffset={popoverSideOffset}
        className={cn(
          "w-auto rounded-md border border-border bg-popover p-1 text-foreground ring-0",
          popoverClassName
        )}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          className={cn("rounded-md border-border bg-popover p-1", calendarClassName)}
          captionLayout="label"
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
