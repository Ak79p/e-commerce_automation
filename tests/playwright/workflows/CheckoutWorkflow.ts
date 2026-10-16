// Checkout: filling the shipping form and placing the simulated Cash on Delivery order.
// SAFETY: ShopNest has no payment gateway; "Place order" only writes a demo order to this browser context's
// localStorage. No card or payment data exists in this framework and none may be added.
import { expect, type Page } from '@playwright/test';
import { CheckoutPage, OrderConfirmationPage } from '../pages';
import type { TestLogger } from '../support/logger';
import type { ShippingDetails } from '../test-data/checkout';

export class CheckoutWorkflow {
  private readonly checkout: CheckoutPage;
  private readonly confirmation: OrderConfirmationPage;

  constructor(
    private readonly page: Page,
    private readonly log: TestLogger,
  ) {
    this.checkout = new CheckoutPage(page);
    this.confirmation = new OrderConfirmationPage(page);
  }

  async fillShipping(details: Partial<ShippingDetails>): Promise<void> {
    this.log.info('Fill shipping details', { fields: Object.keys(details), city: details.city, state: details.state });
    await expect(this.checkout.form).toBeVisible();
    await this.checkout.fill(details);
  }

  /** Places the Cash on Delivery order and returns the order ID shown on the confirmation page. */
  async placeOrder(): Promise<string> {
    this.log.info('Place Cash on Delivery order (simulated, no payment)');
    await expect(this.checkout.paymentMethod).toContainText('Cash on Delivery');
    await this.checkout.submit.click();
    await expect(this.confirmation.confirmation, 'the order should be confirmed').toBeVisible();
    const orderId = (await this.confirmation.orderId.textContent())?.trim() ?? '';
    this.log.info('Order placed', { orderId });
    return orderId;
  }
}
