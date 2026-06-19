import type { TFunction } from 'i18next'

import { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'
import { SORT_NONE_VALUE } from '@/shared/constants/sort-options'

export function buildSortSelectOptions(
  t: TFunction,
  allowedSorts: readonly string[]
): { value: string; label: string }[] {
  const noneLabel = t('common.table.sortNone', { ns: 'translation', defaultValue: 'No sorting' })

  const toLabel = (raw: string) => {
    const isDesc = raw.startsWith('-')
    const field = isDesc ? raw.slice(1) : raw
    const fieldLabel = t(`common.table.sortFields.${field}`, {
      ns: 'translation',
      defaultValue: formatUiDisplayValue(field),
    })
    const dirArrow = isDesc ? '↓' : '↑'

    return `${fieldLabel} ${dirArrow}`
  }

  return [
    { value: SORT_NONE_VALUE, label: noneLabel },
    ...allowedSorts.map((value) => ({ value, label: toLabel(value) })),
  ]
}
