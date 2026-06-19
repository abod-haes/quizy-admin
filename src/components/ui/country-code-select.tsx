import { CustomSelect } from '@/components/ui/custom-select'

const COUNTRY_CODE_OPTIONS = [
  { label: 'SY +963', value: '+963' },
  { label: 'LB +961', value: '+961' },
  { label: 'JO +962', value: '+962' },
  { label: 'PS +970', value: '+970' },
  { label: 'TR +90', value: '+90' },
  { label: 'SA +966', value: '+966' },
  { label: 'AE +971', value: '+971' },
  { label: 'EG +20', value: '+20' },
]

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
    />
  )
}
