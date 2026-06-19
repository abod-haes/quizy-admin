import fs from 'node:fs'
import path from 'node:path'

const [, , rawName] = process.argv

if (!rawName) {
  console.error('Usage: npm run make:module -- <module-name>')
  process.exit(1)
}

const toKebab = (value) =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()

const toPascal = (value) =>
  toKebab(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const toCamel = (value) => {
  const pascal = toPascal(value)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

const name = toKebab(rawName)
const pascal = toPascal(rawName)
const camel = toCamel(rawName)

const baseDir = path.join(process.cwd(), 'src', 'modules', name)
const dirs = [
  'pages',
  path.join('pages', 'form'),
  path.join('pages', 'view'),
  'services',
  'hooks',
  'types',
  'components',
]

for (const dir of dirs) {
  fs.mkdirSync(path.join(baseDir, dir), { recursive: true })
}

const writeFile = (filePath, content) => {
  if (fs.existsSync(filePath)) {
    console.error(`File already exists: ${filePath}`)
    process.exit(1)
  }
  fs.writeFileSync(filePath, content)
}

const pageFile = path.join(baseDir, 'pages', `${name}.page.tsx`)
const formFile = path.join(baseDir, 'pages', 'form', `${name}.form.page.tsx`)
const viewFile = path.join(baseDir, 'pages', 'view', `${name}.view.page.tsx`)
const serviceFile = path.join(baseDir, 'services', `${name}.services.ts`)
const hookFile = path.join(baseDir, 'hooks', `${name}.hook.ts`)
const typeFile = path.join(baseDir, 'types', `${name}.type.ts`)
const componentFile = path.join(baseDir, 'components', `${name}.component.tsx`)

writeFile(
  pageFile,
  `function ${pascal}Page() {\n  return <div>${pascal}Page</div>\n}\n\nexport default ${pascal}Page\n`,
)

writeFile(
  formFile,
  `function ${pascal}FormPage() {\n  return <div>${pascal}FormPage</div>\n}\n\nexport default ${pascal}FormPage\n`,
)

writeFile(
  viewFile,
  `function ${pascal}ViewPage() {\n  return <div>${pascal}ViewPage</div>\n}\n\nexport default ${pascal}ViewPage\n`,
)

writeFile(
  componentFile,
  `export function ${pascal}Component() {\n  return (\n    <section className=\"rounded-md border border-primary/20 bg-white p-6\">\n      <h1 className=\"text-2xl font-semibold\">${pascal}</h1>\n      <p className=\"mt-2 text-sm text-muted-foreground\">Module scaffold ready.</p>\n    </section>\n  )\n}\n`,
)

writeFile(
  serviceFile,
  `export async function get${pascal}() {\n  return null\n}\n`,
)

writeFile(
  hookFile,
  `export function use${pascal}Hook() {\n  return {}\n}\n`,
)

writeFile(
  typeFile,
  `export type ${pascal}Entity = {\n  id: string\n}\n`,
)

const routesPath = path.join(process.cwd(), 'src', 'app', 'router', 'route-object.type.ts')
const appRoutePath = path.join(process.cwd(), 'src', 'app', 'router', 'app.route.ts')

const addRoutes = () => {
  if (!fs.existsSync(routesPath)) return

  const current = fs.readFileSync(routesPath, 'utf8')
  if (current.includes(`${camel}: {`)) return

  let insertBefore = current.indexOf('notFound:')
  if (insertBefore === -1) {
    insertBefore = current.lastIndexOf('} as const')
  }
  if (insertBefore === -1) return

  const routeBlock =
    `  ${camel}: {\n` +
    `    key: '${camel}',\n` +
    `    path: '/${name}',\n` +
    `    protected: false,\n` +
    `    breadcrumbKeys: [],\n` +
    `  },\n` +
    `  add${pascal}: {\n` +
    `    key: 'add${pascal}',\n` +
    `    path: '/${name}/add',\n` +
    `    protected: false,\n` +
    `    breadcrumbKeys: [],\n` +
    `  },\n` +
    `  edit${pascal}: {\n` +
    `    key: 'edit${pascal}',\n` +
    `    path: '/${name}/edit/:id',\n` +
    `    protected: false,\n` +
    `    breadcrumbKeys: [],\n` +
    `  },\n` +
    `  view${pascal}: {\n` +
    `    key: 'view${pascal}',\n` +
    `    path: '/${name}/view/:id',\n` +
    `    protected: false,\n` +
    `    breadcrumbKeys: [],\n` +
    `  },\n\n`

  const updated =
    current.slice(0, insertBefore) + routeBlock + current.slice(insertBefore)
  fs.writeFileSync(routesPath, updated)
}

addRoutes()

const findChildrenArrayCloseIndex = (source) => {
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

const addAppRoute = () => {
  if (!fs.existsSync(appRoutePath)) return

  const current = fs.readFileSync(appRoutePath, 'utf8')
  if (current.includes(`APP_ROUTES.${camel}.path`)) return

  const importLines = [
    `import ${pascal}Page from '@/modules/${name}/pages/${name}.page'`,
    `import ${pascal}FormPage from '@/modules/${name}/pages/form/${name}.form.page'`,
    `import ${pascal}ViewPage from '@/modules/${name}/pages/view/${name}.view.page'`,
  ]

  let withImports = current
  const importMatches = [...current.matchAll(/^import .*$/gm)]
  const lastImport = importMatches[importMatches.length - 1]
  const newImports = importLines.filter((line) => !current.includes(line)).join('\n')

  if (newImports.length > 0 && lastImport) {
    const importInsertAt = lastImport.index + lastImport[0].length + 1
    withImports =
      current.slice(0, importInsertAt) + newImports + '\n' + current.slice(importInsertAt)
  }

  const hasWithRouteAccess = withImports.includes('function withRouteAccess')
  const withElement = (routeKey, componentName) =>
    hasWithRouteAccess
      ? `withRouteAccess('${routeKey}', createElement(${componentName}))`
      : `createElement(${componentName})`

  const childrenCloseIndex = findChildrenArrayCloseIndex(withImports)
  if (childrenCloseIndex === -1) {
    fs.writeFileSync(appRoutePath, withImports)
    return
  }

  const routeBlock =
    `      {\n` +
    `        path: APP_ROUTES.${camel}.path,\n` +
    `        element: ${withElement(camel, `${pascal}Page`)},\n` +
    `      },\n` +
    `      {\n` +
    `        path: APP_ROUTES.add${pascal}.path,\n` +
    `        element: ${withElement(`add${pascal}`, `${pascal}FormPage`)},\n` +
    `      },\n` +
    `      {\n` +
    `        path: APP_ROUTES.edit${pascal}.path,\n` +
    `        element: ${withElement(`edit${pascal}`, `${pascal}FormPage`)},\n` +
    `      },\n` +
    `      {\n` +
    `        path: APP_ROUTES.view${pascal}.path,\n` +
    `        element: ${withElement(`view${pascal}`, `${pascal}ViewPage`)},\n` +
    `      },\n`

  const updated =
    withImports.slice(0, childrenCloseIndex) + routeBlock + withImports.slice(childrenCloseIndex)
  fs.writeFileSync(appRoutePath, updated)
}

addAppRoute()

console.log(`Module created at src/modules/${name}`)
