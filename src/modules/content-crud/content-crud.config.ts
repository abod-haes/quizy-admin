import { z } from 'zod'

import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { arrayOfUuid, nonNegativeInt, optionalString, requiredString, uuidField } from '@/shared/validation/primitives'
import type { AcademicContentItem, ContentCrudConfig, ContentFormValues, ContentRelationOption } from '@/modules/content-crud/content-crud.types'

const toStringValue = (value: unknown) => (typeof value === 'string' ? value : '')
const toNumberValue = (value: unknown) => (typeof value === 'number' ? value : 0)
const toStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
const toBooleanValue = (value: unknown) => value === true

function toValidationResult<T extends Record<string, unknown>>(
  result: z.SafeParseReturnType<unknown, T>
): { success: true; data: ContentFormValues } | { success: false; errors: Record<string, string> } {
  if (result.success) return { success: true, data: result.data }
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !errors[field]) errors[field] = issue.message
  }
  return { success: false, errors }
}

const classSchema = z.object({ name: requiredString('validation.required') })
const subjectSchema = z.object({ name: requiredString('validation.required'), classIds: arrayOfUuid().optional().default([]) })
const unitSchema = z.object({ name: requiredString('validation.required'), desc: optionalString(), subjectId: uuidField('validation.required') })
const lessonSchema = z.object({ name: requiredString('validation.required'), desc: optionalString(), unitId: uuidField('validation.required'), order: nonNegativeInt('validation.nonNegativeInt') })
const teacherSchema = z.object({ firstName: requiredString('validation.required'), lastName: optionalString(), phoneNumber: optionalString(), countryCallingCode: optionalString(), description: optionalString() })
const studentSchema = z.object({ firstName: requiredString('validation.required'), lastName: optionalString(), phoneNumber: optionalString(), countryCallingCode: optionalString() })
const courseSchema = z.object({
  subjectId: uuidField('validation.required'),
  teacherId: uuidField('validation.required'),
  title: requiredString('validation.required'),
  description: optionalString(),
  isFree: z.boolean().optional().default(false),
  price: z.coerce.number().min(0, 'validation.nonNegativeInt').optional().default(0),
  currency: optionalString(),
})

function subjectClassIds(item: AcademicContentItem): string[] {
  if (Array.isArray(item.classIds)) return toStringArray(item.classIds)
  if (Array.isArray(item.classes)) return item.classes.map((classItem) => classItem.id).filter(Boolean)
  return []
}

function relationName(id: string | null | undefined, options: ContentRelationOption[]): string {
  if (!id) return '-'
  return options.find((option) => option.id === id)?.name ?? '-'
}

function relationNames(ids: string[], options: ContentRelationOption[]): string {
  const names = ids
    .map((id) => options.find((option) => option.id === id)?.name)
    .filter((name): name is string => Boolean(name && name.trim()))

  return names.length > 0 ? names.join('، ') : '-'
}

function quizTeacherName(item: AcademicContentItem, teachers: ContentRelationOption[]): string {
  if (item.teacherName?.trim()) return item.teacherName
  const teacherObjectName = item.teacher?.name
  if (teacherObjectName?.trim()) return teacherObjectName
  return relationName(item.teacherId ?? item.teacher?.id, teachers)
}

function quizQuestionsCount(item: AcademicContentItem): string {
  if (typeof item.questionsCount === 'number') return String(item.questionsCount)
  if (Array.isArray(item.questions)) return String(item.questions.length)
  return '-'
}

const resourceEndpoints = {
  list: API_ENDPOINTS.resources.list,
  create: API_ENDPOINTS.resources.upload,
  update: API_ENDPOINTS.resources.detail,
  remove: API_ENDPOINTS.resources['remove'],
}

