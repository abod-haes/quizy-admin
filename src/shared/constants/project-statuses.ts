export const PROJECT_STATUS_VALUES = ['published', 'draft'] as const

export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number]

