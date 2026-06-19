import path from 'node:path'

export const COLLECTION_FILE = path.join(process.cwd(), 'postman.json')
export const API_ENDPOINTS_FILE = path.join(process.cwd(), 'src', 'shared', 'constants', 'api-endpoints.ts')
export const CRUD_RELATIONS_MAP_FILE = path.join(
  process.cwd(),
  'src',
  'shared',
  'constants',
  'crud-relations-map.ts'
)
export const ROUTES_FILE = path.join(process.cwd(), 'src', 'app', 'router', 'route-object.type.ts')
export const APP_ROUTE_FILE = path.join(process.cwd(), 'src', 'app', 'router', 'app.route.ts')
export const PERMISSIONS_FILE = path.join(process.cwd(), 'src', 'constants', 'permissions.ts')
export const SIDEBAR_DATA_FILE = path.join(
  process.cwd(),
  'src',
  'app',
  'layout',
  'sidebar',
  'sidebar.data.ts'
)
export const SIDEBAR_LOCALE_EN_FILE = path.join(
  process.cwd(),
  'src',
  'app',
  'locales',
  'en',
  'sidebar.json'
)
export const SIDEBAR_LOCALE_AR_FILE = path.join(
  process.cwd(),
  'src',
  'app',
  'locales',
  'ar',
  'sidebar.json'
)
export const CRUD_LOCALE_EN_DIR = path.join(process.cwd(), 'src', 'app', 'locales', 'en')
export const CRUD_LOCALE_AR_DIR = path.join(process.cwd(), 'src', 'app', 'locales', 'ar')
