export interface TablePaginationState {
  pageIndex: number
  pageSize: number
  sort?: string
}

export type TableSearchValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | Record<string, unknown>
  | unknown[]

export type TableSearchValues = Record<string, TableSearchValue>

export type TableColumnConfig = {
  id: string
  label: string
  visible: boolean
}

export interface PageTableSettings {
  pageKey: string
  columns: TableColumnConfig[]
  defaultColumns?: TableColumnConfig[]
  search: TableSearchValues
  pagination: TablePaginationState
}

type TableSettingsState = {
  pageSettings: Record<string, PageTableSettings>
}

const TABLE_SETTINGS_STORAGE_KEY = 'table-settings'

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function getDefaultPagination(): TablePaginationState {
  return {
    pageIndex: 1,
    pageSize: 10,
    sort: undefined,
  }
}

function getEmptyState(): TableSettingsState {
  return { pageSettings: {} }
}

function readTableSettingsState(): TableSettingsState {
  if (!isStorageAvailable()) {
    return getEmptyState()
  }

  const raw = window.localStorage.getItem(TABLE_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return getEmptyState()
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return getEmptyState()
    }

    const maybeWrapped = parsed as { state?: { pageSettings?: unknown } }
    const maybePlain = parsed as { pageSettings?: unknown }
    const pageSettings =
      maybeWrapped.state?.pageSettings ?? maybePlain.pageSettings ?? {}

    if (!pageSettings || typeof pageSettings !== 'object') {
      return getEmptyState()
    }

    return {
      pageSettings: pageSettings as Record<string, PageTableSettings>,
    }
  } catch {
    return getEmptyState()
  }
}

function writeTableSettingsState(state: TableSettingsState): void {
  if (!isStorageAvailable()) {
    return
  }

  window.localStorage.setItem(TABLE_SETTINGS_STORAGE_KEY, JSON.stringify(state))
}

export function getPageSettings(pageKey: string): PageTableSettings | undefined {
  return readTableSettingsState().pageSettings[pageKey]
}

export function setPageSettings(
  pageKey: string,
  settings: Partial<Omit<PageTableSettings, 'pageKey'>>
): void {
  const state = readTableSettingsState()
  const current = state.pageSettings[pageKey]

  const next: PageTableSettings = {
    pageKey,
    columns: settings.columns ?? current?.columns ?? [],
    defaultColumns:
      settings.defaultColumns !== undefined
        ? settings.defaultColumns
        : current?.defaultColumns,
    search: settings.search ?? current?.search ?? {},
    pagination: settings.pagination ?? current?.pagination ?? getDefaultPagination(),
  }

  writeTableSettingsState({
    pageSettings: {
      ...state.pageSettings,
      [pageKey]: next,
    },
  })
}

export function resetPageSettings(
  pageKey: string,
  defaults: Partial<Omit<PageTableSettings, 'pageKey'>>
): void {
  const state = readTableSettingsState()
  const current = state.pageSettings[pageKey]

  const next: PageTableSettings = {
    pageKey,
    columns: defaults.columns ?? current?.columns ?? [],
    defaultColumns: defaults.defaultColumns ?? current?.defaultColumns,
    search: defaults.search ?? {},
    pagination: defaults.pagination ?? current?.pagination ?? getDefaultPagination(),
  }

  writeTableSettingsState({
    pageSettings: {
      ...state.pageSettings,
      [pageKey]: next,
    },
  })
}

export function getTableSettingsStorageKey() {
  return TABLE_SETTINGS_STORAGE_KEY
}
