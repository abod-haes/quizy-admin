import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { resetQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { toast } from '@/shared/lib/toast'
import { Button, FormField, Input } from '@/shared/ui'

export default function ResetPasswordPage() {
  const { t } = useTranslation('login')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestId = searchParams.get('requestId')?.trim() ?? ''
  const phoneNumber = searchParams.get('phoneNumber')?.trim() ?? ''
  const countryCallingCode = searchParams.get('countryCallingCode')?.trim() ?? ''
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!requestId || !phoneNumber || !countryCallingCode) {
    return <Navigate to="/recover" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordMismatch'))
      return
    }

    setIsSubmitting(true)
    try {
      await resetQuizy({
        requestId,
        phoneNumber,
        countryCallingCode,
        otpCode,
        newPassword,
      })
      toast.success(t('reset.success'))
      navigate(APP_ROUTES.login.path, { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout
      title={t('reset.title')}
      description={t('reset.description')}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField htmlFor="code" label={t('otpCode')}>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otpCode}
            onChange={(event) =>
              setOtpCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))
            }
          />
        </FormField>

        <FormField htmlFor="new-password" label={t('newPassword')}>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </FormField>

        <FormField htmlFor="confirm-password" label={t('confirmPassword')}>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </FormField>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={
            isSubmitting ||
            otpCode.length !== 6 ||
            newPassword.length < 8 ||
            confirmPassword.length < 8
          }
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white hover:bg-[#5d3ef0]"
        >
          {t('reset.submit')}
        </Button>
      </form>
    </AuthVisualLayout>
  )
}
