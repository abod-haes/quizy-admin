import fs from 'node:fs'
import path from 'node:path'

export const upsertSidebarLocaleKey = (localeFile, key, value) => {
  const isArabic = /\/ar\//.test(localeFile)
  const sidebarFallback = {
    closeNavigation: isArabic ? 'إغلاق التنقل' : 'Close navigation',
    items: {},
    user: {
      guestName: isArabic ? 'مستخدم النظام' : 'System User',
      guestRole: isArabic ? 'مستخدم' : 'User',
      menuAriaLabel: isArabic ? 'فتح قائمة المستخدم' : 'Open user menu',
      profile: isArabic ? 'الملف الشخصي' : 'Profile',
      logout: isArabic ? 'تسجيل الخروج' : 'Logout',
      logoutConfirm: {
        title: isArabic ? 'تأكيد تسجيل الخروج' : 'Confirm logout',
        description: isArabic
          ? 'هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟'
          : 'Are you sure you want to log out from your account?',
        confirm: isArabic ? 'تسجيل الخروج' : 'Logout',
        confirming: isArabic ? 'جارٍ تسجيل الخروج...' : 'Logging out...',
        cancel: isArabic ? 'إلغاء' : 'Cancel',
      },
    },
  }

  if (!fs.existsSync(localeFile)) {
    fs.mkdirSync(path.dirname(localeFile), { recursive: true })
    fs.writeFileSync(localeFile, `${JSON.stringify(sidebarFallback, null, 2)}\n`)
  }

  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(localeFile, 'utf8'))
  } catch {
    return
  }

  if (!parsed || typeof parsed !== 'object') {
    return
  }

  if (!parsed.closeNavigation) {
    parsed.closeNavigation = sidebarFallback.closeNavigation
  }

  if (!parsed.user || typeof parsed.user !== 'object' || Array.isArray(parsed.user)) {
    parsed.user = sidebarFallback.user
  } else {
    parsed.user = {
      ...sidebarFallback.user,
      ...parsed.user,
      logoutConfirm: {
        ...sidebarFallback.user.logoutConfirm,
        ...(parsed.user.logoutConfirm ?? {}),
      },
    }
  }

  if (!parsed.items || typeof parsed.items !== 'object' || Array.isArray(parsed.items)) {
    parsed.items = {}
  }

  if (parsed.items[key]) {
    return
  }

  parsed.items[key] = value
  fs.writeFileSync(localeFile, `${JSON.stringify(parsed, null, 2)}\n`)
}

const parseJsonFile = (filePath, fallback) => {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, `${JSON.stringify(fallback, null, 2)}\n`)
    return fallback
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}

const setNestedKey = (target, dottedKey, value) => {
  const segments = String(dottedKey ?? '')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (!segments.length) {
    return
  }

  let cursor = target
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const isLeaf = index === segments.length - 1

    if (isLeaf) {
      if (!(segment in cursor)) {
        cursor[segment] = value
      }
      return
    }

    const nextValue = cursor[segment]
    if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
      cursor[segment] = {}
    }

    cursor = cursor[segment]
  }
}

const toHumanLabel = (dottedKey, isArabic) => {
  const last = String(dottedKey ?? '').split('.').filter(Boolean).pop() ?? ''
  const withSpaces = last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!withSpaces) {
    return isArabic ? 'قيمة' : 'Value'
  }

  if (isArabic) {
    return withSpaces
  }

  return withSpaces
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export const upsertTranslationKeysFile = ({ localeFile, keys }) => {
  const parsed = parseJsonFile(localeFile, {})
  const isArabic = /\/ar\//.test(localeFile)

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return
  }

  for (const key of keys) {
    if (!key || typeof key !== 'string') {
      continue
    }

    setNestedKey(parsed, key, toHumanLabel(key, isArabic))
  }

  fs.writeFileSync(localeFile, `${JSON.stringify(parsed, null, 2)}\n`)
}
