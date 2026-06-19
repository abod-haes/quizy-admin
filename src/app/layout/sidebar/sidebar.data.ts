import {
  BookOpenCheck,
  BookText,
  FileQuestion,
  Gauge,
  GraduationCap,
  Layers3,
  LibraryBig,
  School,
  Settings,
  UploadCloud,
  UsersRound,
} from 'lucide-react'

import type { SidebarItem } from '@/app/layout/sidebar/sidebar.types'
import { APP_ROUTES } from '@/app/router/route-object.type'

export const primarySidebarItems: SidebarItem[] = [
  { id: 'dashboard', labelKey: 'sidebar.items.dashboard', to: APP_ROUTES.dashboard.path, icon: Gauge, end: true },
  { id: 'quizBuilder', labelKey: 'sidebar.items.quizBuilder', to: APP_ROUTES.quizBuilder.path, icon: UploadCloud, end: true },
  { id: 'quizzes', labelKey: 'sidebar.items.quizzes', to: APP_ROUTES.quizzes.path, icon: FileQuestion, end: true },
  { id: 'questions', labelKey: 'sidebar.items.questions', to: APP_ROUTES.questions.path, icon: LibraryBig, end: true },
  { id: 'classes', labelKey: 'sidebar.items.classes', to: APP_ROUTES.classes.path, icon: School, end: true },
  { id: 'subjects', labelKey: 'sidebar.items.subjects', to: APP_ROUTES.subjects.path, icon: BookText, end: true },
  { id: 'units', labelKey: 'sidebar.items.units', to: APP_ROUTES.units.path, icon: Layers3, end: true },
  { id: 'lessons', labelKey: 'sidebar.items.lessons', to: APP_ROUTES.lessons.path, icon: BookOpenCheck, end: true },
  { id: 'teachers', labelKey: 'sidebar.items.teachers', to: APP_ROUTES.teachers.path, icon: GraduationCap, end: true },
  { id: 'students', labelKey: 'sidebar.items.students', to: APP_ROUTES.students.path, icon: UsersRound, end: true },
  { id: 'reviewQueue', labelKey: 'sidebar.items.reviewQueue', to: APP_ROUTES.reviewQueue.path, icon: LibraryBig, end: true },
]

export const secondarySidebarItems: SidebarItem[] = [
  { id: 'settings', labelKey: 'sidebar.items.settings', to: APP_ROUTES.settings.path, icon: Settings, end: true },
]
