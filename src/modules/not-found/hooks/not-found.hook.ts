import { useLocation } from 'react-router-dom'

import { buildNotFoundViewModel } from '@/modules/not-found/services/not-found.services'

export function useNotFoundHook() {
  const location = useLocation()

  return buildNotFoundViewModel(location.pathname)
}
