// Page object for the signed-in order history (/orders).
import type { Locator, Page } from '@playwright/test';

export class OrdersPage {
  readonly heading: Locator;
  readonly list: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.list = page.getByTestId('order-list');
  }

  orderRow(orderId: string): Locator {
    return this.page.getByTestId(`order-row-${orderId}`);
  }
}
