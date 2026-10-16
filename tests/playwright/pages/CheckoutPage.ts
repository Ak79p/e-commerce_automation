// Page object for /checkout (shipping form and order summary). No payment fields exist: Cash on Delivery only.
import type { Locator, Page } from '@playwright/test';
import type { ShippingDetails } from '../test-data/checkout';

const FIELD_IDS: Record<keyof ShippingDetails, string> = {
  fullName: 'checkout-full-name',
  email: 'checkout-email',
  phone: 'checkout-phone',
  addressLine: 'checkout-address',
  city: 'checkout-city',
  state: 'checkout-state',
  postalCode: 'checkout-postal-code',
};

export const SHIPPING_FIELD_ORDER = Object.keys(FIELD_IDS) as (keyof ShippingDetails)[];

export class CheckoutPage {
  readonly heading: Locator;
  readonly form: Locator;
  readonly errorSummary: Locator;
  readonly formError: Locator;
  readonly paymentMethod: Locator;
  readonly submit: Locator;
  readonly backToCart: Locator;
  readonly items: Locator;
  readonly subtotal: Locator;
  readonly delivery: Locator;
  readonly total: Locator;
  readonly emptyCart: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.form = page.getByTestId('checkout-form');
    this.errorSummary = page.getByTestId('checkout-error-summary');
    this.formError = page.getByTestId('checkout-error');
    this.paymentMethod = page.getByTestId('payment-method');
    this.submit = page.getByTestId('checkout-submit');
    this.backToCart = page.getByTestId('back-to-cart');
    this.items = page.getByTestId('checkout-items');
    this.subtotal = page.getByTestId('checkout-subtotal');
    this.delivery = page.getByTestId('checkout-delivery');
    this.total = page.getByTestId('checkout-total');
    this.emptyCart = page.getByTestId('checkout-empty-cart');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  field(name: keyof ShippingDetails): Locator {
    return this.page.getByTestId(FIELD_IDS[name]);
  }

  fieldError(name: keyof ShippingDetails): Locator {
    return this.page.getByTestId(`${FIELD_IDS[name]}-error`);
  }

  item(productId: string): Locator {
    return this.page.getByTestId(`checkout-item-${productId}`);
  }

  itemSubtotal(productId: string): Locator {
    return this.page.getByTestId(`checkout-item-subtotal-${productId}`);
  }

  /** Fills the given fields; the state is a <select>, the rest are text inputs. */
  async fill(details: Partial<ShippingDetails>): Promise<void> {
    for (const name of SHIPPING_FIELD_ORDER) {
      const value = details[name];
      if (value === undefined) continue;
      if (name === 'state') await this.field(name).selectOption(value);
      else await this.field(name).fill(value);
    }
  }

  /** Types a value and moves focus away, which triggers the field's on-blur validation. */
  async enterAndBlur(name: keyof ShippingDetails, value: string): Promise<void> {
    await this.field(name).fill(value);
    await this.field(name).blur();
  }
}
