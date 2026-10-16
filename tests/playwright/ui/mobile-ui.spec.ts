// Mobile browser tests (Playwright device emulation: Pixel 7 / Chromium and iPhone 14 / WebKit).
// Every test is tagged @mobile, so it runs only in the mobile-chrome and mobile-safari projects, once per device.
// Controls are operated with tap() to exercise touch input.
import { test, expect, signedIn } from '../fixtures';
import { env } from '../config/env';
import { expectNoHorizontalScroll } from '../support/layout';
import { readCart, readOrders } from '../support/appStorage';
import { PRODUCTS } from '../test-data';

const url = (path: string) => new URL(path, env.baseUrl).href;
const bottle = PRODUCTS.waterBottle; // PROD-004, ₹649
const book = PRODUCTS.monsoonGarden; // PROD-017, ₹349 (+ ₹40 delivery)

test.describe('Mobile storefront (signed out)', () => {
  test('MOB-UI-001 Storefront loads on a phone and the header and category navigation are usable', { tag: ['@mobile', '@smoke'] }, async ({ page, header, homePage, listingPage }) => {
    await test.step('S1 Open /', async () => {
      await homePage.goto();
      await expect(homePage.root).toBeVisible();
      await expectNoHorizontalScroll(page);
      for (const control of [header.brandLink, header.searchInput, header.searchSubmit, header.loginLink, header.cartLink]) {
        await expect(control).toBeInViewport();
      }
      await expect(header.cartCount).toHaveText('0');
    });

    await test.step('S2 Tap the Electronics category', async () => {
      await header.categoryLink('electronics').tap();
      await expect(page).toHaveURL(url('/products?category=electronics'));
      await expect(listingPage.heading).toHaveText('Electronics');
      await expect(listingPage.resultsCount).toHaveText('5 products');
      await expect(listingPage.cards).toHaveCount(5);
      await expectNoHorizontalScroll(page);
    });

    await test.step('S3 Tap the brand link to return home', async () => {
      await header.brandLink.tap();
      await expect(page).toHaveURL(url('/'));
      await expect(homePage.root).toBeVisible();
    });
  });

  test('MOB-UI-002 Header search on a phone returns the matching product only', { tag: ['@mobile', '@smoke'] }, async ({ page, header, homePage, listingPage }) => {
    await homePage.goto();

    await test.step('S1 Type "HEAD" and tap search', async () => {
      await header.searchInput.tap();
      await header.searchInput.fill('HEAD');
      await header.searchSubmit.tap();
      await expect(page).toHaveURL(url('/products?q=HEAD'));
      await expect(listingPage.heading).toHaveText('Search results for "HEAD"');
      await expect(listingPage.resultsCount).toHaveText('1 product');
      await expect(listingPage.cards).toHaveCount(1);
      await expect(listingPage.card('PROD-001')).toBeInViewport();
      await expectNoHorizontalScroll(page);
    });

    await test.step('S2 Search for a product that does not exist', async () => {
      await header.searchInput.fill('zzqx');
      await header.searchSubmit.tap();
      await expect(listingPage.results).toHaveAttribute('data-query', 'zzqx');
      await expect(listingPage.resultsCount).toHaveText('0 products');
      await expect(listingPage.noResults).toContainText('No products found');
      await expect(listingPage.grid).toHaveCount(0);
    });
  });

  test('MOB-UI-003 Product listing and product details are usable at phone size', { tag: ['@mobile'] }, async ({ page, listingPage, productPage, header }) => {
    const headphones = PRODUCTS.wirelessHeadphones;

    await test.step('S1 Open /products', async () => {
      await listingPage.goto();
      await expect(listingPage.resultsCount).toHaveText('24 products');
      await expect(listingPage.cards).toHaveCount(24);
      await expect(listingPage.price(headphones.id)).toHaveAttribute('data-price', '2999');
      await expectNoHorizontalScroll(page);
    });

    await test.step('S2 Tap the Wireless Headphones card', async () => {
      await listingPage.productLink(headphones.id).tap();
      await expect(page).toHaveURL(url('/product/PROD-001'));
      await expect(productPage.title).toHaveText('Wireless Headphones');
      await expect(productPage.price).toHaveText('₹2,999');
      await expect(productPage.availability).toHaveText('In stock');
      await expectNoHorizontalScroll(page);
    });

    await test.step('S3 Choose quantity 2 and tap Add to cart', async () => {
      await productPage.quantity.selectOption('2');
      const addButton = productPage.addToCartButton(headphones.id);
      await addButton.scrollIntoViewIfNeeded();
      await expect(addButton).toBeInViewport();
      await addButton.tap();
      await expect(productPage.addSuccess).toHaveText('Added 2 × Wireless Headphones to your cart.');
      await expect(header.cartCount).toHaveText('2');
      await expect(productPage.goToCart).toHaveText('Go to cart (2)');
    });
  });

  test('MOB-UI-004 Adding a product on a phone puts it in the cart with the right quantity and totals', { tag: ['@mobile', '@smoke'] }, async ({ page, listingPage, cartPage, header }) => {
    await test.step('S1 Tap Add to cart on the Stainless Steel Water Bottle card', async () => {
      await listingPage.goto();
      await listingPage.addToCartButton(bottle.id).tap();
      await expect(header.cartCount).toHaveText('1');
      await expect(listingPage.inCart(bottle.id)).toHaveText('1 in cart');
    });

    await test.step('S2 Tap the cart link', async () => {
      await header.cartLink.tap();
      await expect(page).toHaveURL(url('/cart'));
      await expect(cartPage.lines).toHaveCount(1);
      await expect(cartPage.quantity('PROD-004')).toHaveValue('1');
      await expect(cartPage.lineSubtotal('PROD-004')).toHaveAttribute('data-amount', '649');
      await expect(cartPage.subtotal).toHaveAttribute('data-amount', '649');
      await expect(cartPage.delivery).toHaveText('FREE');
      await expect(cartPage.total).toHaveAttribute('data-amount', '649');
      await expectNoHorizontalScroll(page);
    });
  });

  test('MOB-UI-005 Changing the quantity and removing the item work with touch', { tag: ['@mobile'] }, async ({ page, cart, cartPage, header, toast }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Tap + then −', async () => {
      await expect(cartPage.decrease('PROD-004')).toBeDisabled();
      await cartPage.increase('PROD-004').tap();
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
      await expect(cartPage.lineSubtotal('PROD-004')).toHaveAttribute('data-amount', '1298');
      await expect(cartPage.total).toHaveAttribute('data-amount', '1298');
      await expect(header.cartCount).toHaveText('2');
      await cartPage.decrease('PROD-004').tap();
      await expect(cartPage.quantity('PROD-004')).toHaveValue('1');
      await expect(cartPage.total).toHaveAttribute('data-amount', '649');
    });

    await test.step('S2 Tap Remove', async () => {
      await cartPage.removeButton('PROD-004').tap();
      await expect(toast.withText('Removed Stainless Steel Water Bottle from your cart.')).toBeVisible();
      await expect(cartPage.emptyCart).toContainText('Your cart is empty');
      await expect(header.cartCount).toHaveText('0');
      expect(await readCart(page)).toEqual([]);
    });
  });
});

