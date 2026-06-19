export type PaginationLinks = {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export type PaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  links?: Array<{
    url: string | null
    label: string
    active: boolean
  }>
  path?: string
  per_page: number
  to: number | null
  total: number
}

export type ListApiResponse<T> = {
  success?: boolean
  message?: string
  locale?: string
  data: T[]
  links?: PaginationLinks
  meta?: PaginationMeta
}

export type ItemApiResponse<T> = {
  success?: boolean
  message?: string
  locale?: string
  data: T
}

export type MutationApiResponse<T> = {
  success?: boolean
  message?: string
  locale?: string
  data: T
}
