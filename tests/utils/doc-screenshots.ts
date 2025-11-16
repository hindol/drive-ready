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

type CombinedScreenshotOptions = {
  padding?: number
}

export const captureCombinedScreenshot = async (
  page: Page,
  testInfo: TestInfo,
  filename: string,
  locators: Locator[],
  options: CombinedScreenshotOptions = {},
): Promise<void> => {
  if (!shouldCapture(testInfo)) {
    return
  }
  const boxes = await Promise.all(locators.map((locator) => locator.boundingBox()))
  if (boxes.some((box) => !box)) {
    return
  }
  const nonNullBoxes = boxes as Array<NonNullable<(typeof boxes)[number]>>
  const padding = options.padding ?? 12
  const minX = Math.max(Math.min(...nonNullBoxes.map((box) => box.x)) - padding, 0)
  const minY = Math.max(Math.min(...nonNullBoxes.map((box) => box.y)) - padding, 0)
  const maxX = Math.max(...nonNullBoxes.map((box) => box.x + box.width)) + padding
  const maxY = Math.max(...nonNullBoxes.map((box) => box.y + box.height)) + padding
  const viewport = page.viewportSize()
  const clipWidth = viewport ? Math.min(maxX - minX, viewport.width - minX) : maxX - minX
  const clipHeight = viewport ? Math.min(maxY - minY, viewport.height - minY) : maxY - minY
  if (clipWidth <= 0 || clipHeight <= 0) {
    return
  }
  await page.screenshot({
    path: resolvePath(filename),
    clip: {
      x: minX,
      y: minY,
      width: clipWidth,
      height: clipHeight,
    },
  })
}
