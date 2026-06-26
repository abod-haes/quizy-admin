import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { CountryCodeSelect } from '@/components/ui/country-code-select'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { requestRecoverQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { DEFAULT_COUNTRY_CALLING_CODE } from '@/modules/auth/utils/quizy-auth-flow.utils'
import { Button, FormField, Input } from '@/shared/ui'

export default function RecoverPage() {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCallingCode, setCountryCallingCode] = useState(DEFAULT_COUNTRY_CALLING_CODE)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await requestRecoverQuizy({ phoneNumber })
      toast.success('Code sent')
      navigate({ pathname: '/reset-password', search: new URLSearchParams({ phoneNumber, countryCallingCode }).toString() })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout title="Recover account" description="Enter your phone number to receive a code.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3">
          <FormField htmlFor="country" label="Code"><CountryCodeSelect id="country" value={countryCallingCode} onValueChange={setCountryCallingCode} /></FormField>
          <FormField htmlFor="phone" label="Phone"><Input id="phone" inputMode="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></FormField>
        </div>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting || !phoneNumber.trim()} className="h-12 w-full rounded-2xl bg-[#6949ff] text-white">Send code</Button>
      </form>
    </AuthVisualLayout>
  )
}
