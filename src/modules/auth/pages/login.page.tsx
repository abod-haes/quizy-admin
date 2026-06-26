import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, LogIn } from 'lucide-react'
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
import { loginQuizy } from '@/modules/auth/services/quizy-auth.services'
import { DEFAULT_COUNTRY_CALLING_CODE } from '@/modules/auth/utils/quizy-phone.utils'
import { Button, FormField, Input } from '@/shared/ui'

const loginSchema = z.object({
  phoneNumber: z.string().min(8, 'أدخل رقم هاتف صحيح'),
  countryCallingCode: z.string().min(2),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError & { message?: string }
  return apiError?.message || fallback
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: '',
      countryCallingCode: DEFAULT_COUNTRY_CALLING_CODE,
      password: '',
    },
  })

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.root.path} />
  }

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await loginQuizy(values)

      if (response.requiresVerification) {
        navigate({
          pathname: APP_ROUTES.verifyCode.path,
          search: new URLSearchParams({
            flow: 'login',
            phoneNumber: values.phoneNumber,
            countryCallingCode: values.countryCallingCode,
          }).toString(),
        })
        return
      }

      if (!response.token) {
        toast.error('تعذر تسجيل الدخول', {
          description: response.message || 'لم يصل رمز الدخول من الخادم.',
        })
        return
      }

      login(response.token, [], [], {
        id: response.userId || response.phoneNumber || values.phoneNumber,
        name: `${response.firstName || ''} ${response.lastName || ''}`.trim() || response.phoneNumber || values.phoneNumber,
        email: response.email || '',
        role: response.role || null,
        profilePhotoPath: null,
        profilePhotoUrl: null,
        phoneNumber: response.phoneNumber || values.phoneNumber,
        firstName: response.firstName,
        lastName: response.lastName,
      })
      toast.success('تم تسجيل الدخول', { description: 'مرحباً بعودتك إلى لوحة Quizy' })
      navigate(APP_ROUTES.root.path, { replace: true })
    } catch (error) {
      toast.error('فشل تسجيل الدخول', {
        description: getApiErrorMessage(error, 'تأكد من رقم الهاتف وكلمة المرور ثم حاول مرة أخرى.'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <QuizyAuthLayout
      title="مرحباً بك في Quizy"
      description="سجل دخولك برقم الهاتف للوصول إلى لوحة إدارة المحتوى التعليمي."
      footer={
        <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500 sm:flex-row">
          <span>ليس لديك حساب؟</span>
          <Link className="font-bold text-[#6949ff] hover:underline" to={APP_ROUTES.register.path}>
            إنشاء حساب جديد
          </Link>
        </div>
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
              countryCallingCode={control._formValues.countryCallingCode}
              onPhoneNumberChange={field.onChange}
              onCountryCallingCodeChange={(value) => control._formValues.countryCallingCode = value}
              error={errors.phoneNumber?.message}
              disabled={isSubmitting}
            />
          )}
        />

        <FormField htmlFor="auth-password" label="كلمة المرور">
          <Input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            placeholder="أدخل كلمة المرور"
            startIcon={<LockKeyhole className="size-4" />}
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? <p className="mt-2 text-xs font-medium text-destructive">{errors.password.message}</p> : null}
        </FormField>

        <div className="flex justify-start">
          <Link className="text-sm font-semibold text-[#6949ff] hover:underline" to={APP_ROUTES.forgotPassword.path}>
            نسيت كلمة المرور؟
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          icon={<LogIn className="size-4" />}
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white shadow-lg shadow-[#6949ff]/25 hover:bg-[#5b3df2]"
        >
          تسجيل الدخول
        </Button>
      </form>
    </QuizyAuthLayout>
  )
}
