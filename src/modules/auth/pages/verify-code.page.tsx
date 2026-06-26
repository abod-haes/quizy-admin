import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { normalizeAppRole } from '@/app/auth/access-control.types'
import { useAuth } from '@/app/providers/auth.provider'
import { APP_ROUTES } from '@/app/router/route-object.type'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { verifyQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { getPermissionsForRoles } from '@/shared/auth/quizy-permissions'
import { Button, Input } from '@/shared/ui'

export default function VerifyCodePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, login } = useAuth()
  const [otpCode, setOtpCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const phoneNumber = searchParams.get('phoneNumber') || ''
  const countryCallingCode = searchParams.get('countryCallingCode') || ''

  if (isAuthenticated) return <Navigate replace to={APP_ROUTES.dashboard.path} />

  const handleSubmit = async () => {
    if (otpCode.length !== 4 || !phoneNumber || !countryCallingCode) return
    setIsSubmitting(true)
    try {
      const result = await verifyQuizy({ phoneNumber, countryCallingCode, otpCode })
      const role = normalizeAppRole(result.role) || 'Student'
      const roles = [role]
      const displayName = [result.firstName, result.lastName].filter(Boolean).join(' ').trim()

      if (!result.token) {
        toast.error('Code could not be verified')
        return
      }

      login(String(result.token), roles, getPermissionsForRoles(roles), {
        id: String(result.userId || result.phoneNumber || phoneNumber),
        name: displayName || String(result.phoneNumber || phoneNumber),
        email: '',
        firstName: result.firstName ?? null,
        lastName: result.lastName ?? null,
        phoneNumber: result.phoneNumber ?? phoneNumber,
        countryCallingCode,
        role,
        profilePhotoPath: null,
        profilePhotoUrl: null,
      })
      toast.success('Account verified')
      navigate(APP_ROUTES.dashboard.path, { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout title="Confirm code" description="Enter the code sent to your phone.">
      <div className="space-y-5">
        <Input value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 4))} inputMode="numeric" maxLength={4} className="h-14 text-center text-xl tracking-[0.75em]" dir="ltr" />
        <Button type="button" loading={isSubmitting} disabled={isSubmitting || otpCode.length !== 4} onClick={handleSubmit} className="h-12 w-full rounded-2xl bg-[#6949ff] text-white">Confirm</Button>
      </div>
    </AuthVisualLayout>
  )
}
