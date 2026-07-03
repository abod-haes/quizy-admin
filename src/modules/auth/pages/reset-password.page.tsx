import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/shared/lib/toast'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { resetQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { Button, FormField, Input } from '@/shared/ui'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [otpCode, setOtpCode] = useState('')
  const [newSecret, setNewSecret] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await resetQuizy({ otpCode, newPassword: newSecret })
      toast.success('Updated successfully')
      navigate(APP_ROUTES.login.path, { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout title="Set new access" description="Enter the code and choose a new value.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField htmlFor="code" label="Code"><Input id="code" inputMode="numeric" maxLength={4} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 4))} /></FormField>
        <FormField htmlFor="secret" label="New value"><Input id="secret" value={newSecret} onChange={(event) => setNewSecret(event.target.value)} /></FormField>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting || otpCode.length !== 4 || newSecret.length < 8} className="h-12 w-full rounded-2xl bg-[#6949ff] text-white">Save</Button>
      </form>
    </AuthVisualLayout>
  )
}
