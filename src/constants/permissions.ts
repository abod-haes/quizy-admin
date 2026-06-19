function buildCrudPermissions<const TSection extends string>(section: TSection) {
  const view = `${section}.global.view` as const

  return {
    // List screens depend on view permission from backend.
    list: view,
    view,
    create: `${section}.global.create` as const,
    update: `${section}.global.update` as const,
    delete: `${section}.global.delete` as const,
  }
}

const EMPLOYEES_PERMISSIONS = buildCrudPermissions('users')
const HOME_CONTENT_PERMISSIONS = buildCrudPermissions('home-content')
const HOME_STATS_PERMISSIONS = buildCrudPermissions('home-stats')
const HOME_STAT_CARDS_PERMISSIONS = buildCrudPermissions('home-stat-cards')
const HOME_HIGHLIGHTS_PERMISSIONS = buildCrudPermissions('home-highlights')
const HOME_ABOUT_TABS_PERMISSIONS = buildCrudPermissions('home-about-tabs')
const HOME_ABOUT_TAB_CARDS_PERMISSIONS = buildCrudPermissions('home-about-tab-cards')
const MEMBERSHIP_BENEFITS_PERMISSIONS = buildCrudPermissions('membership-benefits')
const MEMBERSHIP_BENEFIT_CARDS_PERMISSIONS = buildCrudPermissions('membership-benefit-cards')
const PAGES_PERMISSIONS = buildCrudPermissions('pages')
const PROJECTS_PERMISSIONS = buildCrudPermissions('projects')
const PAGE_SECTIONS_PERMISSIONS = buildCrudPermissions('page-sections')
const SECTION_ITEMS_PERMISSIONS = buildCrudPermissions('section-items')
const BOARD_MEMBERS_PERMISSIONS = buildCrudPermissions('board-members')
const GALLERY_ITEMS_PERMISSIONS = buildCrudPermissions('gallery-items')
const FAQS_PERMISSIONS = buildCrudPermissions('faqs')
const FOOTER_LINKS_PERMISSIONS = buildCrudPermissions('footer-links')
const CONTACT_INFOS_PERMISSIONS = buildCrudPermissions('contact-infos')
const CONTACT_MESSAGES_PERMISSIONS = {
  list: 'contact-messages.global.view',
  view: 'contact-messages.global.view',
  update: 'contact-messages.global.update',
  delete: 'contact-messages.global.delete',
} as const

export const PERMISSIONS = {
  employees: EMPLOYEES_PERMISSIONS,
  homeContent: HOME_CONTENT_PERMISSIONS,
  homeStats: HOME_STATS_PERMISSIONS,
  homeStatCards: HOME_STAT_CARDS_PERMISSIONS,
  homeHighlights: HOME_HIGHLIGHTS_PERMISSIONS,
  homeAboutTabs: HOME_ABOUT_TABS_PERMISSIONS,
  homeAboutTabCards: HOME_ABOUT_TAB_CARDS_PERMISSIONS,
  membershipBenefits: MEMBERSHIP_BENEFITS_PERMISSIONS,
  membershipBenefitCards: MEMBERSHIP_BENEFIT_CARDS_PERMISSIONS,
  pages: PAGES_PERMISSIONS,
  projects: PROJECTS_PERMISSIONS,
  pageSections: PAGE_SECTIONS_PERMISSIONS,
  sectionItems: SECTION_ITEMS_PERMISSIONS,
  boardMembers: BOARD_MEMBERS_PERMISSIONS,
  galleryItems: GALLERY_ITEMS_PERMISSIONS,
  faqs: FAQS_PERMISSIONS,
  footerLinks: FOOTER_LINKS_PERMISSIONS,
  contactInfos: CONTACT_INFOS_PERMISSIONS,
  contactMessages: CONTACT_MESSAGES_PERMISSIONS,
} as const

type LeafPermissionValue<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? { [K in keyof T]: LeafPermissionValue<T[K]> }[keyof T]
    : never

export type KnownAppPermission = LeafPermissionValue<typeof PERMISSIONS>
export type AppPermission = KnownAppPermission | (string & {})

function collectStringValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  return Object.values(value as Record<string, unknown>).flatMap((entry) =>
    collectStringValues(entry)
  )
}

export const KNOWN_PERMISSIONS = collectStringValues(PERMISSIONS) as readonly KnownAppPermission[]
