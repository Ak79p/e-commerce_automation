// Layout checks for mobile viewports that don't depend on pixel positions or styling details.
import { expect, type Page } from '@playwright/test';

/** The page fits the viewport width: no horizontal scrolling (the most common mobile layout defect). */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), {
      message: 'page should not scroll horizontally on a mobile viewport',
    })
    .toBeLessThanOrEqual(0);
}
