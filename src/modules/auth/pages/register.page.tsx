import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, UserPlus, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { registerQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { DEFAULT_COUNTRY_CALLING_CODE, QUIZY_STUDENT_ROLE } from '@/modules/auth/utils/quizy-auth-flow.utils'
import { Button, FormField, Input } from '@/shared/ui'

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'أدخل الاسم الأول'),
    lastName: z.string().min(2, 'أدخل اسم العائلة'),
    phoneNumber: z.string().min(8, 'أدخل رقم هاتف صحيح'),
    countryCallingCode: z.string().min(2),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string().min(1, 'أكد كلمة المرور'),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'كلمتا المرور غير متطابقتين' })
    }
  })

type RegisterFormValues = z.infer<typeof registerSchema>

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError
  return apiError?.message || fallback
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      countryCallingCode: DEFAULT_COUNTRY_CALLING_CODE,
      password: '',
      confirmPassword: '',
    },
  })

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.dashboard.path} />
  }

  const onSubmit = async ({ confirmPassword, ...values }: RegisterFormValues) => {
    void confirmPassword
    setIsSubmitting(true)
    try {
      const result = await registerQuizy({ ...values, role: QUIZY_STUDENT_ROLE })
      toast.success('تم إنشاء الحساب', {
        description: typeof result.message === 'string' ? result.message : 'تم إرسال رمز التحقق إلى رقم هاتفك.',
      })
      navigate({
        pathname: APP_ROUTES.verifyCode.path,
        search: new URLSearchParams({
          flow: 'register',
          phoneNumber: String(result.phoneNumber || values.phoneNumber),
          countryCallingCode: values.countryCallingCode,
        }).toString(),
      })
    } catch (error) {
      toast.error('تعذر إنشاء الحساب', { description: getErrorMessage(error, 'راجع البيانات وحاول مرة أخرى.') })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout
      title="إنشاء حساب جديد"
      description="أدخل بياناتك الأساسية وسيتم إرسال رمز تحقق إلى رقم الهاتف."
      footer={
        <div className="text-sm text-slate-500">
          لديك حساب بالفعل؟{' '}
          <Link className="font-bold text-[#6949ff] hover:underline" to={APP_ROUTES.login.path}>
            تسجيل الدخول
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="auth-first-name" label="الاسم الأول" error={errors.firstName?.message}>
            <Input id="auth-first-name" placeholder="الاسم الأول" startIcon={<UserRound />} {...register('firstName')} />
          </FormField>
          <FormField htmlFor="auth-last-name" label="اسم العائلة" error={errors.lastName?.message}>
            <Input id="auth-last-name" placeholder="اسم العائلة" startIcon={<UserRound />} {...register('lastName')} />
          </FormField>
        </div>

        <div className="grid grid-cols-[8.25rem_1fr] gap-3">
          <Controller
            control={control}
            name="countryCallingCode"
            render={({ field }) => (
              <FormField htmlFor="auth-country-code" label="رمز الدولة">
                <CountryCodeSelect id="auth-country-code" value={field.value} disabled={isSubmitting} onValueChange={field.onChange} />
              </FormField>
            )}
          />
          <FormField htmlFor="auth-phone" label="رقم الهاتف" error={errors.phoneNumber?.message}>
            <Input id="auth-phone" inputMode="tel" placeholder="900000000" disabled={isSubmitting} {...register('phoneNumber')} />
          </FormField>
        </div>

        <FormField htmlFor="auth-password" label="كلمة المرور" error={errors.password?.message}>
          <Input id="auth-password" type="password" placeholder="كلمة المرور" startIcon={<LockKeyhole />} {...register('password')} />
        </FormField>

        <FormField htmlFor="auth-confirm-password" label="تأكيد كلمة المرور" error={errors.confirmPassword?.message}>
          <Input id="auth-confirm-password" type="password" placeholder="أعد إدخال كلمة المرور" startIcon={<LockKeyhole />} {...register('confirmPassword')} />
        </FormField>

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          icon={<UserPlus />}
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white shadow-lg shadow-[#6949ff]/25 hover:bg-[#5b3df2]"
        >
          إنشاء الحساب
        </Button>
      </form>
    </AuthVisualLayout>
  )
}
