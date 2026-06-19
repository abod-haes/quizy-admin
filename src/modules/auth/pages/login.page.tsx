import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { loginAdmin } from '@/modules/auth/services/login.services'
import { getPermissionsForRoles } from '@/shared/auth/quizy-permissions'
import { Button, Card, CardContent, CardHeader, CardTitle, FormField, Input } from '@/shared/ui'

export default function LoginPage() {
  const { t } = useTranslation('login')
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [countryCallingCode, setCountryCallingCode] = useState('+963')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.dashboard.path} />
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const normalizedPhoneNumber = phoneNumber.trim()
    const normalizedCountryCallingCode = countryCallingCode.trim()
    const normalizedPassword = password.trim()

    if (!normalizedPhoneNumber || !normalizedCountryCallingCode || !normalizedPassword) {
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const result = await loginAdmin({
        phoneNumber: normalizedPhoneNumber,
        countryCallingCode: normalizedCountryCallingCode,
        password: normalizedPassword,
      })

      if (!result.token || !result.isAuthenticated) {
        setErrorMessage(result.message || t('invalidCredentials'))
        return
      }

      const displayName = [result.firstName, result.lastName].filter(Boolean).join(' ').trim()
      const role = result.role === 'Teacher' || result.role === 'Student' || result.role === 'SuperAdmin'
        ? result.role
        : 'SuperAdmin'
      const roles = [role]

      login(result.token, roles, getPermissionsForRoles(roles), {
        id: result.userId,
        name: displayName || result.phoneNumber || t('unknownUser'),
        email: '',
        firstName: result.firstName ?? null,
        lastName: result.lastName ?? null,
        phoneNumber: result.phoneNumber ?? normalizedPhoneNumber,
        countryCallingCode: result.countryCallingCode ?? normalizedCountryCallingCode,
        role,
        profilePhotoPath: null,
        profilePhotoUrl: null,
      })
      navigate(APP_ROUTES.dashboard.path, { replace: true })
    } catch (error) {
      const apiError = error as ApiError
      if (apiError?.status === 401 || apiError?.status === 422 || apiError?.status === 400) {
        setErrorMessage(t('invalidCredentials'))
      } else {
        setErrorMessage(apiError?.message || t('unexpectedError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <Card className="w-full max-w-md rounded-[2rem] border border-border bg-card shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            Q
          </div>
          <CardTitle className="font-[var(--font-sans)] text-2xl font-bold">
            {t('title')}
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{t('description')}</p>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <FormField htmlFor="auth-country-code" label={t('countryCallingCode')}>
                  <Input
                    id="auth-country-code"
                    value={countryCallingCode}
                    onChange={(event) => setCountryCallingCode(event.target.value)}
                    placeholder={t('countryCallingCodePlaceholder')}
                  />
                </FormField>

                <FormField htmlFor="auth-phone" label={t('phoneNumber')}>
                  <Input
                    id="auth-phone"
                    inputMode="tel"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder={t('phoneNumberPlaceholder')}
                  />
                </FormField>
              </div>

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
              <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  !countryCallingCode.trim() || !phoneNumber.trim() || !password.trim() || isSubmitting
                }
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
