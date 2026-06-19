import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { loginAdmin } from '@/modules/auth/services/login.services'
import { Button, Card, CardContent, CardHeader, CardTitle, FormField, Input } from '@/shared/ui'

export default function LoginPage() {
  const { t } = useTranslation('login')
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.home.path} />
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const normalizedEmail = email.trim()
    const normalizedPassword = password.trim()
    if (!normalizedEmail || !normalizedPassword) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const result = await loginAdmin({
        email: normalizedEmail,
        password: normalizedPassword,
        device_name: 'dashboard-web',
      })

      login(result.token, [], [], {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: null,
        profilePhotoPath: null,
        profilePhotoUrl: null,
        isActive: result.user.is_active,
      })
      navigate(APP_ROUTES.home.path, { replace: true })
    } catch (error) {
      const apiError = error as ApiError
      if (apiError?.status === 422) {
        setErrorMessage(t('invalidCredentials'))
      } else {
        setErrorMessage(t('unexpectedError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-md rounded-md border border-border bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="font-[var(--font-sans)] text-2xl font-semibold">
            {t('title')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <FormField htmlFor="auth-email" label={t('email')}>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('emailPlaceholder')}
                />
              </FormField>

              <FormField htmlFor="auth-password" label={t('password')}>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('passwordPlaceholder')}
                />
              </FormField>
            </div>
            {errorMessage ? (
              <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!email.trim() || !password.trim() || isSubmitting}
              >
                {isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

