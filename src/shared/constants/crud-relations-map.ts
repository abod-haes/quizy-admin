export const CRUD_RELATION_ENDPOINTS = {
  projects: {
    section_id: '/api/v1/admin/page-sections',
  },
  pageSections: {
    page_id: '/api/v1/admin/pages',
    section_type: '/api/v1/admin/page-sections',
  },
  sectionItems: {
    section_id: '/api/v1/admin/page-sections',
  },
  boardMembers: {
    section_id: '/api/v1/admin/page-sections',
  },
  galleryItems: {
    section_id: '/api/v1/admin/page-sections',
  },
  faqs: {
    section_id: '/api/v1/admin/page-sections',
  },
  footerLinks: {
    section_id: '/api/v1/admin/page-sections',
  },
  contactInfos: {
    section_id: '/api/v1/admin/page-sections',
  },
} as const

export function getCrudRelationEndpoint(moduleName: string, fieldPath: string): string {
  const moduleRelations = (CRUD_RELATION_ENDPOINTS as Record<string, Record<string, string> | undefined>)[moduleName]
  if (!moduleRelations) {
    return ''
  }

  return moduleRelations[fieldPath] ?? ''
}
