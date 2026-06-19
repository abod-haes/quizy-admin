export const APP_LABELS = {

  PENDING: 'Pending',
} as const

export type AppLabel = (typeof APP_LABELS)[keyof typeof APP_LABELS]

export const APP_LABEL_VALUES: AppLabel[] = Object.values(APP_LABELS)
