export function createCrudQueryKeys(resource: string) {
  const all = [resource] as const

  return {
    all,
    list: (params?: unknown) =>
      params === undefined ? ([...all, 'list'] as const) : ([...all, 'list', params] as const),
    detail: (identifier: string | number) =>
      [...all, 'detail', String(identifier)] as const,
  }
}
