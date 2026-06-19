import { FILE_TOKEN, sanitizeKeySegment } from './string-utils.mjs'

export const parseJsonSafely = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export const parsePrimitive = (value) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return ''
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  if (trimmed.toLowerCase() === 'true') {
    return true
  }

  if (trimmed.toLowerCase() === 'false') {
    return false
  }

  if (trimmed.toLowerCase() === 'null') {
    return null
  }

  const parsedJson = parseJsonSafely(trimmed)
  if (parsedJson !== null) {
    return parsedJson
  }

  return trimmed
}

export const parseBracketPath = (key) => {
  const segments = []
  const source = String(key ?? '').trim()

  if (!source) {
    return segments
  }

  const firstMatch = source.match(/^([^\[]+)/)
  if (firstMatch?.[1]) {
    segments.push(sanitizeKeySegment(firstMatch[1]))
  }

  const bracketMatches = source.matchAll(/\[([^\]]*)\]/g)
  for (const match of bracketMatches) {
    const value = match[1]
    if (!value) {
      continue
    }

    const normalized = sanitizeKeySegment(value)
    if (normalized) {
      segments.push(normalized)
    }
  }

  return segments.filter(Boolean)
}

export const setDeepValue = (target, pathSegments, value) => {
  if (!pathSegments.length) {
    return
  }

  let cursor = target
  for (let index = 0; index < pathSegments.length; index += 1) {
    const segment = pathSegments[index]
    const isLeaf = index === pathSegments.length - 1

    if (isLeaf) {
      cursor[segment] = value
      return
    }

    const nextValue = cursor[segment]
    if (!nextValue || typeof nextValue !== 'object' || Array.isArray(nextValue)) {
      cursor[segment] = {}
    }

    cursor = cursor[segment]
  }
}

export const findResponsePayload = (requestItem) => {
  if (!requestItem) {
    return null
  }

  for (const response of requestItem.responses) {
    if (typeof response?.body !== 'string') {
      continue
    }

    const parsed = parseJsonSafely(response.body)
    if (parsed !== null) {
      return parsed
    }
  }

  return null
}

export const unwrapListPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.data)) {
    return payload.data
  }

  return []
}

export const unwrapItemPayload = (payload) => {
  if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object') {
    return payload.data
  }

  return payload
}
