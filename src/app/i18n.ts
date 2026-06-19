import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import arCommon from '@/app/locales/ar/common.json'
import arDashboard from '@/app/locales/ar/dashboard.json'
import arLayout from '@/app/locales/ar/layout.json'
import arLogin from '@/app/locales/ar/login.json'
import arNotFound from '@/app/locales/ar/not-found.json'
import arSidebar from '@/app/locales/ar/sidebar.json'
import enCommon from '@/app/locales/en/common.json'
import enDashboard from '@/app/locales/en/dashboard.json'
import enLayout from '@/app/locales/en/layout.json'
import enLogin from '@/app/locales/en/login.json'
import enNotFound from '@/app/locales/en/not-found.json'
import enSidebar from '@/app/locales/en/sidebar.json'

type AppLanguage = 'ar' | 'en'

const LANGUAGE_STORAGE_KEY = 'app:language'
const SUPPORTED_LANGUAGES: AppLanguage[] = ['ar', 'en']

const enLocaleModules = import.meta.glob('./locales/en/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>
const arLocaleModules = import.meta.glob('./locales/ar/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>

function appendFlatKeysToNestedMap(
  target: Record<string, unknown>,
  flatMap: Record<string, string>
) {
  for (const [flatKey, value] of Object.entries(flatMap)) {
    const segments = flatKey.split('.').filter(Boolean)
    if (!segments.length) continue

    let cursor: Record<string, unknown> = target
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]
      const isLeaf = index === segments.length - 1

      if (isLeaf) {
        cursor[segment] = value
        break
      }

      const nextValue = cursor[segment]
      if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
        cursor[segment] = {}
      }

      cursor = cursor[segment] as Record<string, unknown>
    }
  }
}

const CORE_LOCALE_FILES = new Set([
  'common.json',
  'dashboard.json',
  'layout.json',
  'not-found.json',
  'sidebar.json',
  'login.json',
  'crud-generated.json',
])

function toNamespacePayload(source: Record<string, unknown>): Record<string, unknown> {
  const nested: Record<string, unknown> = {}
  let hasFlatKeys = false

  for (const [key, value] of Object.entries(source)) {
    if (key.includes('.') && typeof value === 'string') {
      appendFlatKeysToNestedMap(nested, { [key]: value })
      hasFlatKeys = true
      continue
    }

    nested[key] = value
  }

  return hasFlatKeys ? nested : source
}

function buildFeatureNamespaces(
  modules: Record<string, { default: Record<string, unknown> }>
): Record<string, Record<string, unknown>> {
  const namespaces: Record<string, Record<string, unknown>> = {}

  for (const [modulePath, moduleValue] of Object.entries(modules)) {
    const fileName = modulePath.split('/').pop() ?? ''
    if (CORE_LOCALE_FILES.has(fileName)) continue

    const namespace = fileName.replace(/\.json$/i, '').trim()
    if (!namespace) continue

    const payload = moduleValue.default
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) continue

    namespaces[namespace] = toNamespacePayload(payload)
  }

  return namespaces
}

const enFeatureNamespaces = buildFeatureNamespaces(enLocaleModules)
const arFeatureNamespaces = buildFeatureNamespaces(arLocaleModules)

const resources = {
  en: {
    translation: {
      layout: enLayout,
      common: enCommon,
      notFound: enNotFound,
      sidebar: enSidebar,
      dashboard: enDashboard,
    },
    login: enLogin,
    ...enFeatureNamespaces,
  },
  ar: {
    translation: {
      layout: arLayout,
      common: arCommon,
      notFound: arNotFound,
      sidebar: arSidebar,
      dashboard: arDashboard,
    },
    login: arLogin,
    ...arFeatureNamespaces,
  },
}

function normalizeLanguage(lng: string | null | undefined): AppLanguage | null {
  if (!lng) return null
  const shortCode = lng.toLowerCase().split('-')[0] as AppLanguage
  return SUPPORTED_LANGUAGES.includes(shortCode) ? shortCode : null
}

function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'ar'
  const storedLanguage = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
  if (storedLanguage) return storedLanguage
  return 'ar'
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  load: 'languageOnly',
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
})

const applyDocumentDirection = (lng: string) => {
  if (typeof document === 'undefined') return
  const normalizedLanguage = normalizeLanguage(lng) ?? 'en'
  const direction = i18n.dir(normalizedLanguage)

  document.documentElement.dir = direction
  document.documentElement.lang = normalizedLanguage
  document.body.dir = direction
}

const persistLanguagePreference = (lng: string) => {
  if (typeof window === 'undefined') return
  const normalizedLanguage = normalizeLanguage(lng)
  if (!normalizedLanguage) return
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage)
}

applyDocumentDirection(i18n.language)
i18n.on('languageChanged', (lng) => {
  persistLanguagePreference(lng)
  applyDocumentDirection(lng)
})

export default i18n
