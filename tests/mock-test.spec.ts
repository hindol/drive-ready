import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { captureLocatorScreenshot } from './utils/doc-screenshots'

const getTodayPracticeCount = async (page: Page) => {
  return page.evaluate(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    try {
      const stored = window.localStorage.getItem('driveready-practice-history-v1')
      if (!stored) {
        return 0
      }
      const parsed = JSON.parse(stored) as Record<string, number>
      return parsed[todayKey] ?? 0
    } catch {
      return 0
    }
  })
}

test.describe('Mock test experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
    })
  })

  test('shows explanation after answering and only surfaces review alert on repeat view', async ({ page }, testInfo) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Mock Test' }).click()

    const reviewAlert = page.locator('.alert-warning:has-text("Review card")')
    await expect(reviewAlert).toHaveCount(0)

    const firstChoice = page.locator('.list-group .list-group-item').first()
    await firstChoice.click()
    await expect(page.locator('.alert-info')).toContainText('Explanation:')
    const mockTestSection = page.locator('#mock-test')
    await captureLocatorScreenshot(mockTestSection, testInfo, 'mock-test-question.png')

    await page.getByRole('button', { name: /Save & Next|Finish Test/ }).click()
    await page.getByRole('button', { name: 'Previous Question' }).click()
    await expect(reviewAlert).toBeVisible()
  })

  test('increments the Daily 10-question habit by one per answered question', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Start Mock Test' }).click()

    const choice = page.locator('.list-group .list-group-item').first()
    await expect(choice).toBeEnabled()
    await choice.click()
    await expect.poll(async () => getTodayPracticeCount(page)).toBe(1)

    const habitCard = page.locator('.card', {
      has: page.getByRole('heading', { name: 'Daily 10-question habit' }),
    })
    await habitCard.scrollIntoViewIfNeeded()
    await expect(habitCard).toContainText('1 / 10 questions')
  })

  test('counts toward the Daily 10-question habit after finishing a set', async ({ page }, testInfo) => {
    const practiceGoal = 3
    const questionCount = 3
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = yesterday.toISOString().slice(0, 10)
    await page.addInitScript((payload: { key: string; goal: number }) => {
      const { key, goal } = payload
      const existing = window.localStorage.getItem('driveready-practice-history-v1')
      const parsed = existing ? (JSON.parse(existing) as Record<string, number>) : {}
      parsed[key] = goal
      window.localStorage.setItem('driveready-practice-history-v1', JSON.stringify(parsed))
    }, { key: yesterdayKey, goal: practiceGoal })
    await page.goto(`/?practiceGoal=${practiceGoal}&mockQuestions=${questionCount}`)
    await page.getByRole('button', { name: 'Start Mock Test' }).click()

    for (let answered = 0; answered < questionCount; answered += 1) {
      const choice = page.locator('.list-group button:enabled').first()
      await choice.waitFor({ state: 'visible' })
      await choice.click()
      const actionButton = page.getByRole('button', {
        name: /Save & Next|Finish Test|Review Complete/,
      })
      await actionButton.waitFor()
      await expect(actionButton).toBeEnabled({ timeout: 10000 })
      await actionButton.click()
      await expect.poll(async () => getTodayPracticeCount(page), {
        timeout: 10000,
      }).toBeGreaterThanOrEqual(answered + 1)
    }

    const habitCard = page.locator('.card', {
      has: page.getByRole('heading', { name: 'Daily 10-question habit' }),
    })
    await habitCard.scrollIntoViewIfNeeded()
    await expect(habitCard).toContainText(
      `${practiceGoal} / ${practiceGoal} questions`,
      { timeout: 15000 },
    )
    await expect(habitCard.locator('span.badge')).toHaveText(/Done/i, {
      timeout: 15000,
    })
    await expect(habitCard).toContainText(
      `We already logged today’s ${practiceGoal} solved questions.`,
    )
    const seededHistoryCount = await page.evaluate(({ key }) => {
      const stored = window.localStorage.getItem('driveready-practice-history-v1')
      if (!stored) {
        return null
      }
      try {
        const parsed = JSON.parse(stored) as Record<string, number>
        return parsed[key] ?? null
      } catch {
        return null
      }
    }, { key: yesterdayKey })
    expect(seededHistoryCount).toBe(practiceGoal)
    const metDay = habitCard.locator(
      '.practice-calendar .practice-day.practice-day--met:not(.practice-day--today)',
    )
    await expect(metDay).toHaveCount(1, { timeout: 15000 })
    await captureLocatorScreenshot(habitCard, testInfo, 'habit-card.png')
  })
})
