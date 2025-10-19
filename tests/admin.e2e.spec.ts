import { test, expect } from '@playwright/test'

const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL ?? process.env.ADMIN_E2E_EMAIL ?? ''
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? process.env.ADMIN_E2E_PASSWORD ?? ''

const hasAdminCredentials = adminEmail.length > 0 && adminPassword.length > 0

function resolveBaseUrl(baseURL: string | undefined) {
  if (!baseURL) {
    throw new Error('Playwright baseURL is not configured. Set PLAYWRIGHT_BASE_URL to the deployed site or run with PLAYWRIGHT_START_SERVER=true for local tests.')
  }
  return baseURL
}

test.describe('Admin dashboard access', () => {
  test('redirects unauthenticated visitors to the login page', async ({ page, baseURL }) => {
    const url = new URL('/dashboard', resolveBaseUrl(baseURL))
    await page.goto(url.toString())
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in to the dashboard' })).toBeVisible()
  })

  test.skip(!hasAdminCredentials, 'Admin E2E credentials are not configured')

  test('allows an admin to sign in and view the dashboard', async ({ page, baseURL }) => {
    const resolvedBaseUrl = resolveBaseUrl(baseURL)

    await page.goto(new URL('/login', resolvedBaseUrl).toString())
    await page.getByLabel('Email').fill(adminEmail)
    await page.getByLabel('Password').fill(adminPassword)

    await Promise.all([
      page.waitForURL(/\/dashboard/),
      page.getByRole('button', { name: 'Sign in' }).click()
    ])

    await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Operations dashboard' })).toBeVisible()
  const dashboardHeader = page.locator('header').filter({ hasText: 'Operations dashboard' })
  await expect(dashboardHeader).toContainText(adminEmail)
  await expect(dashboardHeader.locator('nav')).toContainText('Overview')

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Security baseline', () => {
  test('applies hardened response headers', async ({ request, baseURL }) => {
    const response = await request.get(new URL('/', resolveBaseUrl(baseURL)).toString())
    expect(response.status()).toBe(200)

    const csp = response.headers()['content-security-policy']
    expect(csp, 'Content-Security-Policy header').toBeTruthy()
    expect(csp).toContain("default-src 'self'")

    const hsts = response.headers()['strict-transport-security']
    expect(hsts, 'Strict-Transport-Security header').toBeTruthy()
    expect(hsts).toContain('max-age=')

    const frameOptions = response.headers()['x-frame-options']
    expect(frameOptions).toBe('DENY')
  })
})
