export type UUID = string

/** Modern Nest admin DTOs (employees, courses, QR, management endpoints). */
export type PaginationQuery = {
  page?: number
  perPage?: number
}

/** Legacy-backed Nest services still expose the historical query casing. */
export type LegacyPaginationQuery = {
  Page?: number
  PerPage?: number
}

export type PagedResponse<TItem> = {
  items: TItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  traceId?: string
  correlationId?: string
  requestId?: string
  errorId?: string
  errors?: Record<string, string[]>
}

export type AppError = {
  status: number | null
  message: string
  code?: string
  fieldErrors?: Record<string, string[]>
  traceId?: string
  errorId?: string
  raw?: unknown
}

export type ResourceLink = {
  id: UUID
  url?: string | null
  filePath?: string | null
  isImage?: boolean | null
}

export type BriefOption = {
  id: UUID
  name: string
  description?: string | null
}
