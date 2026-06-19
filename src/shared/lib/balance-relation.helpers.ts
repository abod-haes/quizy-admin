import type { TFunction } from 'i18next'

export type BalanceRelationTranslationKey = 'iOweThem' | 'theyOweMe'

function getBalanceRelationTranslationKey(
  balanceRelation: string
): BalanceRelationTranslationKey | null {
  const normalizedRelation = balanceRelation.trim().toLowerCase()

  if (!normalizedRelation) {
    return null
  }

  if (
    (normalizedRelation.includes('owe') && normalizedRelation.includes('them')) ||
    normalizedRelation.includes('payable')
  ) {
    return 'iOweThem'
  }

  if (
    (normalizedRelation.includes('owe') &&
      (normalizedRelation.includes('me') || normalizedRelation.includes('us'))) ||
    normalizedRelation.includes('receivable')
  ) {
    return 'theyOweMe'
  }

  return null
}

export function getLocalizedBalanceRelation(
  t: TFunction,
  balanceRelation: string,
  translationKeyPrefix: string
): string {
  const normalizedRelation = balanceRelation.trim()

  if (!normalizedRelation) {
    return '-'
  }

  const relationKey = getBalanceRelationTranslationKey(normalizedRelation)

  if (!relationKey) {
    return normalizedRelation
  }

  const translationKey = `${translationKeyPrefix}.${relationKey}`
  const translatedValue = t(translationKey)

  if (!translatedValue || translatedValue === translationKey) {
    return normalizedRelation
  }

  return translatedValue
}
