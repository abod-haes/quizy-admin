import { academicContentConfigs } from '@/modules/content-crud/content-crud.config'

let configured = false

/**
 * Extends the generic teacher CRUD with the credential field used by direct
 * staff login. Keeping the password out of getInitialValues prevents an
 * existing hash/credential from ever being echoed back into the admin form.
 */
export function configureStaffCredentialFields() {
  if (configured) return
  configured = true

  const teacherConfig = academicContentConfigs.teachers
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

    const password = typeof values.password === 'string' ? values.password : ''
    if (password && (password.length < 8 || password.length > 72)) {
      return {
        success: false,
        errors: { password: 'validation.passwordLength' },
      }
    }
    return result
  }

  const toPayload = teacherConfig.toPayload
  teacherConfig.toPayload = (values) => {
    const payload = toPayload(values)
    const password = typeof values.password === 'string' ? values.password.trim() : ''
    return password ? { ...payload, password } : payload
  }
}
