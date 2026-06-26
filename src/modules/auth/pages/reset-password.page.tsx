import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { QuizyAuthLayout } from '@/modules/auth/components/quizy-auth-layout.component'
import { resetPasswordQuizy } from '@/modules/auth/services/quizy-auth.services'
import { getPhoneDisplay } from '@/modules/auth/utils/quizy-phone.utils'
import { Button, FormField, Input } from '@/shared/ui'

const resetPasswordSchema = z
  .object({
    otpCode: z.string().length(4, 'أدخل رمز التحقق المكون من 4 أرقام'),
    newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string().min(1, 'أكد كلمة المرور'),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword !== values.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'كلمتا المرور غير متطابقتين',
      })
    }
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError & { message?: string }
  return apiError?.message || fallback
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const phoneDisplay = getPhoneDisplay(
    searchParams.get('phoneNumber'),
    searchParams.get('countryCallingCode')
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async ({ confirmPassword, ...values }: ResetPasswordFormValues) => {
    void confirmPassword
    setIsSubmitting(true)
    try {
      const response = await resetPasswordQuizy(values)
      toast.success('تم تحديث كلمة المرور', {
        description: response.message || 'يمكنك تسجيل الدخول بكلمة المرور الجديدة الآن.',
      })
      navigate(APP_ROUTES.login.path, { replace: true })
    } catch (error) {
      toast.error('تعذر تحديث كلمة المرور', {
        description: getApiErrorMessage(error, 'تأكد من الرمز وكلمة المرور ثم حاول مرة أخرى.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <QuizyAuthLayout
      title="تعيين كلمة مرور جديدة"
      description={phoneDisplay ? `أدخل الرمز الذي وصلك على ${phoneDisplay} ثم اختر كلمة مرور جديدة.` : 'أدخل رمز التحقق ثم اختر كلمة مرور جديدة.'}
      footer={
        <Link className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#6949ff] hover:underline" to={APP_ROUTES.forgotPassword.path}>
          <ArrowRight className="size-4" />
          تعديل رقم الهاتف
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <FormField htmlFor="auth-otp-code" label="رمز التحقق">
          <Input
            id="auth-otp-code"
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            className="text-center text-lg tracking-[0.6em]"
            aria-invalid={Boolean(errors.otpCode)}
            {...register('otpCode')}
          />
          {errors.otpCode ? <p className="mt-2 text-xs font-medium text-destructive">{errors.otpCode.message}</p> : null}
        </FormField>

        <FormField htmlFor="auth-new-password" label="كلمة المرور الجديدة">
          <Input
            id="auth-new-password"
            type="password"
            autoComplete="new-password"
            placeholder="كلمة المرور الجديدة"
            aria-invalid={Boolean(errors.newPassword)}
            {...register('newPassword')}
          />
          {errors.newPassword ? <p className="mt-2 text-xs font-medium text-destructive">{errors.newPassword.message}</p> : null}
        </FormField>

        <FormField htmlFor="auth-confirm-password" label="تأكيد كلمة المرور">
          <Input
            id="auth-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="أعد إدخال كلمة المرور"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? <p className="mt-2 text-xs font-medium text-destructive">{errors.confirmPassword.message}</p> : null}
        </FormField>

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          icon={<KeyRound className="size-4" />}
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white shadow-lg shadow-[#6949ff]/25 hover:bg-[#5b3df2]"
        >
          تحديث كلمة المرور
        </Button>
      </form>
    </QuizyAuthLayout>
  )
}
