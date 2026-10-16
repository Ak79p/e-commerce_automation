// Page object for /order-confirmation/:orderId (the simulated Cash on Delivery confirmation) and /orders.
import type { Locator, Page } from '@playwright/test';

export class OrderConfirmationPage {
  readonly confirmation: Locator;
  readonly orderId: Locator;
  readonly items: Locator;
  /** Every order line, in display order. */
  readonly lines: Locator;
  readonly subtotal: Locator;
  readonly delivery: Locator;
  readonly total: Locator;
  readonly shippingAddress: Locator;
  readonly email: Locator;
  readonly viewOrders: Locator;
  readonly notFound: Locator;

  constructor(private readonly page: Page) {
    this.confirmation = page.getByTestId('order-confirmation');
    this.orderId = page.getByTestId('order-id');
    this.items = page.getByTestId('order-items');
    this.lines = this.items.locator('[data-testid^="order-item-"]');
    this.subtotal = page.getByTestId('order-subtotal');
    this.delivery = page.getByTestId('order-delivery');
    this.total = page.getByTestId('order-total');
    this.shippingAddress = page.getByTestId('order-shipping-address');
    this.email = page.getByTestId('order-email');
    this.viewOrders = page.getByTestId('view-orders');
    this.notFound = page.getByTestId('order-not-found');
  }

  item(productId: string): Locator {
    return this.page.getByTestId(`order-item-${productId}`);
  }

  orderRow(orderId: string): Locator {
    return this.page.getByTestId(`order-row-${orderId}`);
  }
}
