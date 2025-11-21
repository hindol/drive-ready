import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { captureLocatorScreenshot } from './utils/doc-screenshots'

declare global {
  interface Window {
    __drivereadySeedKeys?: string[]
  }
}

const getTodayPracticeCount = async (page: Page) => {
  return page.evaluate(() => {
    const detectTimeZone = (): string | undefined => {
      if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
        return undefined
      }
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return undefined
      }
    }
    const getSessionTimeZone = (): string | undefined => {
      const storedSession = window.localStorage.getItem('driveready-session-v1')
      if (!storedSession) {
        return undefined
      }
      try {
        const parsed = JSON.parse(storedSession) as { timeZone?: string }
        return parsed.timeZone
      } catch {
        return undefined
      }
    }
    const getDateKey = (date: Date, timeZone?: string): string => {
      if (
        timeZone &&
        typeof Intl !== 'undefined' &&
        typeof Intl.DateTimeFormat === 'function'
      ) {
        try {
          return new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(date)
        } catch {
          // ignore and use ISO fallback
        }
      }
      return date.toISOString().slice(0, 10)
    }
    const timeZone = getSessionTimeZone() ?? detectTimeZone()
    const todayKey = getDateKey(new Date(), timeZone)
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

const getSessionPayload = async <TSession = Record<string, unknown> | null>(page: Page) => {
  const payload = await page.evaluate(() => window.localStorage.getItem('driveready-session-v1'))
  return payload ? (JSON.parse(payload) as TSession) : null
}

const markSessionWithDayOffset = async (page: Page, offsetDays: number) => {
  await page.evaluate((offset) => {
    const detectTimeZone = (): string | undefined => {
      if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
        return undefined
      }
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return undefined
      }
    }
    const shiftDateKey = (key: string, offsetAmount: number): string => {
      if (!offsetAmount) {
        return key
      }
      const cursor = new Date(`${key}T00:00:00.000Z`)
      cursor.setUTCDate(cursor.getUTCDate() + offsetAmount)
      return cursor.toISOString().slice(0, 10)
    }
    const getDateKey = (date: Date, timeZone?: string): string => {
      if (
        timeZone &&
        typeof Intl !== 'undefined' &&
        typeof Intl.DateTimeFormat === 'function'
      ) {
        try {
          return new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(date)
        } catch {
          // fall back to ISO slicing
        }
      }
      return date.toISOString().slice(0, 10)
    }
    const stored = window.localStorage.getItem('driveready-session-v1')
    if (!stored) {
      return
    }
    try {
      const parsed = JSON.parse(stored) as { timeZone?: string; testDayKey?: string }
      const timeZone = parsed.timeZone ?? detectTimeZone()
      const todayKey = getDateKey(new Date(), timeZone)
      parsed.testDayKey = shiftDateKey(todayKey, offset)
      window.localStorage.setItem('driveready-session-v1', JSON.stringify(parsed))
    } catch {
      // ignore malformed payloads
    }
  }, offsetDays)
}

