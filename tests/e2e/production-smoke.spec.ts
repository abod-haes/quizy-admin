import { expect, test, type Page, type Response } from '@playwright/test'

const BASE_URL = process.env.QUIZY_ADMIN_URL ?? 'https://quizy-admin-gold.vercel.app'
const PHONE = process.env.QUIZY_ADMIN_PHONE
const PASSWORD = process.env.QUIZY_ADMIN_PASSWORD

const pages = [
  ['Dashboard', '/dashboard'],
  ['Ads', '/ads'],
  ['Notifications', '/notifications'],
  ['Page Contents', '/page-contents'],
  ['Points of Sale', '/points-of-sale'],
  ['QR Code Management', '/qr-codes'],
  ['Quiz Builder', '/quiz-builder'],
  ['Quizzes', '/quizzes'],
  ['Question Bank', '/questions'],
  ['Courses', '/courses'],
  ['Course Sessions', '/courses/sessions'],
  ['Course Content', '/courses/content'],
  ['Course Purchases', '/courses/purchases'],
  ['Classes', '/classes'],
  ['Subjects', '/subjects'],
  ['Units', '/units'],
  ['Lessons', '/lessons'],
  ['Resources', '/resources'],
  ['Teachers', '/teachers'],
  ['Students', '/students'],
  ['Admin Employees', '/management-users'],
  ['AI Plans & Analytics', '/ai-chat/settings'],
  ['AI User Subscriptions', '/ai-chat/subscriptions'],
  ['AI Documents', '/ai-chat/documents'],
] as const

type PageFailure = {
  kind: 'pageerror' | 'console' | 'http'
  message: string
}

function shouldTrackResponse(response: Response) {
  const resourceType = response.request().resourceType()
  return ['document', 'xhr', 'fetch'].includes(resourceType) && response.status() >= 400
}

async function login(page: Page) {
  if (!PHONE || !PASSWORD) {
    throw new Error('Missing QUIZY_ADMIN_PHONE or QUIZY_ADMIN_PASSWORD environment variables.')
  }

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#auth-phone')).toBeVisible()
  await expect(page.locator('#auth-password')).toBeVisible()

  await page.locator('#auth-phone').fill(PHONE)
  await page.locator('#auth-password').fill(PASSWORD)
  await page.getByRole('button', { name: /دخول اللوحة|Login|Sign in/i }).click()

  await page.waitForURL(/\/dashboard(?:$|\?)/, { timeout: 20_000 })
}

test('production admin pages are healthy in read-only smoke mode', async ({ page }) => {
  test.setTimeout(180_000)

  await login(page)

  for (const [name, route] of pages) {
    const failures: PageFailure[] = []

    const onPageError = (error: Error) => {
      failures.push({ kind: 'pageerror', message: error.message })
    }
    const onConsole = (message: { type(): string; text(): string }) => {
      if (message.type() === 'error') {
        failures.push({ kind: 'console', message: message.text() })
      }
    }
    const onResponse = (response: Response) => {
      if (shouldTrackResponse(response)) {
        failures.push({
          kind: 'http',
          message: `${response.status()} ${response.request().method()} ${response.url()}`,
        })
      }
    }

    page.on('pageerror', onPageError)
    page.on('console', onConsole)
    page.on('response', onResponse)

    try {
      await test.step(`${name} (${route})`, async () => {
        const response = await page.goto(`${BASE_URL}${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 20_000,
        })

        expect(response, `${name}: no document response`).not.toBeNull()
        expect(response!.status(), `${name}: document returned HTTP ${response!.status()}`).toBeLessThan(400)
        await expect(page.locator('body')).toBeVisible()
        await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined)
        await page.waitForTimeout(700)

        const currentPath = new URL(page.url()).pathname
        expect(currentPath, `${name}: unexpected redirect to ${currentPath}`).not.toBe('/login')

        if (failures.length > 0) {
          const details = failures.map((failure) => `[${failure.kind}] ${failure.message}`).join('\n')
          throw new Error(`FIRST FAIL: ${name} (${route})\n${details}`)
        }
      })
    } finally {
      page.off('pageerror', onPageError)
      page.off('console', onConsole)
      page.off('response', onResponse)
    }
  }
})
