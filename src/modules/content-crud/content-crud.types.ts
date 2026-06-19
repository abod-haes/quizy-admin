import type { PagedResponse, ResourceLink, UUID } from '@/shared/api/api.types'

export type ContentRelationOption = {
  id: UUID
  name: string
  description?: string | null
  subjectId?: UUID | null
  unitId?: UUID | null
  image?: ResourceLink | null
}

export type AcademicContentItem = {
  id: UUID
  name?: string | null
  desc?: string | null
  description?: string | null
  order?: number | null
  subjectId?: UUID | null
  unitId?: UUID | null
  classIds?: UUID[] | null
  classes?: ContentRelationOption[] | null
  subjects?: ContentRelationOption[] | null
  subject?: ContentRelationOption | null
  unit?: ContentRelationOption | null
  image?: ResourceLink | null
}

export type ContentFormValue = string | number | boolean | string[] | null | undefined
export type ContentFormValues = Record<string, ContentFormValue>

export type ContentFieldType = 'text' | 'textarea' | 'number' | 'select' | 'multi-select'

export type ContentFieldConfig = {
  name: string
  labelKey: string
  type: ContentFieldType
  placeholderKey?: string
  relationKey?: string
  required?: boolean
}

export type ContentColumnConfig = {
  key: string
  labelKey: string
  relationKey?: string
  render?: (item: AcademicContentItem, context: ContentRenderContext) => string
}

export type ContentRelationConfig = {
  key: string
  endpoint: string
}

export type ContentCrudEndpoints = {
  list: string
  create: string
  update: (id: string) => string
  remove: (id: string) => string
}

export type ContentRenderContext = {
  relations: Record<string, ContentRelationOption[]>
}

export type ContentCrudConfig = {
  key: 'classes' | 'subjects' | 'units' | 'lessons'
  titleKey: string
  descriptionKey: string
  endpoints: ContentCrudEndpoints
  columns: ContentColumnConfig[]
  fields: ContentFieldConfig[]
  relations?: ContentRelationConfig[]
  emptyValues: ContentFormValues
  getInitialValues: (item: AcademicContentItem) => ContentFormValues
  validate: (values: ContentFormValues) => { success: true; data: ContentFormValues } | { success: false; errors: Record<string, string> }
  toPayload: (values: ContentFormValues) => Record<string, unknown>
}

export type ContentListResponse = PagedResponse<AcademicContentItem>
