// Page object for the home page (/).
import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly root: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('home-page');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
