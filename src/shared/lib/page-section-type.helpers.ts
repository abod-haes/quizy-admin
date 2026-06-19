import { PAGE_SECTION_TYPES, type PageSectionType } from '@/shared/constants/page-section-types'

function fallbackPageSectionTypeLabel(value: string): string {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

export function getPageSectionTypeLabel(t: TranslateFn, value: string): string {
  return t(`common.enums.pageSectionTypes.${value}`, {
    ns: 'translation',
    defaultValue: fallbackPageSectionTypeLabel(value),
  })
}

export function getPageSectionTypeOptions(t: TranslateFn): Array<{ value: PageSectionType; label: string }> {
  return PAGE_SECTION_TYPES.map((value) => ({
    value,
    label: getPageSectionTypeLabel(t, value),
  }))
}
