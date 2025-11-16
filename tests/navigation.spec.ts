import { expect, test } from '@playwright/test'

test.describe('Navigation and accessibility details', () => {
  test('CTA jumps to Mock Test and image alt text is present', async ({ page }) => {
    await page.goto('/')

    const startPracticing = page.getByRole('link', { name: 'Start Practicing' })
    await startPracticing.click()
    await page.waitForFunction(() => window.location.hash === '#mock-test')
    await expect(page.locator('#mock-test')).toBeInViewport()

    await page.getByRole('button', { name: 'Start Mock Test' }).click()
    const image = page.locator('.question-image-frame img').first()
    if ((await image.count()) && (await image.isVisible())) {
      await expect(image).toHaveAttribute('alt', /MUTCD|Road sign/)
      const src = await image.getAttribute('src')
      expect(src).toMatch(/^https:\/\/upload\.wikimedia\.org/)
    }
  })
})
