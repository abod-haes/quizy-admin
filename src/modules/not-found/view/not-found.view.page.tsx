import { NotFoundActionsComponent } from '@/modules/not-found/components/not-found-actions.component'
import { useNotFoundHook } from '@/modules/not-found/hooks/not-found.hook'
import { Alert, AlertDescription, AlertTitle, Card, CardContent } from '@/shared/ui'

export function NotFoundViewPage() {
  const model = useNotFoundHook()

  return (
    <main className="mx-auto w-full space-y-6 p-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="text-3xl font-semibold">{model.title}</h1>
          <Alert>
            <AlertTitle>Invalid route</AlertTitle>
            <AlertDescription>{model.description}</AlertDescription>
          </Alert>
          <NotFoundActionsComponent />
        </CardContent>
      </Card>
    </main>
  )
}

