export type UUID = string

export type PaginationQuery = {
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
  isImage?: boolean
}

export type BriefOption = {
  id: UUID
  name: string
  description?: string | null
}
