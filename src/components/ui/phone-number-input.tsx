import type { ChangeEvent, ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { normalizePhoneDigits } from '@/shared/lib/display-format.helpers'

type PhoneNumberInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'inputMode' | 'value' | 'onChange' | 'dir'
> & {
  value: string
  onValueChange: (value: string) => void
}

function sanitizePhoneNumber(rawValue: string): string {
  return normalizePhoneDigits(rawValue)
}

export function PhoneNumberInput({
  value,
  onValueChange,
  className,
  autoComplete,
  ...props
}: PhoneNumberInputProps) {
  const { i18n } = useTranslation()
  const isArabic = i18n.language.toLowerCase().startsWith('ar')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(sanitizePhoneNumber(event.target.value))
  }

  return (
    <Input
      {...props}
      type="tel"
      value={value}
      onChange={handleChange}
      inputMode="numeric"
      dir="ltr"
      autoComplete={autoComplete ?? 'tel'}
      className={cn(
        '[direction:ltr]',
        isArabic ? 'text-right' : 'text-left',
        className
      )}
    />
  )
}
