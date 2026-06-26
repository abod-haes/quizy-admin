import { getCountries, getCountryCallingCode } from 'react-phone-number-input'
import arLabels from 'react-phone-number-input/locale/ar.json'

import { CustomSelect } from '@/components/ui/custom-select'

const PRIORITY_COUNTRIES = ['SY', 'LB', 'JO', 'PS', 'TR', 'SA', 'AE', 'EG']

type CountryCodeOption = {
  label: string
  value: string
}

type CountryCodeOptionWithCountry = CountryCodeOption & {
  country: string
}

const countryOptionMap = new Map<string, CountryCodeOptionWithCountry>()

getCountries().forEach((country) => {
  const callingCode = `+${getCountryCallingCode(country)}`
  const countryName = (arLabels as Record<string, string>)[country] || country

  if (!countryOptionMap.has(callingCode)) {
    countryOptionMap.set(callingCode, {
      label: `${countryName} ${callingCode}`,
      value: callingCode,
      country,
    })
  }
})

const COUNTRY_CODE_OPTIONS: CountryCodeOption[] = Array.from(countryOptionMap.values())
  .sort((first, second) => {
    const firstPriority = PRIORITY_COUNTRIES.indexOf(first.country)
    const secondPriority = PRIORITY_COUNTRIES.indexOf(second.country)

    if (firstPriority !== -1 || secondPriority !== -1) {
      return (firstPriority === -1 ? 999 : firstPriority) - (secondPriority === -1 ? 999 : secondPriority)
    }

    return first.label.localeCompare(second.label, 'ar')
  })
  .map((option) => ({ label: option.label, value: option.value }))

type CountryCodeSelectProps = {
  id?: string
  value: string
  placeholder?: string
  disabled?: boolean
  onValueChange: (value: string) => void
}

export function CountryCodeSelect({
  id,
  value,
  placeholder,
  disabled,
  onValueChange,
}: CountryCodeSelectProps) {
  return (
    <CustomSelect
      id={id}
      value={value || undefined}
      placeholder={placeholder}
      disabled={disabled}
      options={COUNTRY_CODE_OPTIONS}
      onValueChange={onValueChange}
      contentClassName="max-h-72"
    />
  )
}
