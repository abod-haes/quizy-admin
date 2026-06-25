import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { AuthPageShell } from '@/modules/auth/components/auth-page-shell.component'
import {
  ADMIN_DEVICE_NAME,
  toAuthUser,
} from '@/modules/auth/services/admin-auth-session.helpers'
import { loginAdmin } from '@/modules/auth/services/login.services'
import { Button, FormField, Input } from '@/shared/ui'

type AuthRouteState = {
  successMessage?: string
}

export default function LoginPage() {
  const { t, i18n } = useTranslation('login')
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(() => {
    const state = location.state as AuthRouteState | null
    return state?.successMessage ?? null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isArabic = i18n.language.startsWith('ar')
  const authCopy = {
    resetLink: isArabic ? 'استعادة الوصول' : 'Reset access',
    registerPrompt: isArabic ? 'ليس لديك حساب؟' : "Need an account?",
    registerLinkText: isArabic ? 'إنشاء حساب جديد' : 'Create an account',
  }
  const tr = (key: string, fallback: string) => t(key, { defaultValue: fallback })

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.pages.path} />
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const normalizedEmail = email.trim()
    const normalizedPassword = password.trim()
    if (!normalizedEmail || !normalizedPassword) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const result = await loginAdmin({
        email: normalizedEmail,
        password: normalizedPassword,
        device_name: ADMIN_DEVICE_NAME,
      })

      login(result.token, [], [], toAuthUser(result.user))
      navigate(APP_ROUTES.pages.path, { replace: true })
    } catch (error) {
      const apiError = error as ApiError
      if (apiError?.status === 422 || apiError?.status === 401) {
        setErrorMessage(t('invalidCredentials'))
      } else {
        setErrorMessage(t('unexpectedError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageShell title={t('title')} description={t('description')}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <FormField htmlFor="auth-email" label={t('email')}>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('emailPlaceholder')}
              autoComplete="email"
            />
          </FormField>

          <FormField htmlFor="auth-password" label={t('password')}>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('passwordPlaceholder')}
              autoComplete="current-password"
            />
          </FormField>
        </div>

        <div className="flex justify-end text-sm">
          <Link className="text-primary underline-offset-4 hover:underline" to={APP_ROUTES.forgotPassword.path}>
            {tr('forgotPasswordLink', authCopy.resetLink)}
          </Link>
        </div>

        {successMessage ? (
          <p className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <Button
          className="w-full"
          type="submit"
          loading={isSubmitting}
          disabled={!email.trim() || !password.trim() || isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {tr('registerPrompt', authCopy.registerPrompt)}{' '}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" to={APP_ROUTES.register.path}>
          {tr('registerLink', authCopy.registerLinkText)}
        </Link>
      </p>
    </AuthPageShell>
  )
}
