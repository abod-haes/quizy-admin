import { FILE_TOKEN, IGNORED_PATH_SEGMENTS, NON_CRUD_SUFFIXES, toKebab, toSingularKebab } from './string-utils.mjs'
import { hasFolderPrefix } from './postman-paths.mjs'
import {
  parseBracketPath,
  parseJsonSafely,
  parsePrimitive,
  setDeepValue,
} from './payload-utils.mjs'

export const pickBestCandidate = (requests, endpointSegment) => {
  const candidates = new Map()

  for (const request of requests) {
    const segmentIndex = request.normalizedSegments.findIndex(
      (segment) => toKebab(segment) === endpointSegment
    )

    if (segmentIndex === -1) {
      continue
    }

    const remainder = request.normalizedSegments.slice(segmentIndex + 1)
    if (remainder.some((segment) => NON_CRUD_SUFFIXES.has(toKebab(segment)))) {
      continue
    }

    const baseSegments = request.normalizedSegments.slice(0, segmentIndex + 1)
    const basePath = '/' + baseSegments.join('/')

    if (!candidates.has(basePath)) {
      candidates.set(basePath, {
        basePath,
        endpointSegment,
        requests: [],
      })
    }

    candidates.get(basePath).requests.push(request)
  }

  let best = null

  for (const candidate of candidates.values()) {
    const findRequest = (method, normalizedPath) =>
      candidate.requests.find((entry) => entry.method === method && entry.normalizedPath === normalizedPath)

    const detailPathCandidates = Array.from(
      new Set(
        candidate.requests
          .filter((entry) => entry.normalizedPath.startsWith(`${candidate.basePath}/:`))
          .map((entry) => entry.normalizedPath)
          .filter((entryPath) => {
            const tail = entryPath.slice(candidate.basePath.length + 1)
            return tail.startsWith(':') && !tail.includes('/')
          })
      )
    )

    const listRequest = findRequest('GET', candidate.basePath)
    const createRequest = findRequest('POST', candidate.basePath)

    const summaryByDetailPath = detailPathCandidates.map((detailPath) => {
      const detailRequest = findRequest('GET', detailPath)
      const patchRequest = findRequest('PATCH', detailPath)
      const putRequest = findRequest('PUT', detailPath)
      const removeRequest = findRequest('DELETE', detailPath)
      const updateRequest = patchRequest ?? putRequest ?? null
      const operationsCount = [listRequest, detailRequest, createRequest, updateRequest, removeRequest].filter(Boolean).length

      return {
        detailPath,
        detailRequest,
        updateRequest,
        removeRequest,
        operationsCount,
      }
    })

    const bestDetailSummary = summaryByDetailPath.sort((a, b) => b.operationsCount - a.operationsCount)[0]
    const detailPath = bestDetailSummary?.detailPath ?? `${candidate.basePath}/:id`
    const detailRequest = bestDetailSummary?.detailRequest ?? findRequest('GET', detailPath)
    const updateRequest = bestDetailSummary?.updateRequest ?? (findRequest('PATCH', detailPath) ?? findRequest('PUT', detailPath) ?? null)
    const removeRequest = bestDetailSummary?.removeRequest ?? findRequest('DELETE', detailPath)

    const operationsCount = [listRequest, detailRequest, createRequest, updateRequest, removeRequest].filter(Boolean).length

    if (operationsCount === 0) {
      continue
    }

    const score = operationsCount * 10 + candidate.basePath.length

    const summary = {
      basePath: candidate.basePath,
      detailPath,
      listRequest,
      detailRequest,
      createRequest,
      updateRequest,
      removeRequest,
      score,
    }

    if (!best || summary.score > best.score) {
      best = summary
    }
  }

  return best
}

export const extractPayloadSample = (requestItem) => {
  const mode = requestItem?.request?.body?.mode
  if (!mode) {
    return null
  }

  if (mode === 'raw') {
    const rawBody = requestItem.request.body?.raw
    if (typeof rawBody !== 'string') {
      return null
    }

    const parsed = parseJsonSafely(rawBody)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }

    return null
  }

  if (mode === 'formdata' || mode === 'urlencoded') {
    const entries = requestItem.request.body?.[mode]
    if (!Array.isArray(entries)) {
      return null
    }

    const root = {}
    for (const entry of entries) {
      if (!entry || typeof entry.key !== 'string' || entry.disabled) {
        continue
      }

      const pathSegments = parseBracketPath(entry.key)
      if (!pathSegments.length) {
        continue
      }

      const rawValue = entry.type === 'file' ? FILE_TOKEN : parsePrimitive(entry.value ?? '')
      setDeepValue(root, pathSegments, rawValue)
    }

    return root
  }

  return null
}

