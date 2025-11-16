import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type {
  Locator,
  Page,
  TestInfo,
  PageScreenshotOptions,
  LocatorScreenshotOptions,
} from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs', 'screenshots')

const ensureScreenshotDir = (): void => {
  if (!existsSync(SCREENSHOT_DIR)) {
    mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
}

const shouldCapture = (testInfo: TestInfo): boolean =>
  testInfo.project.name === 'chromium'

const resolvePath = (filename: string): string => {
  ensureScreenshotDir()
  return path.join(SCREENSHOT_DIR, filename)
}

export const capturePageScreenshot = async (
  page: Page,
  testInfo: TestInfo,
  filename: string,
  options?: Omit<PageScreenshotOptions, 'path'>,
): Promise<void> => {
  if (!shouldCapture(testInfo)) {
    return
  }
  await page.screenshot({
    fullPage: true,
    ...options,
    path: resolvePath(filename),
  })
}

export const captureLocatorScreenshot = async (
  locator: Locator,
  testInfo: TestInfo,
  filename: string,
  options?: Omit<LocatorScreenshotOptions, 'path'>,
): Promise<void> => {
  if (!shouldCapture(testInfo)) {
    return
  }
  await locator.screenshot({
    ...options,
    path: resolvePath(filename),
  })
}
