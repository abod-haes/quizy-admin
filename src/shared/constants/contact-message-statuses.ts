export const CONTACT_MESSAGE_STATUSES = ['done'] as const

export type ContactMessageStatus = (typeof CONTACT_MESSAGE_STATUSES)[number]

export const CONTACT_MESSAGE_STATUS_OPTIONS: Array<{
  value: ContactMessageStatus
  label: string
  labelKey: string
}> = [
  { value: 'done', label: 'Done', labelKey: 'table.values.status.done' },
]
