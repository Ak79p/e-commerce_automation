// Component object for the site header: account navigation, search and the cart link.
import type { Locator, Page } from '@playwright/test';

export class HeaderComponent {
  readonly brandLink: Locator;
  /** "Hello, <first name>", rendered only when signed in. */
  readonly greeting: Locator;
  readonly ordersLink: Locator;
  readonly logoutButton: Locator;
  /** Rendered only when signed out (absent from the DOM otherwise). */
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly searchInput: Locator;
  readonly searchSubmit: Locator;
  readonly cartLink: Locator;
  readonly cartCount: Locator;

  constructor(private readonly page: Page) {
    this.brandLink = page.getByTestId('brand-link');
    this.greeting = page.getByTestId('user-greeting');
    this.ordersLink = page.getByTestId('orders-link');
    this.logoutButton = page.getByTestId('logout-button');
    this.loginLink = page.getByTestId('login-link');
    this.registerLink = page.getByTestId('register-link');
    this.searchInput = page.getByTestId('product-search');
    this.searchSubmit = page.getByTestId('search-submit');
    this.cartLink = page.getByTestId('cart-link');
    this.cartCount = page.getByTestId('cart-count');
  }

  /** Category navigation link, e.g. `categoryLink('electronics')`. */
  categoryLink(slug: string): Locator {
    return this.page.getByTestId(`category-link-${slug}`);
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchSubmit.click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async signOut(): Promise<void> {
    await this.logoutButton.click();
  }
}
