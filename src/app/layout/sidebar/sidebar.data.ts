import {
  BarChart3,
  BookOpenCheck,
  BookText,
  CalendarDays,
  FileQuestion,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  Layers3,
  LibraryBig,
  Megaphone,
  School,
  UploadCloud,
  UsersRound,
} from 'lucide-react'

import type { SidebarItem } from '@/app/layout/sidebar/sidebar.types'
import { APP_ROUTES } from '@/app/router/route-object.type'

export const primarySidebarItems: SidebarItem[] = [
  {
    id: 'dashboardScope',
    labelKey: 'sidebar.items.dashboard',
    icon: Gauge,
    defaultOpen: true,
    children: [
      { id: 'statistics', labelKey: 'translation:layout.meta.dashboard.plural', to: APP_ROUTES.dashboard.path, icon: BarChart3, end: true },
      { id: 'ads', labelKey: 'content-crud:modules.ads.title', to: APP_ROUTES.ads.path, icon: Megaphone, end: true },
      { id: 'pageContents', labelKey: 'content-crud:modules.pageContents.title', to: APP_ROUTES.pageContents.path, icon: FileText, end: true },
    ],
  },
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
      { id: 'courseContent', labelKey: 'sidebar.items.courseContent', to: APP_ROUTES.courseContent.path, icon: UploadCloud, end: true },
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
