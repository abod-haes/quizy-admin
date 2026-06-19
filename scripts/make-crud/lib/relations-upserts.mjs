import fs from 'node:fs'
import { CRUD_RELATIONS_MAP_FILE } from './paths.mjs'

export const upsertCrudRelationEndpoints = (resourceCamel, relations) => {
  const relationEntries = Object.entries(relations ?? {})
  if (!relationEntries.length) {
    return
  }

  const defaultContent = `export const CRUD_RELATION_ENDPOINTS = {\n} as const\n\nexport type CrudRelationResource = keyof typeof CRUD_RELATION_ENDPOINTS\n\nexport function getCrudRelationEndpoint(resource: string, fieldPath: string): string {\n  const resourceMap = (CRUD_RELATION_ENDPOINTS as Record<string, Record<string, string> | undefined>)[resource]\n  if (!resourceMap) {\n    return ''\n  }\n\n  const endpoint = resourceMap[fieldPath]\n  return typeof endpoint === 'string' ? endpoint : ''\n}\n`

  const current = fs.existsSync(CRUD_RELATIONS_MAP_FILE)
    ? fs.readFileSync(CRUD_RELATIONS_MAP_FILE, 'utf8')
    : defaultContent

  if (current.includes(`${resourceCamel}: {`)) {
    return
  }

  const insertAt = current.indexOf('} as const')
  if (insertAt === -1) {
    console.warn('Could not update CRUD_RELATION_ENDPOINTS automatically. Missing "} as const" marker.')
    return
  }

  const body = relationEntries
    .map(([fieldPath, endpoint]) => `    ${JSON.stringify(fieldPath)}: ${JSON.stringify(endpoint)},`)
    .join('\n')

  const block = `  ${resourceCamel}: {\n${body}\n  },\n`

  const prefix = current.slice(0, insertAt)
  const suffix = current.slice(insertAt)
  const updated = `${prefix}${block}${suffix}`

  fs.writeFileSync(CRUD_RELATIONS_MAP_FILE, updated)
}
