import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { APP_ROUTES } from '@/app/router/route-object.type'
import { CountryCodeSelect } from '@/components/ui/country-code-select'
import { AuthVisualLayout } from '@/modules/auth/components/auth-visual-layout.component'
import { requestAccountResetQuizy } from '@/modules/auth/services/quizy-auth-flow.services'
import { DEFAULT_COUNTRY_CALLING_CODE } from '@/modules/auth/utils/quizy-auth-flow.utils'
import { Button, FormField, Input } from '@/shared/ui'

const schema = z.object({
  phoneNumber: z.string().min(8, 'Phone number is required'),
  countryCallingCode: z.string().min(2),
})

type FormValues = z.infer<typeof schema>

export default function RequestCodePage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { control, register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: '', countryCallingCode: DEFAULT_COUNTRY_CALLING_CODE },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      await requestAccountResetQuizy({ phoneNumber: values.phoneNumber })
      toast.success('Code sent')
      navigate({ pathname: APP_ROUTES.resetPassword.path, search: new URLSearchParams(values).toString() })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthVisualLayout title="Request code" description="Enter your phone number to continue.">
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-[8.25rem_1fr] gap-3">
          <Controller
            control={control}
            name="countryCallingCode"
            render={({ field }) => (
              <FormField htmlFor="auth-country-code" label="Code">
                <CountryCodeSelect id="auth-country-code" value={field.value} disabled={isSubmitting} onValueChange={field.onChange} />
              </FormField>
            )}
          />
          <FormField htmlFor="auth-phone" label="Phone" error={errors.phoneNumber?.message}>
            <Input id="auth-phone" inputMode="tel" disabled={isSubmitting} {...register('phoneNumber')} />
          </FormField>
        </div>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting} icon={<Send />} className="h-12 w-full rounded-2xl bg-[#6949ff] text-white">
          Send code
        </Button>
      </form>
    </AuthVisualLayout>
  )
}
