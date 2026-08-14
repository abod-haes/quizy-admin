/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DEFAULT_LOCALE?: 'ar' | 'en'
  readonly VITE_APP_ENV?: 'local' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
