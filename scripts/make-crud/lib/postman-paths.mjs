import { toCamel, toKebab } from './string-utils.mjs'

export const toIdentifier = (value, fallback = 'id') => {
  const cleaned = toCamel(String(value ?? '').replace(/[^a-zA-Z0-9_$]/g, ''))
  if (!cleaned || /^[0-9]/.test(cleaned)) {
    return fallback
  }

  return cleaned
}

export const parseDynamicSegmentName = (segment) => {
  if (!isDynamicSegment(segment)) {
    return null
  }

  const fromDoubleBraces = segment.match(/^\{\{(.+)\}\}$/)?.[1]
  if (fromDoubleBraces) {
    return toIdentifier(fromDoubleBraces, 'id')
  }

  const fromBraces = segment.match(/^\{(.+)\}$/)?.[1]
  if (fromBraces) {
    return toIdentifier(fromBraces, 'id')
  }

  if (segment.startsWith(':')) {
    return toIdentifier(segment.slice(1), 'id')
  }

  return 'id'
}

export const isDynamicSegment = (segment) => {
  if (!segment) {
    return false
  }

  return (
    /^\{\{.+\}\}$/.test(segment) ||
    /^\{.+\}$/.test(segment) ||
    /^:.+/.test(segment)
  )
}

export const normalizePathSegments = (pathValue) => {
  const rawSegments = (Array.isArray(pathValue) ? pathValue : [])
    .map((segment) => {
      if (typeof segment === 'string') {
        return segment
      }

      if (segment && typeof segment === 'object') {
        const record = segment
        if (typeof record.value === 'string') return record.value
        if (typeof record.key === 'string') return record.key
      }

      return ''
    })
    .map((segment) => segment.trim())
    .filter(Boolean)

  const normalizedSegments = rawSegments.map((segment) => {
    const dynamicName = parseDynamicSegmentName(segment)
    return dynamicName ? `:${dynamicName}` : segment
  })

  return {
    rawSegments,
    normalizedSegments,
    rawPath: '/' + rawSegments.join('/'),
    normalizedPath: '/' + normalizedSegments.join('/'),
  }
}

export const flattenCollectionItems = (items, bucket = [], folderPath = []) => {
  for (const item of items ?? []) {
    if (Array.isArray(item?.item)) {
      const nextFolderPath = item?.name ? [...folderPath, String(item.name)] : folderPath
      flattenCollectionItems(item.item, bucket, nextFolderPath)
      continue
    }

    if (!item?.request) {
      continue
    }

    const method = String(item.request.method ?? '').toUpperCase()
    const pathInfo = normalizePathSegments(item.request.url?.path)

    if (!method || pathInfo.rawSegments.length === 0) {
      continue
    }

    bucket.push({
      name: item.name ?? '',
      folderPath,
      method,
      request: item.request,
      responses: Array.isArray(item.response) ? item.response : [],
      ...pathInfo,
    })
  }

  return bucket
}

export const hasFolderPrefix = (folderPath, prefix) =>
  prefix.every((entry, index) => folderPath[index] === entry)
