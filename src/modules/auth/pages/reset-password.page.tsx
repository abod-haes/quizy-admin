import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { resetQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { toast } from '@/shared/lib/toast'
import { Button, FormField, Input } from '@/shared/ui'

export default function ResetPasswordPage() {
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
      toast.error('كلمتا المرور غير متطابقتين')
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
      toast.success('تم تحديث كلمة المرور بنجاح')
      navigate(APP_ROUTES.login.path, { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout
      title="تعيين كلمة مرور جديدة"
      description="أدخل رمز واتساب المكوّن من 6 أرقام ثم اختر كلمة مرور جديدة للحساب."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField htmlFor="code" label="رمز التحقق">
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

        <FormField htmlFor="new-password" label="كلمة المرور الجديدة">
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </FormField>

        <FormField htmlFor="confirm-password" label="تأكيد كلمة المرور">
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
          حفظ كلمة المرور
        </Button>
      </form>
    </AuthVisualLayout>
  )
}
