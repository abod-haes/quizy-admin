export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() ?? '',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE?.trim() ?? 'ar',
  appEnv: import.meta.env.VITE_APP_ENV?.trim() ?? 'local',
} as const