export const academicContentConfigs: Record<ContentCrudConfig['key'], ContentCrudConfig> = {
  classes: {
    key: 'classes', titleKey: 'modules.classes.title', descriptionKey: 'modules.classes.description', endpoints: API_ENDPOINTS.classes,
    columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'subjects', labelKey: 'fields.subjects', render: (item) => String(Array.isArray(item.subjects) ? item.subjects.length : '-') }],
    fields: [{ name: 'name', labelKey: 'fields.name', type: 'text', required: true }], emptyValues: { name: '' }, getInitialValues: (item) => ({ name: toStringValue(item.name) }), validate: (values) => toValidationResult(classSchema.safeParse(values)), toPayload: (values) => ({ name: values.name }),
  },
  subjects: {
    key: 'subjects', titleKey: 'modules.subjects.title', descriptionKey: 'modules.subjects.description', endpoints: API_ENDPOINTS.subjects, relations: [{ key: 'classes', endpoint: API_ENDPOINTS.classes.brief }],
    columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'classIds', labelKey: 'fields.classes', render: (item, context) => relationNames(subjectClassIds(item), context.relations.classes ?? []) }],
    fields: [{ name: 'name', labelKey: 'fields.name', type: 'text', required: true }, { name: 'classIds', labelKey: 'fields.classes', type: 'multi-select', relationKey: 'classes' }], emptyValues: { name: '', classIds: [] }, getInitialValues: (item) => ({ name: toStringValue(item.name), classIds: subjectClassIds(item) }), validate: (values) => toValidationResult(subjectSchema.safeParse(values)), toPayload: (values) => ({ name: values.name, classIds: toStringArray(values.classIds) }),
  },
  units: {
    key: 'units', titleKey: 'modules.units.title', descriptionKey: 'modules.units.description', endpoints: API_ENDPOINTS.units, relations: [{ key: 'subjects', endpoint: API_ENDPOINTS.subjects.brief }],
    columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'description', labelKey: 'fields.description' }, { key: 'subjectId', labelKey: 'fields.subject', render: (item, context) => relationName(item.subjectId ?? item.subject?.id, context.relations.subjects ?? []) }],
    fields: [{ name: 'name', labelKey: 'fields.name', type: 'text', required: true }, { name: 'desc', labelKey: 'fields.description', type: 'textarea' }, { name: 'subjectId', labelKey: 'fields.subject', type: 'select', relationKey: 'subjects', required: true }], emptyValues: { name: '', desc: '', subjectId: '' }, getInitialValues: (item) => ({ name: toStringValue(item.name), desc: toStringValue(item.desc ?? item.description), subjectId: toStringValue(item.subjectId ?? item.subject?.id) }), validate: (values) => toValidationResult(unitSchema.safeParse(values)), toPayload: (values) => ({ name: values.name, desc: values.desc, subjectId: values.subjectId }),
  },
  lessons: {
    key: 'lessons', titleKey: 'modules.lessons.title', descriptionKey: 'modules.lessons.description', endpoints: API_ENDPOINTS.lessons, relations: [{ key: 'units', endpoint: API_ENDPOINTS.units.brief }],
    columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'description', labelKey: 'fields.description' }, { key: 'unitId', labelKey: 'fields.unit', render: (item, context) => relationName(item.unitId ?? item.unit?.id, context.relations.units ?? []) }, { key: 'order', labelKey: 'fields.order' }],
    fields: [{ name: 'name', labelKey: 'fields.name', type: 'text', required: true }, { name: 'desc', labelKey: 'fields.description', type: 'textarea' }, { name: 'unitId', labelKey: 'fields.unit', type: 'select', relationKey: 'units', required: true }, { name: 'order', labelKey: 'fields.order', type: 'number' }], emptyValues: { name: '', desc: '', unitId: '', order: 0 }, getInitialValues: (item) => ({ name: toStringValue(item.name), desc: toStringValue(item.desc ?? item.description), unitId: toStringValue(item.unitId ?? item.unit?.id), order: toNumberValue(item.order) }), validate: (values) => toValidationResult(lessonSchema.safeParse(values)), toPayload: (values) => ({ name: values.name, desc: values.desc, unitId: values.unitId, order: Number(values.order ?? 0) }),
  },
  teachers: {
    key: 'teachers', titleKey: 'modules.teachers.title', descriptionKey: 'modules.teachers.description', endpoints: API_ENDPOINTS.teachers,
    columns: [{ key: 'firstName', labelKey: 'fields.firstName' }, { key: 'lastName', labelKey: 'fields.lastName' }, { key: 'phoneNumber', labelKey: 'fields.phoneNumber' }, { key: 'description', labelKey: 'fields.description' }],
    fields: [{ name: 'firstName', labelKey: 'fields.firstName', type: 'text', required: true }, { name: 'lastName', labelKey: 'fields.lastName', type: 'text' }, { name: 'phoneNumber', labelKey: 'fields.phoneNumber', type: 'text' }, { name: 'countryCallingCode', labelKey: 'fields.countryCallingCode', type: 'text' }, { name: 'description', labelKey: 'fields.description', type: 'textarea' }], emptyValues: { firstName: '', lastName: '', phoneNumber: '', countryCallingCode: '+963', description: '' }, getInitialValues: (item) => ({ firstName: toStringValue(item.firstName), lastName: toStringValue(item.lastName), phoneNumber: toStringValue(item.phoneNumber), countryCallingCode: toStringValue(item.countryCallingCode), description: toStringValue(item.description) }), validate: (values) => toValidationResult(teacherSchema.safeParse(values)), toPayload: (values) => ({ firstName: values.firstName, lastName: values.lastName, phoneNumber: values.phoneNumber, countryCallingCode: values.countryCallingCode, description: values.description }),
  },
  students: {
    key: 'students', titleKey: 'modules.students.title', descriptionKey: 'modules.students.description', endpoints: API_ENDPOINTS.students,
    columns: [{ key: 'firstName', labelKey: 'fields.firstName' }, { key: 'lastName', labelKey: 'fields.lastName' }, { key: 'phoneNumber', labelKey: 'fields.phoneNumber' }],
    fields: [{ name: 'firstName', labelKey: 'fields.firstName', type: 'text', required: true }, { name: 'lastName', labelKey: 'fields.lastName', type: 'text' }, { name: 'phoneNumber', labelKey: 'fields.phoneNumber', type: 'text' }, { name: 'countryCallingCode', labelKey: 'fields.countryCallingCode', type: 'text' }], emptyValues: { firstName: '', lastName: '', phoneNumber: '', countryCallingCode: '+963' }, getInitialValues: (item) => ({ firstName: toStringValue(item.firstName), lastName: toStringValue(item.lastName), phoneNumber: toStringValue(item.phoneNumber), countryCallingCode: toStringValue(item.countryCallingCode) }), validate: (values) => toValidationResult(studentSchema.safeParse(values)), toPayload: (values) => ({ firstName: values.firstName, lastName: values.lastName, phoneNumber: values.phoneNumber, countryCallingCode: values.countryCallingCode }),
  },
  quizzes: {
    key: 'quizzes', titleKey: 'modules.quizzes.title', descriptionKey: 'modules.quizzes.description', endpoints: API_ENDPOINTS.quizzes, relations: [{ key: 'teachers', endpoint: API_ENDPOINTS.teachers.brief }],
    columns: [{ key: 'title', labelKey: 'fields.title' }, { key: 'teacherName', labelKey: 'fields.teacherName', render: (item, context) => quizTeacherName(item, context.relations.teachers ?? []) }, { key: 'questionsCount', labelKey: 'fields.questionsCount', render: (item) => quizQuestionsCount(item) }, { key: 'isFree', labelKey: 'fields.isFree' }],
    fields: [], emptyValues: {}, getInitialValues: () => ({}), validate: (values) => ({ success: true, data: values }), toPayload: (values) => values,
  },
  questions: { key: 'questions', titleKey: 'modules.questions.title', descriptionKey: 'modules.questions.description', endpoints: API_ENDPOINTS.questions, columns: [{ key: 'title', labelKey: 'fields.title' }, { key: 'hint', labelKey: 'fields.hint' }], fields: [], emptyValues: {}, getInitialValues: () => ({}), validate: (values) => ({ success: true, data: values }), toPayload: (values) => values },
  courses: {
    key: 'courses', titleKey: 'modules.courses.title', descriptionKey: 'modules.courses.description', endpoints: API_ENDPOINTS.courses, updateMethod: 'patch', relations: [{ key: 'subjects', endpoint: API_ENDPOINTS.subjects.brief }, { key: 'teachers', endpoint: API_ENDPOINTS.teachers.brief }],
    columns: [{ key: 'title', labelKey: 'fields.title' }, { key: 'subjectId', labelKey: 'fields.subject', render: (item, context) => relationName(item.subjectId ?? item.subject?.id, context.relations.subjects ?? []) }, { key: 'teacherId', labelKey: 'fields.teacher', render: (item, context) => relationName(item.teacherId ?? item.teacher?.id, context.relations.teachers ?? []) }, { key: 'isFree', labelKey: 'fields.isFree' }, { key: 'price', labelKey: 'fields.price' }, { key: 'currency', labelKey: 'fields.currency' }],
    fields: [{ name: 'subjectId', labelKey: 'fields.subject', type: 'select', relationKey: 'subjects', required: true }, { name: 'teacherId', labelKey: 'fields.teacher', type: 'select', relationKey: 'teachers', required: true }, { name: 'title', labelKey: 'fields.title', type: 'text', required: true }, { name: 'description', labelKey: 'fields.description', type: 'textarea' }, { name: 'isFree', labelKey: 'fields.isFree', type: 'checkbox' }, { name: 'price', labelKey: 'fields.price', type: 'number' }, { name: 'currency', labelKey: 'fields.currency', type: 'text' }],
    emptyValues: { subjectId: '', teacherId: '', title: '', description: '', isFree: true, price: 0, currency: 'SYP' },
    getInitialValues: (item) => ({ subjectId: toStringValue(item.subjectId ?? item.subject?.id), teacherId: toStringValue(item.teacherId ?? item.teacher?.id), title: toStringValue(item.title), description: toStringValue(item.description), isFree: toBooleanValue(item.isFree), price: toNumberValue(item.price), currency: toStringValue(item.currency) || 'SYP' }),
    validate: (values) => toValidationResult(courseSchema.safeParse(values)),
    toPayload: (values) => ({ subjectId: values.subjectId, teacherId: values.teacherId, title: values.title, description: values.description, isFree: values.isFree === true, price: Number(values.price ?? 0), currency: values.currency }),
  },
  resources: { key: 'resources', titleKey: 'modules.resources.title', descriptionKey: 'modules.resources.description', endpoints: resourceEndpoints, columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'url', labelKey: 'fields.url' }, { key: 'isImage', labelKey: 'fields.isImage' }], fields: [], emptyValues: {}, getInitialValues: () => ({}), validate: (values) => ({ success: true, data: values }), toPayload: (values) => values },
  ads: { key: 'ads', titleKey: 'modules.ads.title', descriptionKey: 'modules.ads.description', endpoints: API_ENDPOINTS.ads, columns: [{ key: 'title', labelKey: 'fields.title' }, { key: 'description', labelKey: 'fields.description' }], fields: [], emptyValues: {}, getInitialValues: () => ({}), validate: (values) => ({ success: true, data: values }), toPayload: (values) => values },
  pointsOfSale: { key: 'pointsOfSale', titleKey: 'modules.pointsOfSale.title', descriptionKey: 'modules.pointsOfSale.description', endpoints: API_ENDPOINTS.pointsOfSale, columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'code', labelKey: 'fields.code' }], fields: [], emptyValues: {}, getInitialValues: () => ({}), validate: (values) => ({ success: true, data: values }), toPayload: (values) => values },
  qrCodes: { key: 'qrCodes', titleKey: 'modules.qrCodes.title', descriptionKey: 'modules.qrCodes.description', endpoints: API_ENDPOINTS.qrCodes, columns: [{ key: 'code', labelKey: 'fields.code' }], fields: [], emptyValues: {}, getInitialValues: () => ({}), validate: (values) => ({ success: true, data: values }), toPayload: (values) => values },
  ['notifications']: { key: 'notifications', titleKey: 'modules.notifications.title', descriptionKey: 'modules.notifications.description', endpoints: API_ENDPOINTS.notifications, columns: [{ key: 'title', labelKey: 'fields.title' }, { key: 'body', labelKey: 'fields.body' }], fields: [], emptyValues: {}, getInitialValues: () => ({}), validate: (values) => ({ success: true, data: values }), toPayload: (values) => values },
  pageContents: { key: 'pageContents', titleKey: 'modules.pageContents.title', descriptionKey: 'modules.pageContents.description', endpoints: API_ENDPOINTS.pageContents, columns: [{ key: 'key', labelKey: 'fields.key' }, { key: 'title', labelKey: 'fields.title' }], fields: [], emptyValues: {}, getInitialValues: () => ({}), validate: (values) => ({ success: true, data: values }), toPayload: (values) => values },
}
