import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { registerQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { DEFAULT_COUNTRY_CALLING_CODE, QUIZY_STUDENT_ROLE } from '@/modules/auth/utils/quizy-auth-flow.utils'
import { Button, FormField, Input } from '@/shared/ui'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCallingCode, setCountryCallingCode] = useState(DEFAULT_COUNTRY_CALLING_CODE)
  const [secret, setSecret] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate replace to={APP_ROUTES.dashboard.path} />

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await registerQuizy({
        firstName,
        lastName,
        phoneNumber,
        countryCallingCode,
        password: secret,
        role: QUIZY_STUDENT_ROLE,
      })
      toast.success('Account created')
      navigate({
        pathname: '/verify-code',
        search: new URLSearchParams({
          phoneNumber: String(result.phoneNumber || phoneNumber),
          countryCallingCode,
        }).toString(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout title="Create account" description="Enter your information to continue.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField htmlFor="firstName" label="First name"><Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></FormField>
        <FormField htmlFor="lastName" label="Last name"><Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} /></FormField>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3">
          <FormField htmlFor="country" label="Code"><CountryCodeSelect id="country" value={countryCallingCode} onValueChange={setCountryCallingCode} /></FormField>
          <FormField htmlFor="phone" label="Phone"><Input id="phone" inputMode="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></FormField>
        </div>
        <FormField htmlFor="secret" label="Secret"><Input id="secret" value={secret} onChange={(event) => setSecret(event.target.value)} /></FormField>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="h-12 w-full rounded-2xl bg-[#6949ff] text-white">Create account</Button>
        <Link className="block text-center text-sm font-bold text-[#6949ff]" to={APP_ROUTES.login.path}>Login</Link>
      </form>
    </AuthVisualLayout>
  )
}
