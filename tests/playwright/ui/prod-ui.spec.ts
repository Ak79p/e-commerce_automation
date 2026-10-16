import { test, expect } from '../fixtures';
import { env } from '../config/env';
import { readCart } from '../support/appStorage';
import { PRODUCTS } from '../test-data';

test.describe('Product UI', () => {
  test('PROD-UI-001 Selecting a product from the listing opens its details page with the correct data', { tag: ['@ui', '@product', '@smoke'] }, async ({ page, listingPage, productPage }) => {
    const product = PRODUCTS.wirelessHeadphones;

    await test.step('S1 Open /products', async () => {
      await listingPage.goto();
      await expect(listingPage.card(product.id)).toBeVisible();
      // The listing shows the same price the details page must show.
      await expect(listingPage.price(product.id)).toHaveAttribute('data-price', String(product.price));
    });

    await test.step('S2 Click product-link-PROD-001', async () => {
      await listingPage.productLink(product.id).click();
      await expect(page).toHaveURL(new URL('/product/PROD-001', env.baseUrl).href);
      await expect(productPage.title).toHaveText('Wireless Headphones');
      await expect(productPage.productId).toHaveText('PROD-001');
      await expect(productPage.price).toHaveText('₹2,999');
      await expect(productPage.price).toHaveAttribute('data-price', '2999');
      await expect(productPage.availability).toHaveText('In stock');
    });
  });

  test('PROD-UI-004 Adding a chosen quantity from the details page updates the cart', { tag: ['@ui', '@product', '@cart'] }, async ({ page, productPage, header }) => {
    const product = PRODUCTS.wirelessHeadphones;

    await test.step('S1 Open /product/PROD-001', async () => {
      await productPage.goto(product.id);
      await expect(productPage.title).toHaveText(product.name);
      await expect(header.cartCount).toHaveText('0');
    });

    await test.step('S2 Select 3 in product-quantity', async () => {
      await productPage.quantity.selectOption('3');
      await expect(productPage.quantity).toHaveValue('3');
    });

    await test.step('S3 Click add-to-cart-PROD-001', async () => {
      await productPage.addToCartButton(product.id).click();
      await expect(productPage.addSuccess).toHaveText('Added 3 × Wireless Headphones to your cart.');
      await expect(header.cartCount).toHaveText('3');
      await expect(productPage.inCartQuantity).toHaveText('3 already in your cart.');
      await expect(productPage.goToCart).toHaveText('Go to cart (3)');
      await expect(productPage.quantity).toHaveValue('1');
      expect(await readCart(page)).toEqual([{ productId: 'PROD-001', quantity: 3 }]);
    });
  });
});
