import { z } from 'zod'

import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import { arrayOfUuid, nonNegativeInt, optionalString, requiredString, uuidField } from '@/shared/validation/primitives'
import type { AcademicContentItem, ContentCrudConfig, ContentFormValues } from '@/modules/content-crud/content-crud.types'

const toStringValue = (value: unknown) => (typeof value === 'string' ? value : '')
const toNumberValue = (value: unknown) => (typeof value === 'number' ? value : 0)
const toStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])

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

function subjectClassIds(item: AcademicContentItem): string[] {
  if (Array.isArray(item.classIds)) return toStringArray(item.classIds)
  if (Array.isArray(item.classes)) return item.classes.map((classItem) => classItem.id).filter(Boolean)
  return []
}

export const academicContentConfigs: Record<ContentCrudConfig['key'], ContentCrudConfig> = {
  classes: {
    key: 'classes', titleKey: 'modules.classes.title', descriptionKey: 'modules.classes.description', endpoints: API_ENDPOINTS.classes,
    columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'subjects', labelKey: 'fields.subjects', render: (item) => String(Array.isArray(item.subjects) ? item.subjects.length : '-') }, { key: 'id', labelKey: 'fields.id' }],
    fields: [{ name: 'name', labelKey: 'fields.name', type: 'text', required: true }], emptyValues: { name: '' }, getInitialValues: (item) => ({ name: toStringValue(item.name) }), validate: (values) => toValidationResult(classSchema.safeParse(values)), toPayload: (values) => ({ name: values.name }),
  },
  subjects: {
    key: 'subjects', titleKey: 'modules.subjects.title', descriptionKey: 'modules.subjects.description', endpoints: API_ENDPOINTS.subjects, relations: [{ key: 'classes', endpoint: API_ENDPOINTS.classes.brief }],
    columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'classIds', labelKey: 'fields.classes', render: (item, context) => { const ids = subjectClassIds(item); const options = context.relations.classes ?? []; return ids.map((id) => options.find((option) => option.id === id)?.name ?? id).join('، ') || '-' } }, { key: 'id', labelKey: 'fields.id' }],
    fields: [{ name: 'name', labelKey: 'fields.name', type: 'text', required: true }, { name: 'classIds', labelKey: 'fields.classes', type: 'multi-select', relationKey: 'classes' }], emptyValues: { name: '', classIds: [] }, getInitialValues: (item) => ({ name: toStringValue(item.name), classIds: subjectClassIds(item) }), validate: (values) => toValidationResult(subjectSchema.safeParse(values)), toPayload: (values) => ({ name: values.name, classIds: toStringArray(values.classIds) }),
  },
  units: {
    key: 'units', titleKey: 'modules.units.title', descriptionKey: 'modules.units.description', endpoints: API_ENDPOINTS.units, relations: [{ key: 'subjects', endpoint: API_ENDPOINTS.subjects.brief }],
    columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'description', labelKey: 'fields.description' }, { key: 'subjectId', labelKey: 'fields.subject', relationKey: 'subjects' }, { key: 'id', labelKey: 'fields.id' }],
    fields: [{ name: 'name', labelKey: 'fields.name', type: 'text', required: true }, { name: 'desc', labelKey: 'fields.description', type: 'textarea' }, { name: 'subjectId', labelKey: 'fields.subject', type: 'select', relationKey: 'subjects', required: true }], emptyValues: { name: '', desc: '', subjectId: '' }, getInitialValues: (item) => ({ name: toStringValue(item.name), desc: toStringValue(item.desc ?? item.description), subjectId: toStringValue(item.subjectId ?? item.subject?.id) }), validate: (values) => toValidationResult(unitSchema.safeParse(values)), toPayload: (values) => ({ name: values.name, desc: values.desc, subjectId: values.subjectId }),
  },
  lessons: {
    key: 'lessons', titleKey: 'modules.lessons.title', descriptionKey: 'modules.lessons.description', endpoints: API_ENDPOINTS.lessons, relations: [{ key: 'units', endpoint: API_ENDPOINTS.units.brief }],
    columns: [{ key: 'name', labelKey: 'fields.name' }, { key: 'description', labelKey: 'fields.description' }, { key: 'unitId', labelKey: 'fields.unit', relationKey: 'units' }, { key: 'order', labelKey: 'fields.order' }, { key: 'id', labelKey: 'fields.id' }],
    fields: [{ name: 'name', labelKey: 'fields.name', type: 'text', required: true }, { name: 'desc', labelKey: 'fields.description', type: 'textarea' }, { name: 'unitId', labelKey: 'fields.unit', type: 'select', relationKey: 'units', required: true }, { name: 'order', labelKey: 'fields.order', type: 'number' }], emptyValues: { name: '', desc: '', unitId: '', order: 0 }, getInitialValues: (item) => ({ name: toStringValue(item.name), desc: toStringValue(item.desc ?? item.description), unitId: toStringValue(item.unitId ?? item.unit?.id), order: toNumberValue(item.order) }), validate: (values) => toValidationResult(lessonSchema.safeParse(values)), toPayload: (values) => ({ name: values.name, desc: values.desc, unitId: values.unitId, order: Number(values.order ?? 0) }),
  },
  teachers: {
    key: 'teachers', titleKey: 'modules.teachers.title', descriptionKey: 'modules.teachers.description', endpoints: API_ENDPOINTS.teachers,
    columns: [{ key: 'firstName', labelKey: 'fields.firstName' }, { key: 'lastName', labelKey: 'fields.lastName' }, { key: 'phoneNumber', labelKey: 'fields.phoneNumber' }, { key: 'description', labelKey: 'fields.description' }, { key: 'id', labelKey: 'fields.id' }],
    fields: [{ name: 'firstName', labelKey: 'fields.firstName', type: 'text', required: true }, { name: 'lastName', labelKey: 'fields.lastName', type: 'text' }, { name: 'phoneNumber', labelKey: 'fields.phoneNumber', type: 'text' }, { name: 'countryCallingCode', labelKey: 'fields.countryCallingCode', type: 'text' }, { name: 'description', labelKey: 'fields.description', type: 'textarea' }], emptyValues: { firstName: '', lastName: '', phoneNumber: '', countryCallingCode: '+963', description: '' }, getInitialValues: (item) => ({ firstName: toStringValue(item.firstName), lastName: toStringValue(item.lastName), phoneNumber: toStringValue(item.phoneNumber), countryCallingCode: toStringValue(item.countryCallingCode), description: toStringValue(item.description) }), validate: (values) => toValidationResult(teacherSchema.safeParse(values)), toPayload: (values) => ({ firstName: values.firstName, lastName: values.lastName, phoneNumber: values.phoneNumber, countryCallingCode: values.countryCallingCode, description: values.description }),
  },
  students: {
    key: 'students', titleKey: 'modules.students.title', descriptionKey: 'modules.students.description', endpoints: API_ENDPOINTS.students,
    columns: [{ key: 'firstName', labelKey: 'fields.firstName' }, { key: 'lastName', labelKey: 'fields.lastName' }, { key: 'phoneNumber', labelKey: 'fields.phoneNumber' }, { key: 'id', labelKey: 'fields.id' }],
    fields: [{ name: 'firstName', labelKey: 'fields.firstName', type: 'text', required: true }, { name: 'lastName', labelKey: 'fields.lastName', type: 'text' }, { name: 'phoneNumber', labelKey: 'fields.phoneNumber', type: 'text' }, { name: 'countryCallingCode', labelKey: 'fields.countryCallingCode', type: 'text' }], emptyValues: { firstName: '', lastName: '', phoneNumber: '', countryCallingCode: '+963' }, getInitialValues: (item) => ({ firstName: toStringValue(item.firstName), lastName: toStringValue(item.lastName), phoneNumber: toStringValue(item.phoneNumber), countryCallingCode: toStringValue(item.countryCallingCode) }), validate: (values) => toValidationResult(studentSchema.safeParse(values)), toPayload: (values) => ({ firstName: values.firstName, lastName: values.lastName, phoneNumber: values.phoneNumber, countryCallingCode: values.countryCallingCode }),
  },
}
