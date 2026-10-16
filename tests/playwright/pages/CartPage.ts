// Page object for /cart. Amounts are read from `data-amount` (whole rupees) rather than formatted text.
import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly heading: Locator;
  readonly items: Locator;
  /** Every cart line, in display order. */
  readonly lines: Locator;
  /** The order-summary card (subtotal label shows the item count). */
  readonly summary: Locator;
  readonly subtotal: Locator;
  readonly delivery: Locator;
  readonly total: Locator;
  /** "Add ₹N more for free delivery.", shown only while delivery is charged. */
  readonly deliveryNote: Locator;
  readonly proceedToCheckout: Locator;
  /** "Continue shopping" below the cart lines (shown while the cart has items). */
  readonly continueShopping: Locator;
  readonly loginNote: Locator;
  readonly emptyCart: Locator;
  /** The "Continue shopping" link of the empty-cart state. */
  readonly emptyCartContinue: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.items = page.getByTestId('cart-items');
    this.lines = this.items.locator('[data-testid^="cart-item-"][data-product-id]');
    this.summary = page.getByTestId('cart-summary');
    this.subtotal = page.getByTestId('cart-subtotal');
    this.delivery = page.getByTestId('cart-delivery');
    this.total = page.getByTestId('cart-total');
    this.deliveryNote = page.getByTestId('cart-delivery-note');
    this.proceedToCheckout = page.getByTestId('proceed-to-checkout');
    this.continueShopping = page.getByRole('region', { name: 'Cart items' }).getByTestId('continue-shopping');
    this.loginNote = page.getByTestId('checkout-login-note');
    this.emptyCart = page.getByTestId('empty-cart');
    this.emptyCartContinue = this.emptyCart.getByTestId('continue-shopping');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart');
  }

  line(productId: string): Locator {
    return this.page.getByTestId(`cart-item-${productId}`);
  }

  unitPrice(productId: string): Locator {
    return this.page.getByTestId(`cart-item-price-${productId}`);
  }

  lineName(productId: string): Locator {
    return this.page.getByTestId(`cart-item-name-${productId}`);
  }

  lineSubtotal(productId: string): Locator {
    return this.page.getByTestId(`cart-item-subtotal-${productId}`);
  }

  quantity(productId: string): Locator {
    return this.page.getByTestId(`cart-quantity-${productId}`);
  }

  quantityError(productId: string): Locator {
    return this.page.getByTestId(`cart-quantity-${productId}-error`);
  }

  /** "Maximum quantity: N", shown when the line is at its limit. */
  maxHint(productId: string): Locator {
    return this.page.getByTestId(`cart-max-${productId}`);
  }

  increase(productId: string): Locator {
    return this.page.getByTestId(`cart-increase-${productId}`);
  }

  decrease(productId: string): Locator {
    return this.page.getByTestId(`cart-decrease-${productId}`);
  }

  removeButton(productId: string): Locator {
    return this.page.getByTestId(`remove-from-cart-${productId}`);
  }

  /** Types a quantity and commits it with Enter (the app commits typed values on Enter or blur). */
  async typeQuantity(productId: string, value: string): Promise<void> {
    await this.quantity(productId).fill(value);
    await this.quantity(productId).press('Enter');
  }
}
