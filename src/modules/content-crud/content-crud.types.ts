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
  title?: string | null
  key?: string | null
  code?: string | null
  body?: string | null
  content?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  countryCallingCode?: string | null
  url?: string | null
  isImage?: boolean | null
  primaryImageId?: UUID | null
  fileIds?: UUID[] | null
  desc?: string | null
  description?: string | null
  order?: number | null
  timeExpiration?: number | null
  isFree?: boolean | null
  price?: number | null
  currency?: string | null
  subjectId?: UUID | null
  unitId?: UUID | null
  teacherId?: UUID | null
  teacherName?: string | null
  questionsCount?: number | null
  classIds?: UUID[] | null
  entityIds?: UUID[] | null
  lessonIds?: UUID[] | null
  questions?: string[] | null
  classes?: ContentRelationOption[] | null
  subjects?: ContentRelationOption[] | null
  subject?: ContentRelationOption | null
  unit?: ContentRelationOption | null
  teacher?: ContentRelationOption | null
  image?: ResourceLink | null
}

export type ContentFormValue = string | number | boolean | string[] | null | undefined
export type ContentFormValues = Record<string, ContentFormValue>

export type ContentFieldType = 'text' | 'textarea' | 'number' | 'select' | 'multi-select' | 'checkbox' | 'json'

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
  brief?: string
}

export type ContentRenderContext = {
  relations: Record<string, ContentRelationOption[]>
}

export type ContentCrudKey =
  | 'classes'
  | 'subjects'
  | 'units'
  | 'lessons'
  | 'teachers'
  | 'students'
  | 'quizzes'
  | 'questions'
  | 'courses'
  | 'resources'
  | 'ads'
  | 'pointsOfSale'
  | 'qrCodes'
  | 'notifications'
  | 'pageContents'

export type ContentCrudConfig = {
  key: ContentCrudKey
  titleKey: string
  descriptionKey: string
  endpoints: ContentCrudEndpoints
  columns: ContentColumnConfig[]
  fields: ContentFieldConfig[]
  relations?: ContentRelationConfig[]
  emptyValues: ContentFormValues
  updateMethod?: 'put' | 'patch'
  getInitialValues: (item: AcademicContentItem) => ContentFormValues
  validate: (values: ContentFormValues) => { success: true; data: ContentFormValues } | { success: false; errors: Record<string, string> }
  toPayload: (values: ContentFormValues) => Record<string, unknown>
}

export type ContentListResponse = PagedResponse<AcademicContentItem>
