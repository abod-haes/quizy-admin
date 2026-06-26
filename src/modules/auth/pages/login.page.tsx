import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import type { ApiError } from '@/core/api/api-error.type'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { loginAdmin } from '@/modules/auth/services/login.services'
import { getPermissionsForRoles } from '@/shared/auth/quizy-permissions'
import { Button, FormField, Input } from '@/shared/ui'

export default function LoginPage() {
  const { t, i18n } = useTranslation('login')
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login } = useAuth()
  const [countryCallingCode, setCountryCallingCode] = useState('+963')
  const [phoneNumber, setPhoneNumber] = useState('')
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

  if (isAuthenticated) return <Navigate replace to={APP_ROUTES.dashboard.path} />

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const normalizedPhoneNumber = phoneNumber.trim()
    const normalizedCountryCallingCode = countryCallingCode.trim()
    const normalizedPassword = password.trim()
    if (!normalizedPhoneNumber || !normalizedCountryCallingCode || !normalizedPassword) return
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      const result = await loginAdmin({ phoneNumber: normalizedPhoneNumber, countryCallingCode: normalizedCountryCallingCode, password: normalizedPassword })
      if (!result.token || !result.isAuthenticated) {
        setErrorMessage(result.message || t('invalidCredentials'))
        return
      }
      const displayName = [result.firstName, result.lastName].filter(Boolean).join(' ').trim()
      const role = result.role === 'Teacher' || result.role === 'Student' || result.role === 'SuperAdmin' ? result.role : 'SuperAdmin'
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
        <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
          <Link className="font-bold text-[#6949ff] hover:underline" to="/recover">Forgot access?</Link>
          <span>New to Quizy? <Link className="font-bold text-[#6949ff] hover:underline" to="/register">Create account</Link></span>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3">
          <FormField htmlFor="auth-country-code" label={t('countryCallingCode')}>
            <CountryCodeSelect id="auth-country-code" value={countryCallingCode} placeholder={t('countryCallingCodePlaceholder')} disabled={isSubmitting} onValueChange={setCountryCallingCode} />
          </FormField>
          <FormField htmlFor="auth-phone" label={t('phoneNumber')}>
            <Input id="auth-phone" inputMode="tel" value={phoneNumber} disabled={isSubmitting} onChange={(event) => setPhoneNumber(event.target.value)} placeholder={t('phoneNumberPlaceholder')} />
          </FormField>
        </div>
        <FormField htmlFor="auth-password" label={t('password')}>
          <Input id="auth-password" type="password" value={password} disabled={isSubmitting} onChange={(event) => setPassword(event.target.value)} placeholder={t('passwordPlaceholder')} />
        </FormField>
        {errorMessage ? <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p> : null}
        <Button type="submit" disabled={!countryCallingCode.trim() || !phoneNumber.trim() || !password.trim() || isSubmitting} loading={isSubmitting} className="h-12 w-full rounded-2xl bg-[#6949ff] text-white">
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </AuthVisualLayout>
  )
}
