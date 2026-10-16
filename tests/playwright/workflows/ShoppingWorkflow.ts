// Searching, selecting products and adding them to the cart through the storefront UI.
import { expect, type Page } from '@playwright/test';
import { HeaderComponent, ProductDetailsPage, ProductListPage } from '../pages';
import type { TestLogger } from '../support/logger';

export class ShoppingWorkflow {
  private readonly header: HeaderComponent;
  private readonly listing: ProductListPage;
  private readonly details: ProductDetailsPage;

  constructor(
    private readonly page: Page,
    private readonly log: TestLogger,
  ) {
    this.header = new HeaderComponent(page);
    this.listing = new ProductListPage(page);
    this.details = new ProductDetailsPage(page);
  }

  /**
   * Searches from the header; resolves once the results for THIS query (or its no-results state) have loaded.
   * The results section is tagged with the query it shows, and the count is hidden while loading, so a
   * previous search's results can never satisfy the wait.
   */
  async search(query: string): Promise<void> {
    this.log.info('Search', { query });
    await this.header.search(query);
    await expect(this.listing.results, 'results should belong to the new query').toHaveAttribute('data-query', query.trim());
    await expect(this.listing.resultsCount, 'search results should load').toBeVisible();
  }

  /** Opens a product's details page from a listing card; resolves once the product has loaded. */
  async openProduct(productId: string): Promise<void> {
    this.log.info('Open product', { productId });
    await this.listing.productLink(productId).click();
    await expect(this.details.productId).toHaveText(productId);
  }

  /**
   * Clicks a listing card's "Add to cart" `times` times; resolves once the header count has grown by `times`.
   * Used both as a test action and to put the cart in a known state through the UI.
   */
  async addFromListing(productId: string, times = 1): Promise<void> {
    if (!(await this.listing.card(productId).isVisible())) {
      await this.listing.goto();
    }
    const before = Number(await this.header.cartCount.textContent());
    this.log.info('Add from listing', { productId, times, cartCountBefore: before });
    for (let i = 1; i <= times; i += 1) {
      await this.listing.addToCartButton(productId).click();
      await expect(this.header.cartCount).toHaveText(String(before + i));
    }
  }

  /** Adds a quantity from the details page that is already open; resolves once the success message shows. */
  async addFromDetails(productId: string, quantity = 1): Promise<void> {
    this.log.info('Add from details', { productId, quantity });
    await this.details.addToCart(productId, quantity);
    await expect(this.details.addSuccess).toBeVisible();
  }
}
