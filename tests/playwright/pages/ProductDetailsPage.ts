// Page object for /product/:productId.
import type { Locator, Page } from '@playwright/test';

export class ProductDetailsPage {
  readonly title: Locator;
  readonly productId: Locator;
  readonly price: Locator;
  readonly availability: Locator;
  readonly quantity: Locator;
  readonly goToCart: Locator;
  readonly inCartQuantity: Locator;
  readonly addSuccess: Locator;
  readonly addError: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('product-title');
    this.productId = page.getByTestId('product-id');
    this.price = page.getByTestId('product-price');
    this.availability = page.getByTestId('product-availability');
    this.quantity = page.getByTestId('product-quantity');
    this.goToCart = page.getByTestId('go-to-cart');
    this.inCartQuantity = page.getByTestId('in-cart-quantity');
    this.addSuccess = page.getByTestId('add-to-cart-success');
    this.addError = page.getByTestId('add-to-cart-error');
  }

  async goto(productId: string): Promise<void> {
    await this.page.goto(`/product/${productId}`);
  }

  addToCartButton(productId: string): Locator {
    return this.page.getByTestId(`add-to-cart-${productId}`);
  }

  async addToCart(productId: string, quantity = 1): Promise<void> {
    if (quantity !== 1) await this.quantity.selectOption(String(quantity));
    await this.addToCartButton(productId).click();
  }
}