export const getSuggestions = (requests, endpointSegment) => {
  const resources = new Set()

  for (const request of requests) {
    for (const segment of request.normalizedSegments) {
      const normalized = toKebab(segment)
      if (!normalized || normalized === 'api' || normalized === 'v1' || normalized === 'admin') {
        continue
      }

      if (normalized.startsWith('{{') || normalized === ':id') {
        continue
      }

      resources.add(normalized)
    }
  }

  return Array.from(resources)
    .filter((entry) => entry.includes(endpointSegment) || endpointSegment.includes(entry))
    .slice(0, 8)
}

export const collectEndpointOptions = (requests) => {
  const segments = new Set()

  for (const request of requests) {
    for (const segment of request.normalizedSegments) {
      if (segment.startsWith(':')) {
        continue
      }

      const normalized = toKebab(segment)
      if (!normalized || IGNORED_PATH_SEGMENTS.has(normalized) || NON_CRUD_SUFFIXES.has(normalized)) {
        continue
      }

      segments.add(normalized)
    }
  }

  const options = []
  for (const segment of segments) {
    const candidate = pickBestCandidate(requests, segment)
    if (!candidate) {
      continue
    }

    const ops = [
      candidate.listRequest ? 'get' : null,
      candidate.detailRequest
        ? (candidate.detailPath.split('/').pop()?.toLowerCase().includes('slug')
            ? 'getBySlug'
            : 'getById')
        : null,
      candidate.createRequest ? 'post' : null,
      candidate.updateRequest ? candidate.updateRequest.method.toLowerCase() : null,
      candidate.removeRequest ? 'delete' : null,
    ].filter(Boolean)

    if (ops.length === 0) {
      continue
    }

    options.push({
      endpoint: segment,
      ops,
      candidate,
    })
  }

  return options.sort((a, b) => a.endpoint.localeCompare(b.endpoint))
}

export const normalizeLabel = (value) => String(value ?? '').trim().toLowerCase()

export const getTopLevelApiGroups = (requests) => {
  const groups = new Set()

  for (const request of requests) {
    const firstFolder = request.folderPath?.[0]
    if (firstFolder) {
      groups.add(String(firstFolder))
    }
  }

  return Array.from(groups).sort((a, b) => a.localeCompare(b))
}

export const getChildFolders = (requests, currentScope) => {
  const childSet = new Set()

  for (const request of requests) {
    if (!hasFolderPrefix(request.folderPath ?? [], currentScope)) {
      continue
    }

    const nextIndex = currentScope.length
    const nextFolder = request.folderPath?.[nextIndex]
    if (nextFolder) {
      childSet.add(String(nextFolder))
    }
  }

  return Array.from(childSet).sort((a, b) => a.localeCompare(b))
}

export const parseOperationSelection = (input, availableOps) => {
  const normalizedInput = input.trim().toLowerCase()
  if (!normalizedInput || normalizedInput === 'all') {
    return new Set(availableOps)
  }

  const aliasToOperation = {
    get: 'list',
    list: 'list',
    post: 'create',
    create: 'create',
    update: 'update',
    patch: 'update',
    put: 'update',
    delete: 'remove',
    remove: 'remove',
    detail: 'detail',
    getbyid: 'detail',
    getbyparam: 'detail',
    getbyslug: 'detail',
    'get-by-id': 'detail',
    'get-by-slug': 'detail',
    'get/id': 'detail',
    'get/slug': 'detail',
  }

  const tokens = normalizedInput
    .split(/[,|]/)
    .map((token) => token.trim().replace(/\s+/g, ''))
    .filter(Boolean)

  const selected = new Set()
  for (const token of tokens) {
    const numericIndex = Number(token)
    if (
      Number.isInteger(numericIndex) &&
      numericIndex >= 1 &&
      numericIndex <= availableOps.length
    ) {
      selected.add(availableOps[numericIndex - 1])
      continue
    }

    const mapped = aliasToOperation[token]
    if (mapped) {
      selected.add(mapped)
    }
  }

  return new Set(Array.from(selected).filter((op) => availableOps.includes(op)))
}
