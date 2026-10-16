import { test, expect, signedIn } from '../fixtures';
import { env } from '../config/env';
import { PRODUCTS } from '../test-data';

test.describe('Navigation UI', () => {
  test.use(signedIn);

  test('NAV-UI-001 Header and in-page links move between home, listing, product, cart, checkout and orders', { tag: ['@ui', '@navigation'] }, async ({ page, header, homePage, listingPage, productPage, cartPage, checkoutPage, ordersPage }) => {
    const url = (path: string) => new URL(path, env.baseUrl).href;
    const headphones = PRODUCTS.wirelessHeadphones;

    await test.step('S1 Open / and click category-link-electronics', async () => {
      await page.goto('/');
      await header.categoryLink('electronics').click();
      await expect(page).toHaveURL(url('/products?category=electronics'));
      await expect(listingPage.heading).toHaveText('Electronics');
      await expect(listingPage.resultsCount).toHaveText('5 products');
    });

    await test.step('S2 Click product-link-PROD-001', async () => {
      await listingPage.productLink(headphones.id).click();
      await expect(page).toHaveURL(url('/product/PROD-001'));
      await expect(productPage.title).toHaveText('Wireless Headphones');
    });

    await test.step('S3 Click add-to-cart-PROD-001, then click go-to-cart', async () => {
      await productPage.addToCartButton(headphones.id).click();
      await productPage.goToCart.click();
      await expect(page).toHaveURL(url('/cart'));
      await expect(cartPage.line('PROD-001')).toBeVisible();
    });

    await test.step('S4 Click proceed-to-checkout', async () => {
      await cartPage.proceedToCheckout.click();
      await expect(page).toHaveURL(url('/checkout'));
      await expect(checkoutPage.form).toBeVisible();
    });

    await test.step('S5 Click back-to-cart', async () => {
      await checkoutPage.backToCart.click();
      await expect(page).toHaveURL(url('/cart'));
    });

    await test.step('S6 Click continue-shopping', async () => {
      await cartPage.continueShopping.click();
      await expect(page).toHaveURL(url('/products'));
      await expect(listingPage.heading).toHaveText('All Products');
    });

    await test.step('S7 Click brand-link', async () => {
      await header.brandLink.click();
      await expect(page).toHaveURL(url('/'));
      await expect(homePage.root).toBeVisible();
    });

    await test.step('S8 Click cart-link', async () => {
      await header.openCart();
      await expect(page).toHaveURL(url('/cart'));
      await expect(cartPage.heading).toHaveText('Shopping Cart');
    });

    await test.step('S9 Click orders-link', async () => {
      await header.ordersLink.click();
      await expect(page).toHaveURL(url('/orders'));
      await expect(ordersPage.heading).toHaveText('My Orders');
    });
  });
});
