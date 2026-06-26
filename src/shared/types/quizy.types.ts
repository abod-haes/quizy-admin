import type { UUID } from '@/shared/api/api.types'

export type NamedEntity = {
  id: UUID
  name?: string | null
  desc?: string | null
  description?: string | null
  order?: number
}

export type ClassItem = NamedEntity & {
  subjects?: NamedEntity[] | null
}

export type SubjectItem = NamedEntity & {
  classId?: UUID | null
  className?: string | null
}

export type UnitItem = NamedEntity & {
  subjectId?: UUID | null
  subjectName?: string | null
}

export type LessonItem = NamedEntity & {
  unitId?: UUID | null
  unitName?: string | null
}

export type PersonItem = {
  id: UUID
  firstName?: string | null
  lastName?: string | null
  name?: string | null
}

export type TeacherItem = PersonItem
export type StudentItem = PersonItem
