import { expect, test, Page } from '@playwright/test'

const getSessionPayload = async (page: Page) => {
  const sessionData = await page.evaluate(() => window.localStorage.getItem('driveready-session-v1'))
  return sessionData ? JSON.parse(sessionData) : null
}

test.describe('Progress persistence and reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.clear()
    })
    await page.reload()
  })

  test('persists answered questions across reload and allows clearing data', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Mock Test' }).click()

    const choice = page.locator('.list-group .list-group-item').first()
    await choice.click()
    await page.getByRole('button', { name: /Save & Next|Finish Test/ }).click()

    const answeredStat = page.locator('.score-stat-chip', { hasText: 'Answered' })
    await expect(answeredStat).toContainText('1 / 10')
    await expect.poll(async () => Object.keys((await getSessionPayload(page))?.test?.responses ?? {}).length, {
      message: 'Session responses should capture answered question',
    }).toBeGreaterThan(0)

    await page.reload()
    await expect.poll(async () => Object.keys((await getSessionPayload(page))?.test?.responses ?? {}).length, {
      timeout: 15000,
      message: 'Reloaded session should retain answered question',
    }).toBeGreaterThan(0)
    await expect(answeredStat).toContainText('1 / 10', { timeout: 15000 })

    await page.getByRole('button', { name: 'Reset Progress' }).click()
    const dialog = page.getByRole('dialog', { name: 'Reset all saved progress?' })
    await dialog.getByRole('button', { name: 'Erase everything' }).click()
    await expect(dialog).toBeHidden()

    await expect(page.locator('.score-stat-chip', { hasText: 'Answered' })).toContainText('0 / 10')
    await expect.poll(async () => (await getSessionPayload(page))?.test, {
      timeout: 5000,
      message: 'Reset should clear persisted test state',
    }).toBeUndefined()
  })
})
