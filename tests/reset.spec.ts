import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const getSessionPayload = async (page: Page) => {
  const sessionData = await page.evaluate(() => window.localStorage.getItem('driveready-session-v1'))
  return sessionData ? JSON.parse(sessionData) : null
}

const TEST_URL = '/?mockQuestions=2'

test.describe('Progress persistence and reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL)
    await page.evaluate(() => {
      window.localStorage.clear()
    })
    await page.reload()
  })

  test('persists answered questions across reload and allows clearing data', async ({ page }) => {
    await page.goto(TEST_URL)
    await page.getByRole('button', { name: 'Start Mock Test' }).click()

    await expect
      .poll(async () => {
        const session = await getSessionPayload(page)
        return session?.test?.presentedQuestions?.length ?? 0
      })
      .toBeGreaterThan(0)

    const sessionAfterStart = await getSessionPayload(page)
    const firstQuestion = sessionAfterStart?.test?.presentedQuestions?.[0]
    if (!firstQuestion) {
      throw new Error('Presented question was not persisted')
    }
    const correctChoiceIndex = firstQuestion.answerIndex
    const choiceButtons = page.locator('.list-group .list-group-item')
    const correctChoice = choiceButtons.nth(correctChoiceIndex)
    const correctChoiceText = await correctChoice.innerText()
    await correctChoice.click()
    await page.getByRole('button', { name: /Save & Next|Finish Test/ }).click()

    const answeredStat = page.locator('.score-stat-chip', { hasText: 'Answered' })
    const correctStat = page.locator('.score-stat-chip', { hasText: 'Correct' })
    await expect(answeredStat).toContainText('1 / 2')
    await expect(correctStat).toContainText('1')
    await expect.poll(async () => Object.keys((await getSessionPayload(page))?.test?.responses ?? {}).length, {
      message: 'Session responses should capture answered question',
    }).toBeGreaterThan(0)

    await page.reload()
    await expect.poll(async () => Object.keys((await getSessionPayload(page))?.test?.responses ?? {}).length, {
      timeout: 15000,
      message: 'Reloaded session should retain answered question',
    }).toBeGreaterThan(0)
    await expect(answeredStat).toContainText('1 / 2', { timeout: 15000 })
    await expect(correctStat).toContainText('1', { timeout: 15000 })

    await page.getByRole('button', { name: 'Previous Question' }).click()
    const restoredChoice = page.locator('.list-group .list-group-item').nth(correctChoiceIndex)
    await expect(restoredChoice).toBeDisabled()
    await expect(restoredChoice).toContainText(correctChoiceText.trim())
    await expect(restoredChoice.locator('.badge')).toHaveText('Correct')

    await page.getByRole('button', { name: 'Reset Progress' }).click()
    const dialog = page.getByRole('dialog', { name: 'Reset all saved progress?' })
    await dialog.getByRole('button', { name: 'Erase everything' }).click()
    await expect(dialog).toBeHidden()

    await expect(page.locator('.score-stat-chip', { hasText: 'Answered' })).toContainText('0 / 2')
    await expect.poll(async () => (await getSessionPayload(page))?.test, {
      timeout: 5000,
      message: 'Reset should clear persisted test state',
    }).toBeUndefined()
  })
})
