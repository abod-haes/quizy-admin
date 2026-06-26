import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Send } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { QuizyAuthLayout } from '@/modules/auth/components/quizy-auth-layout.component'
import { QuizyPhoneField } from '@/modules/auth/components/quizy-phone-field.component'
import { forgotPasswordQuizy } from '@/modules/auth/services/quizy-auth.services'
import { DEFAULT_COUNTRY_CALLING_CODE } from '@/modules/auth/utils/quizy-phone.utils'
import { Button } from '@/shared/ui'

const forgotPasswordSchema = z.object({
  phoneNumber: z.string().min(8, 'أدخل رقم هاتف صحيح'),
  countryCallingCode: z.string().min(2),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError & { message?: string }
  return apiError?.message || fallback
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phoneNumber: '',
      countryCallingCode: DEFAULT_COUNTRY_CALLING_CODE,
    },
  })

  const countryCallingCode = watch('countryCallingCode')

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await forgotPasswordQuizy({ phoneNumber: values.phoneNumber })
      toast.success('تم إرسال الرمز', {
        description: response.message || 'أدخل الرمز الذي وصلك لتعيين كلمة مرور جديدة.',
      })
      navigate({
        pathname: APP_ROUTES.resetPassword.path,
        search: new URLSearchParams({
          phoneNumber: values.phoneNumber,
          countryCallingCode: values.countryCallingCode,
        }).toString(),
      })
    } catch (error) {
      toast.error('تعذر إرسال الرمز', {
        description: getApiErrorMessage(error, 'تأكد من رقم الهاتف وحاول مرة أخرى.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <QuizyAuthLayout
      title="استعادة كلمة المرور"
      description="أدخل رقم هاتفك وسنرسل لك رمزاً لتعيين كلمة مرور جديدة."
      footer={
        <Link className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#6949ff] hover:underline" to={APP_ROUTES.login.path}>
          <ArrowRight className="size-4" />
          العودة لتسجيل الدخول
        </Link>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <QuizyPhoneField
              label="رقم الهاتف"
              phoneNumber={field.value}
              countryCallingCode={countryCallingCode}
              onPhoneNumberChange={field.onChange}
              onCountryCallingCodeChange={(value) => setValue('countryCallingCode', value, { shouldValidate: true })}
              error={errors.phoneNumber?.message}
              disabled={isSubmitting}
            />
          )}
        />

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          icon={<Send className="size-4" />}
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white shadow-lg shadow-[#6949ff]/25 hover:bg-[#5b3df2]"
        >
          إرسال رمز إعادة التعيين
        </Button>
      </form>
    </QuizyAuthLayout>
  )
}
