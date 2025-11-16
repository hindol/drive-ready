import { expect, test } from '@playwright/test'

test.describe('Mock test experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
    })
  })

  test('shows explanation after answering and only surfaces review alert on repeat view', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Mock Test' }).click()

    const reviewAlert = page.locator('.alert-warning:has-text("Review card")')
    await expect(reviewAlert).toHaveCount(0)

    const firstChoice = page.locator('.list-group .list-group-item').first()
    await firstChoice.click()
    await expect(page.locator('.alert-info')).toContainText('Explanation:')

    await page.getByRole('button', { name: /Save & Next|Finish Test/ }).click()
    await page.getByRole('button', { name: 'Previous Question' }).click()
    await expect(reviewAlert).toBeVisible()
  })

  test('counts toward the Daily 10-question habit after finishing a set', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Mock Test' }).click()

    for (let index = 0; index < 10; index += 1) {
      const choice = page.locator('.list-group .list-group-item').first()
      await choice.waitFor()
      await choice.click()
      const actionButton = page.getByRole('button', {
        name: /Save & Next|Finish Test|Review Complete/,
      })
      await actionButton.waitFor()
      if (!(await actionButton.isEnabled())) {
        break
      }
      await actionButton.click()
    }

    const habitCard = page.locator('.card', {
      has: page.getByRole('heading', { name: 'Daily 10-question habit' }),
    })
    await habitCard.scrollIntoViewIfNeeded()
    await expect(habitCard.locator('span.badge')).toHaveText(/Done/i)
    await expect(habitCard).toContainText('10 / 10 questions')
    await expect(habitCard).toContainText('We already logged today’s 10 solved questions.')
  })
})
