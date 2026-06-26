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
          'users.global.view',
          'users.global.create',
          'sidebar.analytics.view',
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

        <Can role={['SuperAdmin', 'Teacher']} fallback={<p className="text-sm text-muted-foreground">No access to finance section.</p>}>
          <p className="text-sm font-medium text-foreground">Finance section is visible for SuperAdmin/Teacher.</p>
        </Can>
      </CardContent>
    </Card>
  )
}
