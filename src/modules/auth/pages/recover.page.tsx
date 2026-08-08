import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { CountryCodeSelect } from '@/components/ui/country-code-select'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { requestRecoverQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { DEFAULT_COUNTRY_CALLING_CODE } from '@/modules/auth/utils/quizy-auth-flow.utils'
import { toast } from '@/shared/lib/toast'
import { Button, FormField, Input } from '@/shared/ui'

export default function RecoverPage() {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCallingCode, setCountryCallingCode] = useState(DEFAULT_COUNTRY_CALLING_CODE)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await requestRecoverQuizy({ phoneNumber, countryCallingCode })
      if (!result.requestId) {
        toast.info('إذا كان الحساب موجوداً سيتم إرسال رمز الاستعادة عبر واتساب.')
        return
      }

      toast.success('تم إرسال رمز الاستعادة عبر واتساب')
      navigate({
        pathname: '/reset-password',
        search: new URLSearchParams({
          requestId: result.requestId,
          phoneNumber,
          countryCallingCode,
        }).toString(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout
      title="استعادة كلمة المرور"
      description="أدخل رقم حساب الإدارة وسنرسل رمز تحقق إلى واتساب."
      footer={
        <Link className="text-sm font-bold text-[#6949ff] hover:underline" to="/login">
          العودة لتسجيل الدخول
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3 max-[430px]:grid-cols-1">
          <FormField htmlFor="country" label="رمز الدولة">
            <CountryCodeSelect
              id="country"
              value={countryCallingCode}
              disabled={isSubmitting}
              onValueChange={setCountryCallingCode}
            />
          </FormField>
          <FormField htmlFor="phone" label="رقم الهاتف">
            <Input
              id="phone"
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              disabled={isSubmitting}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </FormField>
        </div>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || !phoneNumber.trim() || !countryCallingCode.trim()}
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white hover:bg-[#5d3ef0]"
        >
          إرسال الرمز
        </Button>
      </form>
    </AuthVisualLayout>
  )
}
