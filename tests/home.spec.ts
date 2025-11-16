import { test, expect } from '@playwright/test'
import { captureLocatorScreenshot } from './utils/doc-screenshots'

test.describe('DriveReady landing page', () => {
  test('shows hero content and nav anchors', async ({ page }, testInfo) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Washington Driving Test Mock Exam Suite' })).toBeVisible()
    await expect(page.getByRole('navigation')).toContainText('Mock Test')
    await expect(page.getByRole('link', { name: 'Start Practicing' })).toBeVisible()
    const heroSection = page.locator('.hero-section')
    await expect(heroSection).toBeVisible()
    await captureLocatorScreenshot(heroSection, testInfo, 'landing-hero.png')
  })

  test('reset progress modal can be opened and dismissed', async ({ page }, testInfo) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Reset Progress' }).click()
    const dialog = page.getByRole('dialog', { name: 'Reset all saved progress?' })
    await expect(dialog).toBeVisible()
  await expect(dialog.getByText('This action cannot be undone.')).toBeVisible()
  await captureLocatorScreenshot(dialog, testInfo, 'reset-modal.png')

    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
  })
})
