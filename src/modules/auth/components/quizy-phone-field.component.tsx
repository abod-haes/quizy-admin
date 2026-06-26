import { Phone } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  COUNTRY_CALLING_CODE_OPTIONS,
  DEFAULT_COUNTRY_CALLING_CODE,
  normalizeCountryCallingCode,
  normalizePhoneNumber,
} from '@/modules/auth/utils/quizy-phone.utils'

type QuizyPhoneFieldProps = {
  label: string
  phoneNumber: string
  countryCallingCode: string
  onPhoneNumberChange: (value: string) => void
  onCountryCallingCodeChange: (value: string) => void
  error?: string
  placeholder?: string
  disabled?: boolean
}

export function QuizyPhoneField({
  label,
  phoneNumber,
  countryCallingCode,
  onPhoneNumberChange,
  onCountryCallingCodeChange,
  error,
  placeholder = '900 000 000',
  disabled,
}: QuizyPhoneFieldProps) {
  const selectedCode = normalizeCountryCallingCode(countryCallingCode || DEFAULT_COUNTRY_CALLING_CODE)

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <div
        className={cn(
          'flex items-center overflow-hidden rounded-2xl border bg-white shadow-sm transition focus-within:border-[#6949ff]/60 focus-within:ring-4 focus-within:ring-[#6949ff]/10',
          error ? 'border-destructive/60 ring-4 ring-destructive/10' : 'border-slate-200'
        )}
        dir="ltr"
      >
        <select
          value={selectedCode}
          disabled={disabled}
          onChange={(event) => onCountryCallingCodeChange(event.target.value)}
          className="h-12 min-w-32 border-0 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none disabled:opacity-60"
          aria-label="Country calling code"
        >
          {COUNTRY_CALLING_CODE_OPTIONS.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="tel"
            value={phoneNumber}
            disabled={disabled}
            inputMode="numeric"
            autoComplete="tel"
            placeholder={placeholder}
            onChange={(event) => onPhoneNumberChange(normalizePhoneNumber(event.target.value))}
            className="h-12 rounded-none border-0 bg-white pl-10 pr-3 text-left shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0"
            dir="ltr"
          />
        </div>
      </div>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
