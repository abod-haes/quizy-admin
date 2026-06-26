import type { ZodType } from 'zod'

import type { AppRole } from '@/app/auth/access-control.types'
import type { AppPermission } from '@/constants/permissions'

export type CrudColumn<TList> = {
  key: keyof TList | string
  labelKey: string
  sortable?: boolean
  width?: string
}

export type CrudFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'file'
  | 'resource'

export type CrudField<TForm> = {
  name: keyof TForm | string
  labelKey: string
  type: CrudFieldType
  placeholderKey?: string
  required?: boolean
  relationKey?: string
  options?: Array<{ labelKey: string; value: string | number | boolean }>
}

export type CrudRelation = {
  key: string
  endpoint: string
  valueKey?: string
  labelKey?: string
  searchParam?: string
}

export type CrudPermissionConfig = {
  roles?: readonly AppRole[]
  permissions?: readonly AppPermission[]
  requireAllPermissions?: boolean
}

export type CrudEndpointConfig = {
  list: string
  brief?: string
  detail?: (id: string) => string
  create?: string
  update?: (id: string) => string
  remove?: (id: string) => string
}

export type CrudEntityConfig<
  TList,
  TDetails,
  TCreate,
  TUpdate,
  TFilters = Record<string, unknown>
> = {
  key: string
  titleKey: string
  routeBase: string
  endpoints: CrudEndpointConfig
  columns: Array<CrudColumn<TList>>
  filters?: Array<CrudField<TFilters>>
  relations?: CrudRelation[]
  form?: {
    createSchema: ZodType<TCreate>
    updateSchema: ZodType<TUpdate>
    fields: Array<CrudField<TCreate & TUpdate>>
  }
  permissions?: {
    list?: CrudPermissionConfig
    details?: CrudPermissionConfig
    create?: CrudPermissionConfig
    update?: CrudPermissionConfig
    delete?: CrudPermissionConfig
  }
}
