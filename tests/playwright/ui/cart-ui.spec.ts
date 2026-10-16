import { test, expect } from '../fixtures';
import { env } from '../config/env';
import { readCart } from '../support/appStorage';
import { demoCredentials, PRODUCTS } from '../test-data';

const bottle = PRODUCTS.waterBottle; // PROD-004, ₹649, stock 50 (max 10 per order)

test.describe('Cart UI', () => {
  test('CART-UI-001 Adding a product from the listing puts it in the cart with correct totals', { tag: ['@ui', '@cart', '@smoke'] }, async ({ page, listingPage, cartPage, header, toast }) => {
    await test.step('S1 Open /products', async () => {
      await listingPage.goto();
      await expect(listingPage.card(bottle.id)).toBeVisible();
      await expect(header.cartCount).toHaveText('0');
    });

    await test.step('S2 Click add-to-cart-PROD-004', async () => {
      await listingPage.addToCartButton(bottle.id).click();
      await expect(toast.withText('Added Stainless Steel Water Bottle to your cart.')).toBeVisible();
      await expect(header.cartCount).toHaveText('1');
      await expect(listingPage.inCart(bottle.id)).toHaveText('1 in cart');
    });

    await test.step('S3 Click cart-link', async () => {
      await header.openCart();
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
      await expect(cartPage.lines).toHaveCount(1);
      await expect(cartPage.line('PROD-004')).toBeVisible();
      await expect(cartPage.unitPrice('PROD-004')).toHaveAttribute('data-amount', '649');
      await expect(cartPage.quantity('PROD-004')).toHaveValue('1');
      await expect(cartPage.subtotal).toHaveAttribute('data-amount', '649');
      await expect(cartPage.delivery).toHaveText('FREE');
      await expect(cartPage.delivery).toHaveAttribute('data-amount', '0');
      await expect(cartPage.total).toHaveAttribute('data-amount', '649');
    });
  });

  test('CART-UI-002 Increase and decrease buttons update quantity and totals; decrease disables at 1', { tag: ['@ui', '@cart'] }, async ({ page, cart, cartPage, header }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /cart', async () => {
      await cartPage.goto();
      await expect(cartPage.quantity('PROD-004')).toHaveValue('1');
      await expect(cartPage.decrease('PROD-004')).toBeDisabled();
    });

    await test.step('S2 Click cart-increase-PROD-004', async () => {
      await cart.increase(bottle.id);
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
      await expect(cartPage.lineSubtotal('PROD-004')).toHaveAttribute('data-amount', '1298');
      await expect(cartPage.total).toHaveAttribute('data-amount', '1298');
      await expect(header.cartCount).toHaveText('2');
      expect(await readCart(page)).toEqual([{ productId: 'PROD-004', quantity: 2 }]);
    });

    await test.step('S3 Click cart-decrease-PROD-004', async () => {
      await cart.decrease(bottle.id);
      await expect(cartPage.quantity('PROD-004')).toHaveValue('1');
      await expect(cartPage.total).toHaveAttribute('data-amount', '649');
      await expect(cartPage.decrease('PROD-004')).toBeDisabled();
      await expect(header.cartCount).toHaveText('1');
    });
  });

  test('CART-UI-003 Delivery fee boundary: 40 INR below 499, free at exactly 499', { tag: ['@ui', '@cart'] }, async ({ cart, cartPage, shopping, page }) => {
    await test.step('S1 Add PROD-017 from /products and open /cart', async () => {
      await page.goto('/products');
      await shopping.addFromListing('PROD-017');
      await cartPage.goto();
      await expect(cartPage.subtotal).toHaveAttribute('data-amount', '349');
      await expect(cartPage.delivery).toHaveText('₹40');
      await expect(cartPage.delivery).toHaveAttribute('data-amount', '40');
      await expect(cartPage.total).toHaveAttribute('data-amount', '389');
      await expect(cartPage.deliveryNote).toHaveText('Add ₹150 more for free delivery.');
    });

    await test.step('S2 Remove PROD-017, add PROD-009 from /products and open /cart', async () => {
      await cart.remove('PROD-017');
      await page.goto('/products');
      await shopping.addFromListing('PROD-009');
      await cartPage.goto();
      await expect(cartPage.subtotal).toHaveAttribute('data-amount', '499');
      await expect(cartPage.delivery).toHaveText('FREE');
      await expect(cartPage.delivery).toHaveAttribute('data-amount', '0');
      await expect(cartPage.total).toHaveAttribute('data-amount', '499');
      await expect(cartPage.deliveryNote).toHaveCount(0);
    });
  });

  test('CART-UI-004 Removing the last item shows the empty-cart state', { tag: ['@ui', '@cart'] }, async ({ page, cart, cartPage, header, toast }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /cart', async () => {
      await cartPage.goto();
      await expect(cartPage.line('PROD-004')).toBeVisible();
    });

    await test.step('S2 Click remove-from-cart-PROD-004', async () => {
      await cartPage.removeButton('PROD-004').click();
      await expect(toast.withText('Removed Stainless Steel Water Bottle from your cart.')).toBeVisible();
      await expect(cartPage.line('PROD-004')).toHaveCount(0);
      await expect(cartPage.emptyCart).toContainText('Your cart is empty');
      await expect(cartPage.emptyCartContinue).toHaveAttribute('href', '/products');
      await expect(header.cartCount).toHaveText('0');
      expect(await readCart(page)).toEqual([]);
    });
  });

  test('CART-UI-005 Typed cart quantity: 0, decimals and values above 10 are rejected; 10 is accepted', { tag: ['@ui', '@cart'] }, async ({ cart, cartPage }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 2 }]);

    await test.step('S1 Open /cart', async () => {
      await cartPage.goto();
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
    });

    await test.step('S2 Replace the quantity with "0" and press Enter', async () => {
      await cart.setQuantity(bottle.id, '0');
      await expect(cartPage.quantityError('PROD-004')).toHaveText('Quantity must be at least 1.');
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
    });

    await test.step('S3 Replace the quantity with "2.5" and press Enter', async () => {
      await cart.setQuantity(bottle.id, '2.5');
      await expect(cartPage.quantityError('PROD-004')).toHaveText('Enter a whole number.');
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
    });

    await test.step('S4 Replace the quantity with "11" and press Enter', async () => {
      await cart.setQuantity(bottle.id, '11');
      await expect(cartPage.quantityError('PROD-004')).toHaveText('You can buy at most 10 of this item.');
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
      await expect(cartPage.total).toHaveAttribute('data-amount', '1298');
    });

    await test.step('S5 Replace the quantity with "10" and press Enter', async () => {
      await cart.setQuantity(bottle.id, '10');
      await expect(cartPage.quantity('PROD-004')).toHaveValue('10');
      await expect(cartPage.total).toHaveAttribute('data-amount', '6490');
      await expect(cartPage.increase('PROD-004')).toBeDisabled();
      await expect(cartPage.maxHint('PROD-004')).toHaveText('Maximum quantity: 10');
      await expect(cartPage.quantityError('PROD-004')).toHaveCount(0);
    });
  });

  test('CART-UI-007 Cart is kept across reload, sign-in and sign-out', { tag: ['@ui', '@cart'] }, async ({ page, cart, cartPage, header, auth }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 2 }]);

    await test.step('S1 Reload /cart', async () => {
      await page.reload();
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
      await expect(header.cartCount).toHaveText('2');
    });

    await test.step('S2 Sign in with the test user', async () => {
      await auth.signIn(demoCredentials(), { expectedFirstName: 'Demo' });
      await expect(header.cartCount).toHaveText('2');
    });

    await test.step('S3 Click logout-button and open /cart', async () => {
      await auth.signOut();
      await cartPage.goto();
      await expect(cartPage.line('PROD-004')).toBeVisible();
      await expect(cartPage.quantity('PROD-004')).toHaveValue('2');
      expect(await readCart(page)).toEqual([{ productId: 'PROD-004', quantity: 2 }]);
    });
  });
});
