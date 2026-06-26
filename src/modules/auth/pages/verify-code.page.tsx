import { ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { QuizyAuthLayout } from '@/modules/auth/components/quizy-auth-layout.component'
import {
  resendPasswordOtpQuizy,
  verifyRegisterQuizy,
} from '@/modules/auth/services/quizy-auth.services'
import { getPhoneDisplay } from '@/modules/auth/utils/quizy-phone.utils'
import { Button, Input } from '@/shared/ui'

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError & { message?: string }
  return apiError?.message || fallback
}

export default function VerifyCodePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, login } = useAuth()
  const [otpCode, setOtpCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(30)

  const phoneNumber = searchParams.get('phoneNumber') || ''
  const countryCallingCode = searchParams.get('countryCallingCode') || ''
  const flow = searchParams.get('flow') || 'register'
  const phoneDisplay = useMemo(
    () => getPhoneDisplay(phoneNumber, countryCallingCode),
    [countryCallingCode, phoneNumber]
  )

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = window.setTimeout(() => {
      setResendCountdown((current) => Math.max(current - 1, 0))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [resendCountdown])

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.root.path} />
  }

  const handleVerify = async () => {
    if (otpCode.length !== 4 || !phoneNumber || !countryCallingCode) return

    setIsSubmitting(true)
    try {
      const response = await verifyRegisterQuizy({
        phoneNumber,
        countryCallingCode,
        otpCode,
      })

      if (!response.token) {
        toast.error('تعذر تفعيل الحساب', {
          description: response.message || 'لم يصل رمز الدخول من الخادم.',
        })
        return
      }

      login(response.token, [], [], {
        id: response.userId || response.phoneNumber || phoneNumber,
        name: `${response.firstName || ''} ${response.lastName || ''}`.trim() || response.phoneNumber || phoneNumber,
        email: response.email || '',
        role: response.role || null,
        profilePhotoPath: null,
        profilePhotoUrl: null,
        phoneNumber: response.phoneNumber || phoneNumber,
      })
      toast.success('تم التحقق', { description: 'تم تفعيل الحساب بنجاح.' })
      navigate(APP_ROUTES.root.path, { replace: true })
    } catch (error) {
      toast.error('رمز غير صحيح', {
        description: getApiErrorMessage(error, 'تأكد من الرمز وحاول مرة أخرى.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resendCountdown > 0 || !phoneNumber || !countryCallingCode) return

    setIsResending(true)
    try {
      await resendPasswordOtpQuizy({ phoneNumber, countryCallingCode })
      setResendCountdown(30)
      toast.success('تم الإرسال', { description: 'تم إرسال رمز جديد إلى رقم الهاتف.' })
    } catch (error) {
      toast.error('تعذر إعادة الإرسال', {
        description: getApiErrorMessage(error, 'حاول مرة أخرى بعد قليل.'),
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <QuizyAuthLayout
      title="تأكيد الرمز"
      description={phoneDisplay ? `أدخل الرمز المكون من 4 أرقام الذي تم إرساله إلى ${phoneDisplay}.` : 'أدخل رمز التحقق لتفعيل الحساب.'}
      footer={
        <Link
          className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#6949ff] hover:underline"
          to={flow === 'register' ? APP_ROUTES.register.path : APP_ROUTES.login.path}
        >
          <ArrowRight className="size-4" />
          تعديل البيانات
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2 text-center">
          <label htmlFor="auth-otp" className="text-sm font-semibold text-slate-700">
            رمز التحقق
          </label>
          <Input
            id="auth-otp"
            value={otpCode}
            onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            className="h-14 text-center text-xl tracking-[0.75em]"
            dir="ltr"
          />
        </div>

        <Button
          type="button"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting || otpCode.length !== 4}
          onClick={handleVerify}
          icon={<ShieldCheck className="size-4" />}
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white shadow-lg shadow-[#6949ff]/25 hover:bg-[#5b3df2]"
        >
          تأكيد الرمز
        </Button>

        <Button
          type="button"
          variant="outline"
          size="lg"
          loading={isResending}
          disabled={isResending || resendCountdown > 0}
          onClick={handleResend}
          icon={<RotateCcw className="size-4" />}
          className="h-12 w-full rounded-2xl"
        >
          {resendCountdown > 0 ? `إعادة الإرسال خلال ${resendCountdown}s` : 'إعادة إرسال الرمز'}
        </Button>
      </div>
    </QuizyAuthLayout>
  )
}
