import fs from 'node:fs'
import path from 'node:path'
import {
  API_ENDPOINTS_FILE,
  APP_ROUTE_FILE,
  ROUTES_FILE,
  SIDEBAR_DATA_FILE,
} from './paths.mjs'

export const ensureDirectories = (baseDir, includeForm, includeView) => {
  const dirs = [
    'pages',
    'services',
    'hooks',
    'types',
    'components',
    'queries',
    'validations',
  ]

  if (includeForm) {
    dirs.push(path.join('pages', 'form'))
  }

  if (includeView) {
    dirs.push(path.join('pages', 'view'))
  }

  for (const dir of dirs) {
    fs.mkdirSync(path.join(baseDir, dir), { recursive: true })
  }
}

export const writeFile = (filePath, content) => {
  if (fs.existsSync(filePath)) {
    console.error(`File already exists: ${filePath}`)
    process.exit(1)
  }

  fs.writeFileSync(filePath, content)
}

export const upsertApiEndpoints = (resourceCamel, paths) => {
  const defaultContent = `export const API_ENDPOINTS = {\n} as const\n`
  const current = fs.existsSync(API_ENDPOINTS_FILE)
    ? fs.readFileSync(API_ENDPOINTS_FILE, 'utf8')
    : defaultContent

  if (current.includes(`${resourceCamel}: {`)) {
    return
  }

  const insertAt = current.lastIndexOf('} as const')
  if (insertAt === -1) {
    console.warn('Could not update API_ENDPOINTS automatically. Missing "} as const" marker.')
    return
  }

  const optionalEntries = [
    paths.reorder ? `    reorder: '${paths.reorder}',\n` : '',
    paths.addMedia ? `    addMedia: '${paths.addMedia}',\n` : '',
    paths.removeMedia ? `    removeMedia: '${paths.removeMedia}',\n` : '',
  ].join('')

  const block =
    `  ${resourceCamel}: {\n` +
    `    list: '${paths.list}',\n` +
    `    detail: '${paths.detail}',\n` +
    `    create: '${paths.create}',\n` +
    `    update: '${paths.update}',\n` +
    `    remove: '${paths.remove}',\n` +
    optionalEntries +
    `  },\n`

  const prefix = current.slice(0, insertAt)
  const suffix = current.slice(insertAt)

  const trailingWhitespace = prefix.match(/\s*$/)?.[0] ?? ''
  let prefixCore = prefix.slice(0, prefix.length - trailingWhitespace.length)

  if (prefixCore.endsWith('}')) {
    prefixCore += ','
  }

  const normalizedPrefix = prefixCore + trailingWhitespace
  const needsLeadingNewline = !normalizedPrefix.endsWith('\n')
  const updated = `${normalizedPrefix}${needsLeadingNewline ? '\n' : ''}${block}${suffix}`

  fs.writeFileSync(API_ENDPOINTS_FILE, updated)
}

