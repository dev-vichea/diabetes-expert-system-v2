import { test, expect } from '@playwright/test'

const routes = {
  admin: ['/dashboard', '/users', '/roles-permissions', '/audit-logs', '/patients', '/patients/1', '/review', '/rules', '/profile', '/diagnosis'],
  doctor: ['/dashboard', '/patients', '/patients/1', '/review', '/rules', '/profile', '/diagnosis'],
  patient: ['/dashboard', '/my-results', '/diagnosis/result?diagnosis_result_id=1', '/care-plan', '/guide', '/profile', '/diagnosis'],
  observer: ['/dashboard', '/patients', '/patients/1', '/guide', '/profile'],
}

async function login(page, role) {
  await page.goto('/login')
  await page.locator('#email').fill(`${role}@example.com`)
  await page.locator('#password').fill(`${role}123`)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

for (const role of Object.keys(routes)) {
  for (const mode of ['desktop-en-light', 'mobile-km-dark']) {
    test(`${role}: ${mode} routes render without console or API errors`, async ({ page }) => {
      const errors = []
      const failures = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('response', (response) => {
        if (response.url().includes('/api/') && response.status() >= 400) failures.push(`${response.status()} ${new URL(response.url()).pathname}`)
      })
      await page.setViewportSize(mode.startsWith('mobile') ? { width: 390, height: 844 } : { width: 1440, height: 1000 })
      await page.addInitScript((mode) => {
        localStorage.setItem('app-language', mode.includes('-km-') ? 'km' : 'en')
        localStorage.setItem('theme', mode.endsWith('-dark') ? 'dark' : 'light')
      }, mode)
      await login(page, role)
      for (const route of routes[role]) {
        await page.goto(route)
        await expect(page.locator('main')).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', mode.includes('-km-') ? 'km' : 'en')
        await expect(page.locator('html')).toHaveClass(mode.endsWith('-dark') ? /dark/ : /^(?!.*dark)/)
        await expect(page.locator('main')).not.toContainText('Something went wrong')
        await page.waitForLoadState('networkidle')
        expect(await page.locator('main').innerText()).not.toBe('')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
      }
      expect(failures).toEqual([])
      expect(errors).toEqual([])
    })
  }
}

test('patient cannot enter administration or knowledge-base routes', async ({ page }) => {
  await login(page, 'patient')
  for (const route of ['/users', '/roles-permissions', '/audit-logs', '/rules', '/review']) {
    await page.goto(route)
    await expect(page).toHaveURL(/\/unauthorized$/)
  }
})

test('clinician cannot enter patient-only care plan', async ({ page }) => {
  await login(page, 'doctor')
  await page.goto('/care-plan')
  await expect(page).toHaveURL(/\/unauthorized$/)
})

test('patient can open and refresh the saved care plan and appointment views', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('app-language', 'en'))
  await login(page, 'patient')
  await page.goto('/care-plan')
  await page.getByRole('button', { name: 'Care Plan', exact: true }).click()
  const refreshed = page.waitForResponse((response) =>
    response.url().includes('/diagnosis/1/care-plan') && response.request().method() === 'POST'
  )
  await page.getByRole('button', { name: 'Refresh Plan', exact: true }).click()
  expect((await refreshed).status()).toBe(200)
  await page.getByRole('button', { name: 'Appointments', exact: true }).click()
  await expect(page.locator('main')).not.toContainText('Something went wrong')
})

test('registration, health-profile setup, and logout complete on mobile', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('app-language', 'en'))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/sign-up')
  await page.locator('#name').fill('Browser Registration')
  await page.locator('#email').fill('browser-registration@example.com')
  await page.locator('#password').fill('registration-test-password')
  await page.locator('#confirmPassword').fill('registration-test-password')
  await page.locator('#terms').check()
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/profile-setup$/)
  await page.getByRole('button', { name: 'Male', exact: true }).click()
  await page.locator('input[type="date"]').fill('1990-01-01')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByPlaceholder('170', { exact: true }).fill('170')
  await page.getByPlaceholder('65', { exact: true }).fill('65')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Finish setup', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.getByRole('button', { name: 'User menu', exact: true }).last().click()
  await page.getByText('Log out', { exact: true }).last().click()
  await expect(page).toHaveURL(/\/login$/)
})

