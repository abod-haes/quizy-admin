import type { NotFoundViewModel } from '@/modules/not-found/types/not-found.type'

export function buildNotFoundViewModel(path: string): NotFoundViewModel {
  return {
    title: 'Page not found',
    description: `No route matched: ${path}`,
    path,
  }
}