export const findChildrenArrayCloseIndex = (source) => {
  const childrenIndex = source.indexOf('children: [')
  if (childrenIndex === -1) {
    return -1
  }

  const startIndex = source.indexOf('[', childrenIndex)
  if (startIndex === -1) {
    return -1
  }

  let depth = 0
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index]

    if (char === '[') {
      depth += 1
      continue
    }

    if (char === ']') {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

export const findArrayCloseIndex = (source, arrayOpenIndex) => {
  let depth = 0
  for (let index = arrayOpenIndex; index < source.length; index += 1) {
    const char = source[index]

    if (char === '[') {
      depth += 1
      continue
    }

    if (char === ']') {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

export const upsertSidebarPrimaryItem = ({
  id,
  routeKey,
  labelKey,
  includeAdd,
  includeEdit,
  includeView,
  routeParamName,
}) => {
  if (!fs.existsSync(SIDEBAR_DATA_FILE)) {
    return
  }

  let current = fs.readFileSync(SIDEBAR_DATA_FILE, 'utf8')

  if (
    current.includes(`id: '${id}'`) ||
    current.includes(`to: APP_ROUTES.${routeKey}.path`)
  ) {
    return
  }

  if (current.includes("from 'lucide-react'")) {
    current = current.replace(
      /import\s*\{([^}]+)\}\s*from 'lucide-react'/,
      (line, importsChunk) => {
        const imports = importsChunk
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)

        if (!imports.includes('Folder')) {
          imports.push('Folder')
        }

        return `import { ${imports.join(', ')} } from 'lucide-react'`
      }
    )
  } else {
    current = `import { Folder } from 'lucide-react'\n\n${current}`
  }

  const appRoutesImport = "import { APP_ROUTES } from '@/app/router/route-object.type'"
  if (!current.includes(appRoutesImport)) {
    const importMatches = Array.from(current.matchAll(/^import .+$/gm))
    if (importMatches.length) {
      const lastImport = importMatches[importMatches.length - 1]
      const insertAt = (lastImport.index ?? 0) + lastImport[0].length
      current = `${current.slice(0, insertAt)}\n${appRoutesImport}${current.slice(insertAt)}`
    } else {
      current = `${appRoutesImport}\n\n${current}`
    }
  }

  const primaryItemsMarker = 'export const primarySidebarItems: SidebarItem[] = ['
  const primaryItemsIndex = current.indexOf(primaryItemsMarker)
  if (primaryItemsIndex === -1) {
    fs.writeFileSync(SIDEBAR_DATA_FILE, current)
    return
  }

  const primaryAssignmentIndex = current.indexOf('=', primaryItemsIndex)
  const primaryArrayOpenIndex = current.indexOf('[', primaryAssignmentIndex)
  const primaryArrayCloseIndex = findArrayCloseIndex(current, primaryArrayOpenIndex)
  if (primaryArrayOpenIndex === -1 || primaryArrayCloseIndex === -1) {
    fs.writeFileSync(SIDEBAR_DATA_FILE, current)
    return
  }

  const activePaths = [
    includeAdd ? `APP_ROUTES.${routeKey}.path + '/add'` : null,
    includeView ? `APP_ROUTES.${routeKey}.path + '/view/:${routeParamName}'` : null,
    includeEdit ? `APP_ROUTES.${routeKey}.path + '/edit/:${routeParamName}'` : null,
  ].filter(Boolean)

  const sidebarItemBlock =
    `  {\n` +
    `    id: '${id}',\n` +
    `    labelKey: '${labelKey}',\n` +
    `    to: APP_ROUTES.${routeKey}.path,\n` +
    `    icon: Folder,\n` +
    `    end: true,\n` +
    (activePaths.length
      ? `    activeMatch: {\n      include: [${activePaths.join(', ')}],\n    },\n`
      : '') +
    `  },\n`

  const arrayContent = current.slice(primaryArrayOpenIndex + 1, primaryArrayCloseIndex)
  const hasItems = arrayContent.trim().length > 0
  const blockPrefix = hasItems ? '\n' : ''
  const updated =
    current.slice(0, primaryArrayCloseIndex) +
    `${blockPrefix}${sidebarItemBlock}` +
    current.slice(primaryArrayCloseIndex)

  fs.writeFileSync(SIDEBAR_DATA_FILE, updated)
}

export const addRoutes = ({ name, camel, pascal, includeCreate, includeUpdate, includeView, protectedRoutes, routeParamName }) => {
  if (!fs.existsSync(ROUTES_FILE)) {
    return
  }

  const current = fs.readFileSync(ROUTES_FILE, 'utf8')
  if (current.includes(`${camel}: {`)) {
    return
  }

  let insertBefore = current.indexOf('notFound:')
  if (insertBefore === -1) {
    insertBefore = current.lastIndexOf('} as const')
  }

  if (insertBefore === -1) {
    return
  }

  let routeBlock =
    `  ${camel}: {\n` +
    `    key: '${camel}',\n` +
    `    path: '/${name}',\n` +
    `    protected: ${protectedRoutes},\n` +
    `    breadcrumbKeys: [],\n` +
    `  },\n`

  if (includeCreate) {
    routeBlock +=
      `  add${pascal}: {\n` +
      `    key: 'add${pascal}',\n` +
      `    path: '/${name}/add',\n` +
      `    protected: ${protectedRoutes},\n` +
      `    breadcrumbKeys: [],\n` +
      `  },\n`
  }

  if (includeUpdate) {
    routeBlock +=
      `  edit${pascal}: {\n` +
      `    key: 'edit${pascal}',\n` +
      `    path: '/${name}/edit/:${routeParamName}',\n` +
      `    protected: ${protectedRoutes},\n` +
      `    breadcrumbKeys: [],\n` +
      `  },\n`
  }

  if (includeView) {
    routeBlock +=
      `  view${pascal}: {\n` +
      `    key: 'view${pascal}',\n` +
      `    path: '/${name}/view/:${routeParamName}',\n` +
      `    protected: ${protectedRoutes},\n` +
      `    breadcrumbKeys: [],\n` +
      `  },\n`
  }

  routeBlock += '\n'

  const updated = current.slice(0, insertBefore) + routeBlock + current.slice(insertBefore)
  fs.writeFileSync(ROUTES_FILE, updated)
}

export const addAppRoute = ({ name, camel, pascal, includeCreate, includeUpdate, includeView }) => {
  if (!fs.existsSync(APP_ROUTE_FILE)) {
    return
  }

  const current = fs.readFileSync(APP_ROUTE_FILE, 'utf8')
  if (current.includes(`APP_ROUTES.${camel}.path`)) {
    return
  }

  const importLines = [`import ${pascal}Page from '@/modules/${name}/pages/${name}.page'`]

  if (includeCreate || includeUpdate) {
    importLines.push(`import ${pascal}FormPage from '@/modules/${name}/pages/form/${name}.form.page'`)
  }

  if (includeView) {
    importLines.push(`import ${pascal}ViewPage from '@/modules/${name}/pages/view/${name}.view.page'`)
  }

  let withImports = current
  const importMatches = [...current.matchAll(/^import .*$/gm)]
  const lastImport = importMatches[importMatches.length - 1]

  if (lastImport) {
    const importInsertAt = lastImport.index + lastImport[0].length + 1
    const newImports = importLines.filter((line) => !current.includes(line)).join('\n')

    if (newImports) {
      withImports =
        current.slice(0, importInsertAt) + newImports + '\n' + current.slice(importInsertAt)
    }
  }

  const hasWithRouteAccess = withImports.includes('function withRouteAccess')
  const withElement = (routeKey, componentName) =>
    hasWithRouteAccess
      ? `withRouteAccess('${routeKey}', createElement(${componentName}))`
      : `createElement(${componentName})`

  let routeBlock =
    `      {\n` +
    `        path: APP_ROUTES.${camel}.path,\n` +
    `        element: ${withElement(camel, `${pascal}Page`)},\n` +
    `      },\n`

  if (includeCreate) {
    routeBlock +=
      `      {\n` +
      `        path: APP_ROUTES.add${pascal}.path,\n` +
      `        element: ${withElement(`add${pascal}`, `${pascal}FormPage`)},\n` +
      `      },\n`
  }

  if (includeUpdate) {
    routeBlock +=
      `      {\n` +
      `        path: APP_ROUTES.edit${pascal}.path,\n` +
      `        element: ${withElement(`edit${pascal}`, `${pascal}FormPage`)},\n` +
      `      },\n`
  }

  if (includeView) {
    routeBlock +=
      `      {\n` +
      `        path: APP_ROUTES.view${pascal}.path,\n` +
      `        element: ${withElement(`view${pascal}`, `${pascal}ViewPage`)},\n` +
      `      },\n`
  }

  const childrenCloseIndex = findChildrenArrayCloseIndex(withImports)
  if (childrenCloseIndex === -1) {
    fs.writeFileSync(APP_ROUTE_FILE, withImports)
    return
  }

  const updated =
    withImports.slice(0, childrenCloseIndex) + routeBlock + withImports.slice(childrenCloseIndex)

  fs.writeFileSync(APP_ROUTE_FILE, updated)
}