test.describe('Mobile checkout (signed in)', () => {
  test.use(signedIn);

  test('MOB-UI-006 Checkout fields are usable and validation errors are shown on a phone', { tag: ['@mobile'] }, async ({ page, cart, checkoutPage, header }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /checkout', async () => {
      await checkoutPage.goto();
      await expect(checkoutPage.form).toBeVisible();
      // The account greeting is hidden on narrow screens, while the sign-out control stays available.
      await expect(header.greeting).toBeHidden();
      await expect(header.logoutButton).toBeVisible();
      await expectNoHorizontalScroll(page);
    });

    await test.step('S2 Enter an invalid phone number and PIN code', async () => {
      await checkoutPage.field('phone').tap();
      await checkoutPage.enterAndBlur('phone', '5876543210');
      await expect(checkoutPage.fieldError('phone')).toHaveText('Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.');
      await expect(checkoutPage.fieldError('phone')).toBeVisible();
      await checkoutPage.enterAndBlur('postalCode', '060001');
      await expect(checkoutPage.fieldError('postalCode')).toHaveText('Enter a valid 6-digit PIN code.');
    });

    await test.step('S3 Clear the name and tap Place order', async () => {
      await checkoutPage.field('fullName').clear();
      await checkoutPage.submit.scrollIntoViewIfNeeded();
      await checkoutPage.submit.tap();
      await expect(checkoutPage.errorSummary).toHaveText('Please correct the highlighted fields before placing your order.');
      await expect(checkoutPage.fieldError('fullName')).toHaveText('Full name is required.');
      // The first invalid field receives focus and is scrolled into view on the small screen.
      await expect(checkoutPage.field('fullName')).toBeFocused();
      await expect(checkoutPage.field('fullName')).toBeInViewport();
      await expect(page).toHaveURL(url('/checkout'));
      expect(await readOrders(page)).toEqual([]);
    });
  });

  test('MOB-UI-007 Complete the simulated Cash on Delivery checkout on a phone', { tag: ['@mobile', '@smoke'] }, async ({ page, cart, cartPage, checkoutPage, checkout, confirmationPage, header, data }) => {
    const shipping = data.shipping();
    await cart.prepare([{ productId: book.id, quantity: 1 }]);

    await test.step('S1 Tap Proceed to checkout', async () => {
      await cartPage.proceedToCheckout.tap();
      await expect(page).toHaveURL(url('/checkout'));
      await expect(checkoutPage.subtotal).toHaveAttribute('data-amount', '349');
      await expect(checkoutPage.delivery).toHaveAttribute('data-amount', '40');
      await expect(checkoutPage.total).toHaveAttribute('data-amount', '389');
      await expect(checkoutPage.submit).toHaveText('Place order · ₹389');
    });

    await test.step('S2 Fill the shipping details and tap Place order', async () => {
      await checkout.fillShipping(shipping);
      await checkoutPage.submit.scrollIntoViewIfNeeded();
      await checkoutPage.submit.tap();
      await expect(page).toHaveURL(url('/order-confirmation/ORD-100001'));
      await expect(confirmationPage.orderId).toHaveText('ORD-100001');
      await expect(confirmationPage.orderId).toBeInViewport();
      await expect(confirmationPage.item('PROD-017')).toBeVisible();
      await expect(confirmationPage.total).toHaveAttribute('data-amount', '389');
      for (const part of [shipping.fullName, shipping.addressLine, `${shipping.city}, ${shipping.state} ${shipping.postalCode}`, `Phone: ${shipping.phone}`]) {
        await expect(confirmationPage.shippingAddress).toContainText(part);
      }
      await expect(header.cartCount).toHaveText('0');
      await expectNoHorizontalScroll(page);
    });
  });

  test('MOB-UI-008 Back, reload and Forward on a phone keep the cart and the checkout draft', { tag: ['@mobile'] }, async ({ page, cart, cartPage, checkoutPage, header }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 2 }]);

    await test.step('S1 Tap Proceed to checkout and type a phone number', async () => {
      await cartPage.proceedToCheckout.tap();
      await expect(page).toHaveURL(url('/checkout'));
      await checkoutPage.field('phone').fill('9876543210');
    });

    await test.step('S2 Go back to the cart and reload', async () => {
      await page.goBack();
      await expect(page).toHaveURL(url('/cart'));
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
      await page.reload();
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
      await expect(header.cartCount).toHaveText('2');
      expect(await readCart(page)).toEqual([{ productId: 'PROD-004', quantity: 2 }]);
    });

    await test.step('S3 Go forward to checkout', async () => {
      await page.goForward();
      await expect(page).toHaveURL(url('/checkout'));
      await expect(checkoutPage.field('phone')).toHaveValue('9876543210');
      await expect(checkoutPage.item('PROD-004')).toBeVisible();
      await expect(checkoutPage.total).toHaveAttribute('data-amount', '1298');
    });
  });
});

