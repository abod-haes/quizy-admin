export const queryKeys = {
  auth: {
    currentUser: ['auth', 'current-user'] as const,
  },
  crud: {
    list: (entity: string, filters?: unknown) => ['crud', entity, 'list', filters] as const,
    detail: (entity: string, id: string) => ['crud', entity, 'detail', id] as const,
    brief: (entity: string) => ['crud', entity, 'brief'] as const,
  },
}
