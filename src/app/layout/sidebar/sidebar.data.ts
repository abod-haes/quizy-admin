import {
  BookOpenCheck,
  BookText,
  CalendarDays,
  FileQuestion,
  FolderKanban,
  Gauge,
  GraduationCap,
  Layers3,
  LibraryBig,
  School,
  UploadCloud,
  UsersRound,
} from 'lucide-react'

import type { SidebarItem } from '@/app/layout/sidebar/sidebar.types'
import { APP_ROUTES } from '@/app/router/route-object.type'

export const primarySidebarItems: SidebarItem[] = [
  { id: 'dashboard', labelKey: 'sidebar.items.dashboard', to: APP_ROUTES.dashboard.path, icon: Gauge, end: true },
  {
    id: 'quizManagement',
    labelKey: 'sidebar.groups.quizManagement',
    icon: FileQuestion,
    children: [
      { id: 'quizBuilder', labelKey: 'sidebar.items.quizBuilder', to: APP_ROUTES.quizBuilder.path, icon: UploadCloud, end: true },
      { id: 'quizzes', labelKey: 'sidebar.items.quizzes', to: APP_ROUTES.quizzes.path, icon: FileQuestion, end: true },
      { id: 'questions', labelKey: 'sidebar.items.questions', to: APP_ROUTES.questions.path, icon: LibraryBig, end: true },
    ],
  },
  {
    id: 'courseManagement',
    labelKey: 'sidebar.groups.courseManagement',
    icon: CalendarDays,
    children: [
      { id: 'courses', labelKey: 'sidebar.items.courses', to: APP_ROUTES.courses.path, icon: CalendarDays, end: true },
      { id: 'courseSessions', labelKey: 'sidebar.items.courseSessions', to: APP_ROUTES.courseSessions.path, icon: BookOpenCheck, end: true },
    ],
  },
  {
    id: 'contentManagement',
    labelKey: 'sidebar.groups.contentManagement',
    icon: FolderKanban,
    children: [
      { id: 'classes', labelKey: 'sidebar.items.classes', to: APP_ROUTES.classes.path, icon: School, end: true },
      { id: 'subjects', labelKey: 'sidebar.items.subjects', to: APP_ROUTES.subjects.path, icon: BookText, end: true },
      { id: 'units', labelKey: 'sidebar.items.units', to: APP_ROUTES.units.path, icon: Layers3, end: true },
      { id: 'lessons', labelKey: 'sidebar.items.lessons', to: APP_ROUTES.lessons.path, icon: BookOpenCheck, end: true },
    ],
  },
  {
    id: 'peopleManagement',
    labelKey: 'sidebar.groups.peopleManagement',
    icon: UsersRound,
    children: [
      { id: 'teachers', labelKey: 'sidebar.items.teachers', to: APP_ROUTES.teachers.path, icon: GraduationCap, end: true },
      { id: 'students', labelKey: 'sidebar.items.students', to: APP_ROUTES.students.path, icon: UsersRound, end: true },
    ],
  },
]

export const secondarySidebarItems: SidebarItem[] = []
