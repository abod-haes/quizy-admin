import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { normalizeAppRole } from '@/app/auth/access-control.types'
import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import type { ApiError } from '@/core/api/api-error.type'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import {
  getAdminPermissions,
  loginAdmin,
} from '@/modules/auth/services/login.services'
import {
  clearAuthSession,
  setAuthRefreshToken,
  setAuthToken,
} from '@/shared/lib/auth-storage'
import { Button, FormField, Input } from '@/shared/ui'

export default function LoginPage() {
  const { t } = useTranslation('login')
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [countryCallingCode, setCountryCallingCode] = useState('+963')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate replace to={APP_ROUTES.dashboard.path} />

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const normalizedPhoneNumber = phoneNumber.trim()
    const normalizedCountryCallingCode = countryCallingCode.trim()
    const normalizedPassword = password.trim()
    if (!normalizedPhoneNumber || !normalizedCountryCallingCode || !normalizedPassword) return

    setErrorMessage(null)
    setIsSubmitting(true)
    let stagedSession = false

    try {
      const result = await loginAdmin({
        phoneNumber: normalizedPhoneNumber,
        countryCallingCode: normalizedCountryCallingCode,
        password: normalizedPassword,
      })

      const token = result.token?.trim()
      const refreshToken = result.refreshToken?.trim()
      const role = normalizeAppRole(result.role)

      if (!token || !refreshToken || !result.isAuthenticated || !role) {
        setErrorMessage(result.message || t('invalidCredentials'))
        return
      }

      setAuthToken(token)
      setAuthRefreshToken(refreshToken)
      stagedSession = true

      const sessionAccess = await getAdminPermissions()
      const displayName = [result.firstName, result.lastName].filter(Boolean).join(' ').trim()

      login(token, [role], sessionAccess.permissions, {
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
      if (stagedSession) clearAuthSession()
      const apiError = error as ApiError
      setErrorMessage(apiError?.message || t('unexpectedError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout
      title={t('title')}
      description={t('description')}
      footer={
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link className="text-sm font-bold text-[#6949ff] hover:underline" to="/recover">
            {t('forgotPassword')}
          </Link>
          <Link className="text-sm font-bold text-[#6949ff] hover:underline" to="/accept-invitation">
            {t('employeeInvitation')}
          </Link>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3 max-[430px]:grid-cols-1">
          <FormField htmlFor="auth-country-code" label={t('countryCallingCode')}>
            <CountryCodeSelect
              id="auth-country-code"
              value={countryCallingCode}
              placeholder={t('countryCallingCodePlaceholder')}
              disabled={isSubmitting}
              onValueChange={setCountryCallingCode}
            />
          </FormField>
          <FormField htmlFor="auth-phone" label={t('phoneNumber')}>
            <Input
              id="auth-phone"
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              disabled={isSubmitting}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder={t('phoneNumberPlaceholder')}
            />
          </FormField>
        </div>

        <FormField htmlFor="auth-password" label={t('password')}>
          <Input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            disabled={isSubmitting}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('passwordPlaceholder')}
          />
        </FormField>

        {errorMessage ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={
            !countryCallingCode.trim() ||
            !phoneNumber.trim() ||
            !password.trim() ||
            isSubmitting
          }
          loading={isSubmitting}
          className="h-12 w-full rounded-2xl bg-[#6949ff] text-white hover:bg-[#5d3ef0]"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </AuthVisualLayout>
  )
}