test('admin creates a custom role and user, then grants and revokes individual access', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('app-language', 'en'))
  await login(page, 'admin')
  await page.goto('/roles-permissions')
  await page.getByRole('button', { name: 'New Role', exact: true }).click()
  const form = page.locator('#role-permissions-form')
  await form.locator('input').nth(0).fill('browser_reader')
  await form.locator('input').nth(1).fill('Browser regression role')
  await page.getByRole('checkbox', { name: 'View diabetes education guide', exact: true }).check()
  const roleCreated = page.waitForResponse((r) => r.url().endsWith('/admin/roles') && r.request().method() === 'POST')
  await page.locator('button[form="role-permissions-form"]').click()
  expect((await roleCreated).status()).toBe(201)
  await page.goto('/users')
  await page.getByRole('button', { name: 'Add User', exact: true }).click()
  await page.getByPlaceholder('e.g. Sokha Chan or Dr. Sarah Connor').fill('Browser Managed User')
  await page.getByPlaceholder('user@example.com', { exact: true }).fill('browser-managed@example.com')
  await page.getByPlaceholder('At least 6 chars').fill('managed-test-password')
  await page.getByLabel('Assigned Role', { exact: false }).selectOption('browser_reader')
  const userCreated = page.waitForResponse((r) => r.url().endsWith('/admin/users') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Create User', exact: true }).click()
  const response = await userCreated
  expect(response.status()).toBe(201)
  const created = (await response.json()).data
  const loginResponse = await page.request.post('http://127.0.0.1:5002/api/auth/login', { data: { email: 'browser-managed@example.com', password: 'managed-test-password' } })
  const auth = (await loginResponse.json()).data
  const headers = { Authorization: `Bearer ${auth.access_token}` }
  await page.goto(`/users/${created.id}/edit`)
  await page.getByRole('checkbox', { name: 'View rules', exact: true }).check()
  let saved = page.waitForResponse((r) => r.url().endsWith('/access-profile') && r.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Save Changes', exact: true }).first().click()
  let updated = (await (await saved).json()).data
  expect(updated.direct_permissions).toEqual(['rule.view'])
  expect(updated.role_permissions).toEqual(['guide.view'])
  expect((await page.request.get('http://127.0.0.1:5002/api/rules', { headers })).status()).toBe(200)
  await page.goto(`/users/${created.id}/edit`)
  await page.getByRole('checkbox', { name: 'View rules', exact: true }).uncheck()
  saved = page.waitForResponse((r) => r.url().endsWith('/access-profile') && r.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Save Changes', exact: true }).first().click()
  updated = (await (await saved).json()).data
  expect(updated.direct_permissions).toEqual([])
  expect(updated.role_permissions).toEqual(['guide.view'])
  expect((await page.request.get('http://127.0.0.1:5002/api/rules', { headers })).status()).toBe(403)
})

test('clinician signs a review with treatment guidance and the patient is notified', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('app-language', 'en'))
  await login(page, 'doctor')
  await page.goto('/review?diagnosis_result_id=1')

  const note = 'Continue monitoring glucose and schedule a follow-up appointment in two weeks.'
  await page.getByPlaceholder(/Write your clinical evaluation/).fill(note)
  const saved = page.waitForResponse((response) =>
    response.url().endsWith('/diagnosis/1/review') && response.request().method() === 'PATCH'
  )
  await page.getByRole('button', { name: 'Sign & Submit Review', exact: true }).click()
  const response = await saved
  expect(response.status()).toBe(200)
  expect((await response.json()).data.review_note).toBe(note)

  const patientLogin = await page.request.post('http://127.0.0.1:5002/api/auth/login', {
    data: { email: 'patient@example.com', password: 'patient123' },
  })
  const patientAuth = (await patientLogin.json()).data
  const notifications = await page.request.get('http://127.0.0.1:5002/api/notifications', {
    headers: { Authorization: `Bearer ${patientAuth.access_token}` },
  })
  expect(notifications.status()).toBe(200)
  const rows = (await notifications.json()).data.notifications
  expect(rows).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'review', message: expect.stringContaining('Dr. Lina') }),
  ]))
})