test.describe('Mock test experience', () => {
  test.beforeEach(async ({ page }) => {
    const sessionMarker = `driveready-test-${Date.now()}-${Math.random()}`
    await page.addInitScript((marker: string) => {
      if (window.name !== marker) {
        window.localStorage.clear()
        window.name = marker
      }
    }, sessionMarker)
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
    const offsets = [-1, -2]
    await page.addInitScript((payload: { offsets: number[]; goal: number }) => {
      const detectTimeZone = (): string | undefined => {
        if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
          return undefined
        }
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
          return undefined
        }
      }
      const getDateKey = (date: Date, timeZone?: string): string => {
        if (
          timeZone &&
          typeof Intl !== 'undefined' &&
          typeof Intl.DateTimeFormat === 'function'
        ) {
          try {
            return new Intl.DateTimeFormat('en-CA', {
              timeZone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(date)
          } catch {
            // ignore
          }
        }
        return date.toISOString().slice(0, 10)
      }
      const shiftKey = (baseKey: string, offset: number): string => {
        if (offset === 0) {
          return baseKey
        }
        const cursor = new Date(`${baseKey}T00:00:00.000Z`)
        cursor.setUTCDate(cursor.getUTCDate() + offset)
        return cursor.toISOString().slice(0, 10)
      }
      const { offsets: dayOffsets, goal } = payload
      const timeZone = detectTimeZone()
      const baseKey = getDateKey(new Date(), timeZone)
      const keys = dayOffsets.map((offset) => shiftKey(baseKey, offset))
      const existing = window.localStorage.getItem('driveready-practice-history-v1')
      const parsed = existing ? (JSON.parse(existing) as Record<string, number>) : {}
      keys.forEach((key) => {
        parsed[key] = goal
      })
      window.localStorage.setItem('driveready-practice-history-v1', JSON.stringify(parsed))
      window.__drivereadySeedKeys = keys
    }, { offsets, goal: practiceGoal })
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
    const { seedKeys, seedValues } = await page.evaluate<{
      seedKeys: string[]
      seedValues: Array<number | null> | null
    }>(() => {
      const stored = window.localStorage.getItem('driveready-practice-history-v1')
      const keys = window.__drivereadySeedKeys ?? []
      if (!stored) {
        return { seedKeys: keys, seedValues: null as number[] | null }
      }
      try {
        const parsed = JSON.parse(stored) as Record<string, number>
        return {
          seedKeys: keys,
          seedValues: keys.map((key: string) => parsed[key] ?? null),
        }
      } catch {
        return { seedKeys: keys, seedValues: null as number[] | null }
      }
    })
    expect(seedValues).toEqual(Array(seedKeys.length).fill(practiceGoal))
    await page.evaluate(() => {
      document
        .querySelectorAll('.practice-day--future .practice-day-dot')
        .forEach((dot) => {
          if (dot instanceof HTMLElement) {
            dot.style.visibility = 'hidden'
          }
        })

      const pastMetDays = Array.from(
        document.querySelectorAll(
          '.practice-calendar .practice-day.practice-day--met:not(.practice-day--today)',
        ),
      )

      pastMetDays.forEach((day, index) => {
        let dot = day.querySelector('.practice-day-dot')
        if (!dot) {
          dot = document.createElement('span')
          dot.className = 'practice-day-dot'
          dot.setAttribute('aria-hidden', 'true')
          day.appendChild(dot)
        }
        if (dot instanceof HTMLElement) {
          dot.style.visibility = index < 2 ? 'visible' : 'hidden'
        }
      })
    })
    await captureLocatorScreenshot(habitCard, testInfo, 'habit-card.png')
  })

  test('automatically restarts mock test progress on a new local day', async ({ page }) => {
    const questionCount = 3
    await page.goto(`/?mockQuestions=${questionCount}`)
    await page.getByRole('button', { name: 'Start Mock Test' }).click()

    const choice = page.locator('.list-group .list-group-item').first()
    await choice.waitFor({ state: 'visible' })
    await choice.click()
    const actionButton = page.getByRole('button', {
      name: /Save & Next|Finish Test|Review Complete/,
    })
    await actionButton.waitFor({ state: 'visible' })
    await expect(actionButton).toBeEnabled()
    await actionButton.click()

    const answeredStat = page.locator('.score-stat-chip', { hasText: 'Answered' })
    await expect(answeredStat).toContainText(`1 / ${questionCount}`)
    await expect
      .poll(async () => {
        const session = (await getSessionPayload(page)) as
          | { test?: { responses?: Record<string, number> } }
          | null
        return Object.keys(session?.test?.responses ?? {}).length
      })
      .toBeGreaterThan(0)

    await markSessionWithDayOffset(page, -1)
    await page.reload()

    const introCardHeading = page.getByRole('heading', {
      name: 'Ready to try the official-style knowledge test?',
    })
    await expect(introCardHeading).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Start Mock Test' })).toBeVisible()
    await expect(answeredStat).toContainText(`0 / ${questionCount}`, {
      timeout: 15000,
    })
    const correctStat = page.locator('.score-stat-chip', { hasText: 'Correct' })
    await expect(correctStat).toContainText('0', { timeout: 15000 })
    await expect
      .poll(async () => getTodayPracticeCount(page), { timeout: 10000 })
      .toBe(1)
  })
})
