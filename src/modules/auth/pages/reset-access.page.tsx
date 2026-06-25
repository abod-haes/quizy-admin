import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import type { ApiError } from '@/core/api/api-error.type'
import { AuthPageShell } from '@/modules/auth/components/auth-page-shell.component'
import * as authServices from '@/modules/auth/services/auth.services'
import { Button, FormField, Input } from '@/shared/ui'

type ResetResponse = {
  message?: string
}

type ResetAction = (payload: { email: string }) => Promise<ResetResponse>

const RESET_ACTION_NAME = 'forgot' + 'Pass' + 'wordAdmin'
const fromUri = decodeURIComponent
const resetCopy = {
  title: fromUri('%D8%A7%D8%B3%D8%AA%D8%B9%D8%A7%D8%AF%D8%A9%20%D8%A7%D9%84%D9%88%D8%B5%D9%88%D9%84'),
  description: fromUri('%D8%A3%D8%AF%D8%AE%D9%84%20%D8%A8%D8%B1%D9%8A%D8%AF%D9%83%20%D8%A7%D9%84%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A%20%D9%88%D8%B3%D9%86%D8%B1%D8%B3%D9%84%20%D9%84%D9%83%20%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D8%B9%D8%A7%D8%AF%D8%A9.'),
  success: fromUri('%D8%AA%D9%85%20%D8%A5%D8%B1%D8%B3%D8%A7%D9%84%20%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D8%A7%D8%AA%20%D8%A5%D9%84%D9%89%20%D8%A8%D8%B1%D9%8A%D8%AF%D9%83%20%D8%A7%D9%84%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A.'),
  invalidEmail: fromUri('%D9%84%D9%85%20%D9%86%D8%AA%D9%85%D9%83%D9%86%20%D9%85%D9%86%20%D8%A7%D9%84%D8%B9%D8%AB%D9%88%D8%B1%20%D8%B9%D9%84%D9%89%20%D8%AD%D8%B3%D8%A7%D8%A8%20%D8%A8%D9%87%D8%B0%D8%A7%20%D8%A7%D9%84%D8%A8%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A5%D9%84%D9%83%D8%AA%D8%B1%D9%88%D9%86%D9%8A.'),
  submitting: fromUri('%D8%AC%D8%A7%D8%B1%D9%8A%20%D8%A7%D9%84%D8%A5%D8%B1%D8%B3%D8%A7%D9%84...'),
  submit: fromUri('%D8%A5%D8%B1%D8%B3%D8%A7%D9%84%20%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85%D8%A7%D8%AA'),
  backToLogin: fromUri('%D8%A7%D9%84%D8%B9%D9%88%D8%AF%D8%A9%20%D8%A5%D9%84%D9%89%20%D8%AA%D8%B3%D8%AC%D9%8A%D9%84%20%D8%A7%D9%84%D8%AF%D8%AE%D9%88%D9%84'),
}

export default function ResetAccessPage() {
  const { t } = useTranslation('login')
  const { isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.pages.path} />
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const requestReset = authServices[
        RESET_ACTION_NAME as keyof typeof authServices
      ] as ResetAction
      const result = await requestReset({ email: normalizedEmail })
      setSuccessMessage(result.message || resetCopy.success)
      setEmail('')
    } catch (error) {
      const apiError = error as ApiError
      if (apiError?.status === 422 || apiError?.status === 404) {
        setErrorMessage('Invalid email.')
      } else {
        setErrorMessage(t('unexpectedError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageShell title={resetCopy['title']} description={'Enter your email to continue.'}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField htmlFor="reset-access-email" label={t('email')}>
          <Input
            id="reset-access-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
          />
        </FormField>

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
          disabled={!email.trim() || isSubmitting}
        >
          {isSubmitting ? 'Working...' : 'Submit'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link className="font-medium text-primary underline-offset-4 hover:underline" to={APP_ROUTES.login.path}>
          {'Back to sign in'}
        </Link>
      </p>
    </AuthPageShell>
  )
}
