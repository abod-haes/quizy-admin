import { academicContentConfigs } from '@/modules/content-crud/content-crud.config'

let configured = false

/**
 * Extends the generic teacher CRUD with the credential field used by direct
 * staff login. Existing credentials are never read back into the admin form.
 */
export function configureStaffCredentialFields() {
  if (configured) return
  configured = true

  const teacherConfig = academicContentConfigs.teachers
  teacherConfig.fields = teacherConfig.fields.map((field) =>
    field.name === 'phoneNumber' || field.name === 'countryCallingCode'
      ? { ...field, required: true }
      : field,
  )

  if (!teacherConfig.fields.some((field) => field.name === 'password')) {
    const descriptionIndex = teacherConfig.fields.findIndex(
      (field) => field.name === 'description',
    )
    const passwordField = {
      name: 'password',
      labelKey: 'fields.password',
      type: 'password' as const,
    }
    const nextFields = [...teacherConfig.fields]
    nextFields.splice(
      descriptionIndex >= 0 ? descriptionIndex : nextFields.length,
      0,
      passwordField,
    )
    teacherConfig.fields = nextFields
  }

  teacherConfig.emptyValues = {
    ...teacherConfig.emptyValues,
    password: '',
  }

  const getInitialValues = teacherConfig.getInitialValues
  teacherConfig.getInitialValues = (item) => ({
    ...getInitialValues(item),
    password: '',
  })

  const validate = teacherConfig.validate
  teacherConfig.validate = (values) => {
    const result = validate(values)
    if (!result.success) return result

    const phoneNumber = typeof values.phoneNumber === 'string' ? values.phoneNumber.trim() : ''
    const countryCallingCode =
      typeof values.countryCallingCode === 'string' ? values.countryCallingCode.trim() : ''
    const password = typeof values.password === 'string' ? values.password : ''

    const errors: Record<string, string> = {}
    if (!phoneNumber) errors.phoneNumber = 'validation.required'
    if (!countryCallingCode) errors.countryCallingCode = 'validation.required'
    if (password && (password.length < 8 || password.length > 72)) {
      errors.password = 'كلمة السر يجب أن تكون بين 8 و72 محرفًا.'
    }
    if (Object.keys(errors).length > 0) return { success: false, errors }

    return {
      success: true,
      data: { ...result.data, phoneNumber, countryCallingCode, password },
    }
  }

  const toPayload = teacherConfig.toPayload
  teacherConfig.toPayload = (values) => {
    const payload = toPayload(values)
    const password = typeof values.password === 'string' ? values.password.trim() : ''
    return password ? { ...payload, password } : payload
  }
}
