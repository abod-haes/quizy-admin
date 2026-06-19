export const ProjectsTableColumns = [
  { key: 'translations', labelKey: 'table.columns.translations', isDate: false },
  { key: 'status', labelKey: 'table.columns.status', isDate: false },
  { key: 'is_featured', labelKey: 'table.columns.isFeatured', isDate: false },
  { key: 'is_active', labelKey: 'table.columns.isActive', isDate: false },
  { key: 'created_at', labelKey: 'table.columns.createdAt', isDate: true },
  { key: 'updated_at', labelKey: 'table.columns.updatedAt', isDate: true },
] as const
