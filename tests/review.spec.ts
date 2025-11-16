import { expect, test, Page } from '@playwright/test'

const clearState = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })
}

test.describe('Smart Review experience', () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page)
  })

  test('runs a review session end-to-end', async ({ page }) => {
    await page.goto('/')
    await page.locator('#review').scrollIntoViewIfNeeded()
    const startButton = page.getByRole('button', { name: 'Start Smart Review' })
    await expect(startButton).toBeEnabled()
    await startButton.click()

    const cardBadge = page.locator('#review .badge', { hasText: /Card 1 of/ })
    await expect(cardBadge).toBeVisible()

  const firstChoice = page.locator('#review .list-group .list-group-item').first()
  await firstChoice.click()
  const explanationAlert = page.locator('#review .alert-info').first()
  await expect(explanationAlert).toContainText('Explanation:', { timeout: 10000 })

    await page.getByRole('button', { name: 'Good' }).click()
    await expect(
      page.locator('#review').getByText(/Card 2 of|Session complete/, { exact: false }),
    ).toBeVisible()
  })
})
