import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import type { ApiError } from '@/core/api/api-error.type'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { normalizeCountryCallingCode, trimCountryCode } from '@/modules/auth/utils/quizy-auth-flow.utils'
import { api } from '@/shared/api/api-client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { Button, FormField, Input } from '@/shared/ui'

export default function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [countryCallingCode, setCountryCallingCode] = useState('+963')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمتا المرور غير متطابقتين.')
      return
    }

    const countryCode = normalizeCountryCallingCode(countryCallingCode)
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await api.post(API_ENDPOINTS.auth.invitationVerify, {
        phoneNumber: trimCountryCode(phoneNumber, countryCode),
        countryCallingCode: countryCode,
        otpCode,
        newPassword,
      })
      navigate(APP_ROUTES.login.path, {
        replace: true,
        state: { invitationActivated: true },
      })
    } catch (error) {
      setErrorMessage((error as ApiError)?.message || 'تعذر تفعيل الدعوة. تحقق من الرمز وحاول مجدداً.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout
      title="تفعيل حساب الموظف"
      description="استخدم رقم الهاتف الذي أضيف به حسابك ورمز واتساب، ثم اختر كلمة مرور خاصة بك."
      footer={
        <Link className="text-sm font-bold text-[#6949ff] hover:underline" to={APP_ROUTES.login.path}>
          العودة لتسجيل الدخول
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3 max-[430px]:grid-cols-1">
          <FormField htmlFor="invite-country" label="رمز الدولة">
            <CountryCodeSelect
              id="invite-country"
              value={countryCallingCode}
              disabled={isSubmitting}
              onValueChange={setCountryCallingCode}
            />
          </FormField>
          <FormField htmlFor="invite-phone" label="رقم الهاتف">
            <Input
              id="invite-phone"
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              disabled={isSubmitting}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </FormField>
        </div>

        <FormField htmlFor="invite-code" label="رمز واتساب">
          <Input
            id="invite-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otpCode}
            disabled={isSubmitting}
            onChange={(event) =>
              setOtpCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))
            }
          />
        </FormField>

        <FormField htmlFor="invite-password" label="كلمة المرور الجديدة">
          <Input
            id="invite-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            disabled={isSubmitting}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </FormField>

        <FormField htmlFor="invite-confirm-password" label="تأكيد كلمة المرور">
          <Input
            id="invite-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            disabled={isSubmitting}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </FormField>

        {errorMessage ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={
            isSubmitting ||
            !phoneNumber.trim() ||
            otpCode.length !== 6 ||
            newPassword.length < 8 ||
            confirmPassword.length < 8
          }
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white hover:bg-[#5d3ef0]"
        >
          تفعيل الحساب
        </Button>
      </form>
    </AuthVisualLayout>
  )
}
