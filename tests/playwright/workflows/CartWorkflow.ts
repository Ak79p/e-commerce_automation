// Cart operations: putting the cart in a known state, changing quantities and removing lines.
import { expect, type Page } from '@playwright/test';
import { CartPage, HeaderComponent } from '../pages';
import type { TestLogger } from '../support/logger';
import { ShoppingWorkflow } from './ShoppingWorkflow';

export class CartWorkflow {
  private readonly cart: CartPage;
  private readonly header: HeaderComponent;
  private readonly shopping: ShoppingWorkflow;

  constructor(
    private readonly page: Page,
    private readonly log: TestLogger,
  ) {
    this.cart = new CartPage(page);
    this.header = new HeaderComponent(page);
    this.shopping = new ShoppingWorkflow(page, log);
  }

  /**
   * Prerequisite helper: adds products with their "Add to cart" buttons on /products, in this test's own
   * browser context, then opens /cart and checks the quantities.
   */
  async prepare(items: ReadonlyArray<{ productId: string; quantity: number }>): Promise<void> {
    await this.page.goto('/products');
    for (const { productId, quantity } of items) await this.shopping.addFromListing(productId, quantity);
    await this.cart.goto();
    for (const { productId, quantity } of items) await expect(this.cart.quantity(productId)).toHaveValue(String(quantity));
  }

  async increase(productId: string): Promise<void> {
    this.log.info('Increase quantity', { productId });
    await this.cart.increase(productId).click();
  }

  async decrease(productId: string): Promise<void> {
    this.log.info('Decrease quantity', { productId });
    await this.cart.decrease(productId).click();
  }

  async setQuantity(productId: string, value: string): Promise<void> {
    this.log.info('Type quantity', { productId, value });
    await this.cart.typeQuantity(productId, value);
  }

  async remove(productId: string): Promise<void> {
    this.log.info('Remove line', { productId });
    await this.cart.removeButton(productId).click();
    await expect(this.cart.line(productId)).toHaveCount(0);
  }

  async proceedToCheckout(): Promise<void> {
    this.log.info('Proceed to checkout');
    await this.cart.proceedToCheckout.click();
  }

  get cartCount() {
    return this.header.cartCount;
  }
}
