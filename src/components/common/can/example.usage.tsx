import { ShieldCheck } from 'lucide-react'

import { useAuth } from '@/app/providers/auth.provider'
import { Can } from '@/components/common/can'
import { PERMISSIONS } from '@/constants/permissions'
import { Button, Card, CardContent } from '@/shared/ui'

export function CanUsageExample() {
  const { loginFromBackend } = useAuth()

  const simulateBackendLogin = () => {
    loginFromBackend({
      token: 'sample-jwt-token',
      user: {
        roles: ['SuperAdmin'],
        permissions: [
          'employees.manage',
          'content.manage',
          'quizzes.manage',
        ],
      },
    })
  }

  return (
    <Card className="rounded-md border border-border bg-card">
      <CardContent className="space-y-3 p-4">
        <Button type="button" variant="outline" onClick={simulateBackendLogin}>
          Load Backend Session Example
        </Button>

        <Can permission={PERMISSIONS.employees.create}>
          <Button type="button" icon={<ShieldCheck className="size-4" />}>
            Create Employee
          </Button>
        </Can>

        <Can
          role={['SuperAdmin', 'AdminEmployee']}
          fallback={<p className="text-sm text-muted-foreground">No admin access.</p>}
        >
          <p className="text-sm font-medium text-foreground">Admin section is visible.</p>
        </Can>
      </CardContent>
    </Card>
  )
}
