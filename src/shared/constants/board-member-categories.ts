export const BOARD_MEMBER_CATEGORIES = ['founder', 'member', 'affiliate'] as const

export type BoardMemberCategory = (typeof BOARD_MEMBER_CATEGORIES)[number]

export const BOARD_MEMBER_CATEGORY_OPTIONS: Array<{
  value: BoardMemberCategory
  label: string
  labelKey: string
}> = [
  { value: 'founder', label: 'Founders', labelKey: 'table.values.category.founder' },
  { value: 'member', label: 'Members', labelKey: 'table.values.category.member' },
  { value: 'affiliate', label: 'Affiliates', labelKey: 'table.values.category.affiliate' },
]
