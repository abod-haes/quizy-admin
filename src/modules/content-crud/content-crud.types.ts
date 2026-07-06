import type { PagedResponse, ResourceLink, UUID } from '@/shared/api/api.types'

export type ContentRelationOption = {
  id: UUID
  name: string
  title?: string | null
  label?: string | null
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  email?: string | null
  phoneNumber?: string | null
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
  pageType?: number | string | null
  styles?: string | null
  links?: string[] | null
  prop1?: string | null
  prop2?: string | null
  prop3?: string | null
  firstName?: string | null
  lastName?: string | null
  phoneNumber?: string | null
  countryCallingCode?: string | null
  role?: number | string | null
  userType?: number | string | null
  url?: string | null
  imageUrl?: string | null
  isImage?: boolean | null
  primaryImage?: ResourceLink | null
  primaryImageId?: UUID | null
  fileIds?: UUID[] | null
  desc?: string | null
  description?: string | null
  data?: Record<string, string> | null
  isBroadcast?: boolean | null
  isRead?: boolean | null
  sentAt?: string | null
  sentBy?: UUID | null
  targetUserIds?: UUID[] | null
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

export type ContentFieldType = 'text' | 'textarea' | 'number' | 'password' | 'select' | 'multi-select' | 'checkbox' | 'json' | 'image'

export type ContentFieldConfig = {
  name: string
  labelKey: string
  type: ContentFieldType
  placeholderKey?: string
  relationKey?: string
  options?: Array<{ value: string; labelKey?: string; label?: string }>
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
  detail?: (id: string) => string
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
  | 'managementUsers'
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
  allowEdit?: boolean
  allowDelete?: boolean
  getInitialValues: (item: AcademicContentItem) => ContentFormValues
  validate: (values: ContentFormValues) => { success: true; data: ContentFormValues } | { success: false; errors: Record<string, string> }
  toPayload: (values: ContentFormValues) => Record<string, unknown>
}

export type ContentListResponse = PagedResponse<AcademicContentItem>
