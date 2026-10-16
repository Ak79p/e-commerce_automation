import { test, expect } from '../fixtures';
import { env } from '../config/env';
import { SEARCH_TERMS, TOTAL_PRODUCTS } from '../test-data';

test.describe('Search UI', () => {
  test('SRCH-UI-001 Header search matches product names partially and case-insensitively', { tag: ['@ui', '@search', '@smoke'] }, async ({ page, header, listingPage }) => {
    const { query, expectedIds } = SEARCH_TERMS.partialName;

    await test.step('S1 Open /', async () => {
      await page.goto('/');
      await expect(header.searchInput).toBeVisible();
    });

    await test.step('S2 Type "HEAD" in product-search', async () => {
      await header.searchInput.fill(query);
      await expect(header.searchInput).toHaveValue('HEAD');
    });

    await test.step('S3 Click search-submit', async () => {
      await header.searchSubmit.click();
      await expect(page).toHaveURL(new URL('/products?q=HEAD', env.baseUrl).href);
      await expect(header.searchInput).toHaveValue('HEAD');
      await expect(listingPage.heading).toHaveText('Search results for "HEAD"');
      await expect(listingPage.resultsCount).toHaveText('1 product');
      await expect(listingPage.cards).toHaveCount(1);
      await expect(listingPage.card('PROD-001')).toBeVisible();
      expect(await listingPage.productIds()).toEqual(expectedIds);
    });
  });

  test('SRCH-UI-003 Search with no matches shows the no-results state', { tag: ['@ui', '@search'] }, async ({ page, header, listingPage, shopping }) => {
    await test.step('S1 Open /', async () => {
      await page.goto('/');
      await expect(header.searchInput).toBeVisible();
    });

    await test.step('S2 Type "zzqx" in product-search and click search-submit', async () => {
      await shopping.search(SEARCH_TERMS.nonexistent);
      await expect(page).toHaveURL(new URL('/products?q=zzqx', env.baseUrl).href);
      await expect(listingPage.resultsCount).toHaveText('0 products');
      await expect(listingPage.noResults).toContainText('No products found');
      await expect(listingPage.noResults).toContainText('We couldn\'t find any products matching "zzqx"');
      await expect(listingPage.grid).toHaveCount(0);
    });

    await test.step('S3 Click clear-search', async () => {
      await listingPage.clearSearch.click();
      await expect(page).toHaveURL(new URL('/products', env.baseUrl).href);
      await expect(listingPage.heading).toHaveText('All Products');
      await expect(listingPage.resultsCount).toHaveText('24 products');
      await expect(listingPage.cards).toHaveCount(TOTAL_PRODUCTS);
    });
  });
});
