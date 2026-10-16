// Page object for /products (listing and search results).
import type { Locator, Page } from '@playwright/test';

export class ProductListPage {
  readonly heading: Locator;
  /** Results section; `data-query` holds the query the shown results belong to. */
  readonly results: Locator;
  readonly resultsCount: Locator;
  readonly grid: Locator;
  /** Every product card in the grid, in display order. */
  readonly cards: Locator;
  readonly noResults: Locator;
  readonly clearSearch: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('listing-heading');
    this.results = page.getByTestId('search-results');
    this.resultsCount = page.getByTestId('results-count');
    this.grid = page.getByTestId('product-grid');
    this.cards = this.grid.locator('[data-testid^="product-card-"]');
    this.noResults = page.getByTestId('no-results');
    this.clearSearch = page.getByTestId('clear-search');
  }

  async goto(query?: string): Promise<void> {
    await this.page.goto(query ? `/products?q=${encodeURIComponent(query)}` : '/products');
  }

  card(productId: string): Locator {
    return this.page.getByTestId(`product-card-${productId}`);
  }

  productLink(productId: string): Locator {
    return this.page.getByTestId(`product-link-${productId}`);
  }

  price(productId: string): Locator {
    return this.page.getByTestId(`product-price-${productId}`);
  }

  addToCartButton(productId: string): Locator {
    return this.page.getByTestId(`add-to-cart-${productId}`);
  }

  inCart(productId: string): Locator {
    return this.page.getByTestId(`in-cart-${productId}`);
  }

  /** The product IDs of the cards currently shown, in order. */
  async productIds(): Promise<string[]> {
    return this.cards.evaluateAll((cards) => cards.map((c) => c.getAttribute('data-product-id') ?? ''));
  }
}
