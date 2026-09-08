import { academicContentConfigs } from '@/modules/content-crud/content-crud.config'
import type { ContentFormValues } from '@/modules/content-crud/content-crud.types'

const STUDENT_FORM_MODE_FIELD = '__studentFormMode'
const STUDENT_PASSWORD_MIN_LENGTH = 8

const studentConfig = academicContentConfigs.students
const originalValidate = studentConfig.validate
const originalToPayload = studentConfig.toPayload
const originalGetInitialValues = studentConfig.getInitialValues

if (!studentConfig.fields.some((field) => field.name === 'password')) {
  studentConfig.fields = [
    ...studentConfig.fields,
    {
      name: 'password',
      labelKey: 'fields.password',
      type: 'password',
      required: true,
    },
  ]
}

studentConfig.emptyValues = {
  ...studentConfig.emptyValues,
  password: '',
  [STUDENT_FORM_MODE_FIELD]: 'create',
}

studentConfig.getInitialValues = (item) => ({
  ...originalGetInitialValues(item),
  password: '',
  [STUDENT_FORM_MODE_FIELD]: 'edit',
})

studentConfig.validate = (values: ContentFormValues) => {
  const baseValidation = originalValidate(values)
  const errors: Record<string, string> = baseValidation.success ? {} : { ...baseValidation.errors }
  const phoneNumber = typeof values.phoneNumber === 'string' ? values.phoneNumber.trim() : ''
  const password = typeof values.password === 'string' ? values.password.trim() : ''
  const isEdit = values[STUDENT_FORM_MODE_FIELD] === 'edit'

  if (!phoneNumber) errors.phoneNumber = 'validation.required'
  if (!isEdit && !password) {
    errors.password = 'validation.required'
  } else if (password && password.length < STUDENT_PASSWORD_MIN_LENGTH) {
    errors.password = 'validation.passwordMinLength'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false as const, errors }
  }

  return {
    success: true as const,
    data: {
      ...values,
      ...(baseValidation.success ? baseValidation.data : {}),
      password,
      [STUDENT_FORM_MODE_FIELD]: isEdit ? 'edit' : 'create',
    },
  }
}

studentConfig.toPayload = (values: ContentFormValues) => {
  const payload = originalToPayload(values)
  const password = typeof values.password === 'string' ? values.password.trim() : ''

  return password ? { ...payload, password } : payload
}
