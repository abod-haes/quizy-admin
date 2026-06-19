import { matchPath, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { APP_ROUTES } from '@/app/router/route-object.type'

type AppRouteEntry = (typeof APP_ROUTES)[keyof typeof APP_ROUTES]

const sortableRoutes = (Object.values(APP_ROUTES) as AppRouteEntry[])
  .sort((a, b) => b.path.length - a.path.length)

export function AppBreadcrumbs() {
  const { pathname } = useLocation()
  const { t } = useTranslation()

  const matchedRoute = sortableRoutes.find((route) =>
    matchPath({ path: route.path, end: true }, pathname)
  )

  const breadcrumbKeys = matchedRoute?.breadcrumbKeys ?? []

  if (breadcrumbKeys.length === 0) return null

  return (
    <p className="text-xs font-semibold text-muted-foreground">
      {breadcrumbKeys.map((key, index) => {
        const isLast = index === breadcrumbKeys.length - 1

        return (
          <span key={`${key}-${index}`}>
            {index > 0 ? (
              <span className="px-1 text-muted-primary/60">›</span>
            ) : null}
            <span className={isLast ? "text-primary" : undefined}>
              {t(key)}
            </span>
          </span>
        );
      })}
    </p>
  )
}
