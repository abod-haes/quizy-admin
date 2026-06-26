import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, UserRound, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { QuizyAuthLayout } from '@/modules/auth/components/quizy-auth-layout.component'
import { QuizyPhoneField } from '@/modules/auth/components/quizy-phone-field.component'
import { registerQuizy } from '@/modules/auth/services/quizy-auth.services'
import {
  DEFAULT_COUNTRY_CALLING_CODE,
  QUIZY_STUDENT_ROLE,
} from '@/modules/auth/utils/quizy-phone.utils'
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
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'كلمتا المرور غير متطابقتين',
      })
    }
  })

type RegisterFormValues = z.infer<typeof registerSchema>

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError & { message?: string }
  return apiError?.message || fallback
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
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

  const countryCallingCode = watch('countryCallingCode')

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.root.path} />
  }

  const onSubmit = async ({ confirmPassword, ...values }: RegisterFormValues) => {
    void confirmPassword
    setIsSubmitting(true)
    try {
      const response = await registerQuizy({
        ...values,
        role: QUIZY_STUDENT_ROLE,
      })

      toast.success('تم إنشاء الحساب', {
        description: response.message || 'تم إرسال رمز التحقق إلى رقم هاتفك.',
      })

      if (response.requiresVerification !== false) {
        navigate({
          pathname: APP_ROUTES.verifyCode.path,
          search: new URLSearchParams({
            flow: 'register',
            phoneNumber: response.phoneNumber || values.phoneNumber,
            countryCallingCode: values.countryCallingCode,
          }).toString(),
        })
        return
      }

      if (response.token) {
        login(response.token, [], [], {
          id: response.userId || response.phoneNumber || values.phoneNumber,
          name: `${response.firstName || values.firstName} ${response.lastName || values.lastName}`.trim(),
          email: response.email || '',
          role: response.role || null,
          profilePhotoPath: null,
          profilePhotoUrl: null,
          phoneNumber: response.phoneNumber || values.phoneNumber,
        })
        navigate(APP_ROUTES.root.path, { replace: true })
      }
    } catch (error) {
      toast.error('تعذر إنشاء الحساب', {
        description: getApiErrorMessage(error, 'راجع البيانات وحاول مرة أخرى.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <QuizyAuthLayout
      title="إنشاء حساب Quizy"
      description="أدخل بياناتك الأساسية وسيتم إرسال رمز تحقق إلى رقم الهاتف."
      footer={
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500 sm:flex-row">
          <span>لديك حساب بالفعل؟</span>
          <Link className="font-bold text-[#6949ff] hover:underline" to={APP_ROUTES.login.path}>
            تسجيل الدخول
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="auth-first-name" label="الاسم الأول">
            <Input
              id="auth-first-name"
              autoComplete="given-name"
              placeholder="الاسم الأول"
              startIcon={<UserRound className="size-4" />}
              aria-invalid={Boolean(errors.firstName)}
              {...register('firstName')}
            />
            {errors.firstName ? <p className="mt-2 text-xs font-medium text-destructive">{errors.firstName.message}</p> : null}
          </FormField>

          <FormField htmlFor="auth-last-name" label="اسم العائلة">
            <Input
              id="auth-last-name"
              autoComplete="family-name"
              placeholder="اسم العائلة"
              startIcon={<UserRound className="size-4" />}
              aria-invalid={Boolean(errors.lastName)}
              {...register('lastName')}
            />
            {errors.lastName ? <p className="mt-2 text-xs font-medium text-destructive">{errors.lastName.message}</p> : null}
          </FormField>
        </div>

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

        <FormField htmlFor="auth-password" label="كلمة المرور">
          <Input
            id="auth-password"
            type="password"
            autoComplete="new-password"
            placeholder="كلمة المرور"
            startIcon={<LockKeyhole className="size-4" />}
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? <p className="mt-2 text-xs font-medium text-destructive">{errors.password.message}</p> : null}
        </FormField>

        <FormField htmlFor="auth-confirm-password" label="تأكيد كلمة المرور">
          <Input
            id="auth-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="أعد إدخال كلمة المرور"
            startIcon={<LockKeyhole className="size-4" />}
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
          icon={<UserPlus className="size-4" />}
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white shadow-lg shadow-[#6949ff]/25 hover:bg-[#5b3df2]"
        >
          إنشاء الحساب
        </Button>
      </form>
    </QuizyAuthLayout>
  )
}
