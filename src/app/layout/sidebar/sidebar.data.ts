import {
  BookOpenCheck,
  BookText,
  BellRing,
  BrainCircuit,
  CalendarDays,
  FileQuestion,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  HardDrive,
  Layers3,
  LibraryBig,
  MapPin,
  Megaphone,
  MessageCircle,
  QrCode,
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
      { id: 'statistics', labelKey: 'translation:layout.meta.dashboard.plural', to: APP_ROUTES.dashboard.path, icon: Gauge, end: true },
      { id: 'ads', labelKey: 'content-crud:modules.ads.title', to: APP_ROUTES.ads.path, icon: Megaphone, permissions: ['content.manage'], end: true },
      { id: 'notifications', labelKey: 'content-crud:modules.notifications.title', to: APP_ROUTES.notifications.path, icon: BellRing, permissions: ['notifications.manage'], end: true },
      { id: 'pageContents', labelKey: 'content-crud:modules.pageContents.title', to: APP_ROUTES.pageContents.path, icon: FileText, permissions: ['content.manage'], end: true },
    ],
  },
  {
    id: 'quizManagement',
    labelKey: 'sidebar.groups.quizManagement',
    icon: FileQuestion,
    permissions: ['quizzes.manage'],
    children: [
      { id: 'quizBuilder', labelKey: 'sidebar.items.quizBuilder', to: APP_ROUTES.quizBuilder.path, icon: UploadCloud, permissions: ['quizzes.manage'], end: true },
      { id: 'quizzes', labelKey: 'sidebar.items.quizzes', to: APP_ROUTES.quizzes.path, icon: FileQuestion, permissions: ['quizzes.manage'], end: true },
      { id: 'questions', labelKey: 'sidebar.items.questions', to: APP_ROUTES.questions.path, icon: LibraryBig, permissions: ['quizzes.manage'], end: true },
    ],
  },
  {
    id: 'courseManagement',
    labelKey: 'sidebar.groups.courseManagement',
    to: APP_ROUTES.courses.path,
    icon: CalendarDays,
    permissions: ['courses.manage'],
    end: true,
  },
  {
    id: 'contentManagement',
    labelKey: 'sidebar.groups.contentManagement',
    icon: FolderKanban,
    permissions: ['content.manage', 'resources.manage'],
    children: [
      { id: 'classes', labelKey: 'sidebar.items.classes', to: APP_ROUTES.classes.path, icon: School, permissions: ['content.manage'], end: true },
      { id: 'subjects', labelKey: 'sidebar.items.subjects', to: APP_ROUTES.subjects.path, icon: BookText, permissions: ['content.manage'], end: true },
      { id: 'units', labelKey: 'sidebar.items.units', to: APP_ROUTES.units.path, icon: Layers3, permissions: ['content.manage'], end: true },
      { id: 'lessons', labelKey: 'sidebar.items.lessons', to: APP_ROUTES.lessons.path, icon: BookOpenCheck, permissions: ['content.manage'], end: true },
      { id: 'resources', labelKey: 'content-crud:modules.resources.title', to: APP_ROUTES.resources.path, icon: HardDrive, permissions: ['resources.manage'], end: true },
    ],
  },
  {
    id: 'peopleManagement',
    labelKey: 'sidebar.groups.peopleManagement',
    icon: UsersRound,
    children: [
      { id: 'teachers', labelKey: 'sidebar.items.teachers', to: APP_ROUTES.teachers.path, icon: GraduationCap, permissions: ['content.manage'], end: true },
      { id: 'students', labelKey: 'sidebar.items.students', to: APP_ROUTES.students.path, icon: UsersRound, permissions: ['content.manage'], end: true },
      { id: 'managementUsers', labelKey: 'content-crud:modules.managementUsers.title', to: APP_ROUTES.managementUsers.path, icon: UsersRound, permissions: ['employees.manage'], end: true },
    ],
  },
  {
    id: 'distributionManagement',
    labelKey: 'sidebar.items.aiQrCodes',
    icon: QrCode,
    permissions: ['qr.manage'],
    children: [
      { id: 'pointsOfSale', labelKey: 'content-crud:modules.pointsOfSale.title', to: APP_ROUTES.pointsOfSale.path, icon: MapPin, permissions: ['qr.manage'], end: true },
      { id: 'unifiedQrCodes', labelKey: 'sidebar.items.aiQrCodes', to: APP_ROUTES.qrCodes.path, icon: QrCode, permissions: ['qr.manage'], end: true },
    ],
  },
  {
    id: 'aiManagement',
    labelKey: 'sidebar.groups.aiManagement',
    icon: BrainCircuit,
    permissions: ['ai.manage'],
    children: [
      { id: 'aiChatSettings', labelKey: 'sidebar.items.aiChatSettings', to: APP_ROUTES.aiChatSettings.path, icon: BrainCircuit, permissions: ['ai.manage'], end: true },
      { id: 'aiSubscriptions', labelKey: 'sidebar.items.aiSubscriptions', to: APP_ROUTES.aiSubscriptions.path, icon: UsersRound, permissions: ['ai.manage'], end: true },
      { id: 'aiDocuments', labelKey: 'sidebar.items.aiDocuments', to: APP_ROUTES.aiDocuments.path, icon: FileText, permissions: ['ai.manage'], end: true },
    ],
  },
]

export const secondarySidebarItems: SidebarItem[] = [
  {
    id: 'whatsapp',
    labelKey: 'whatsapp:sidebar',
    to: APP_ROUTES.whatsapp.path,
    icon: MessageCircle,
    roles: ['SuperAdmin'],
    end: true,
  },
]
