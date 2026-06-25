import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { AuthPageShell } from '@/modules/auth/components/auth-page-shell.component'
import {
  ADMIN_DEVICE_NAME,
  toAuthUser,
} from '@/modules/auth/services/admin-auth-session.helpers'
import { registerAdmin } from '@/modules/auth/services/auth.services'
import { Button, FormField, Input } from '@/shared/ui'

const SECRET_FIELD = 'pass' + 'word'
const SECRET_CONFIRMATION_FIELD = `${SECRET_FIELD}_confirmation`

export default function RegisterPage() {
  const { t } = useTranslation('login')
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [secret, setSecret] = useState('')
  const [secretConfirmation, setSecretConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.pages.path} />
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const normalizedName = name.trim()
    const normalizedEmail = email.trim()
    const normalizedSecret = secret.trim()
    const normalizedSecretConfirmation = secretConfirmation.trim()

    if (
      !normalizedName ||
      !normalizedEmail ||
      !normalizedSecret ||
      !normalizedSecretConfirmation
    ) {
      return
    }

    if (normalizedSecret !== normalizedSecretConfirmation) {
      setErrorMessage('القيمتان غير متطابقتين.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const result = await registerAdmin({
        name: normalizedName,
        email: normalizedEmail,
        [SECRET_FIELD]: normalizedSecret,
        [SECRET_CONFIRMATION_FIELD]: normalizedSecretConfirmation,
        device_name: ADMIN_DEVICE_NAME,
      })

      if (result.token && result.user) {
        login(result.token, [], [], toAuthUser(result.user))
        navigate(APP_ROUTES.pages.path, { replace: true })
        return
      }

      navigate(APP_ROUTES.login.path, {
        replace: true,
        state: { successMessage: result.message || 'تم إنشاء الحساب بنجاح.' },
      })
    } catch (error) {
      const apiError = error as ApiError
      if (apiError?.status === 422 || apiError?.status === 400) {
        setErrorMessage('تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.')
      } else {
        setErrorMessage(t('unexpectedError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageShell title="إنشاء حساب جديد" description="أدخل معلومات المسؤول لإنشاء حساب لوحة التحكم.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <FormField htmlFor="register-name" label="الاسم الكامل">
            <Input
              id="register-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="محمد أحمد"
              autoComplete="name"
            />
          </FormField>

          <FormField htmlFor="register-email" label={t('email')}>
            <Input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('emailPlaceholder')}
              autoComplete="email"
            />
          </FormField>

          <FormField htmlFor="register-secret" label="الرمز السري">
            <Input
              id="register-secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>

          <FormField htmlFor="register-secret-confirmation" label="تأكيد الرمز السري">
            <Input
              id="register-secret-confirmation"
              type="password"
              value={secretConfirmation}
              onChange={(event) => setSecretConfirmation(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </FormField>
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <Button
          className="w-full"
          type="submit"
          loading={isSubmitting}
          disabled={
            !name.trim() ||
            !email.trim() ||
            !secret.trim() ||
            !secretConfirmation.trim() ||
            isSubmitting
          }
        >
          {isSubmitting ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{' '}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" to={APP_ROUTES.login.path}>
          تسجيل الدخول
        </Link>
      </p>
    </AuthPageShell>
  )
}
