// The aria-live toast region (src/context/NoticeContext.tsx). Each toast holds the message in a <span> plus a
// "×" dismiss button, so messages are read from the span. Toasts auto-dismiss after 5 s; up to 3 are shown.
import type { Locator, Page } from '@playwright/test';

export class ToastRegion {
  readonly messages: Locator;

  constructor(page: Page) {
    this.messages = page.getByTestId('toast').locator('span');
  }

  /** The toast with exactly this message (several toasts can be visible at once). */
  withText(message: string): Locator {
    return this.messages.filter({ hasText: new RegExp(`^${message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
  }
}
