// Checkout scenarios. SAFETY: ShopNest's only payment method is a simulated Cash on Delivery; "Place order"
// writes a demo order to this test's own browser storage. No payment details are entered anywhere.
import { test, expect, signedIn } from '../fixtures';
import { env } from '../config/env';
import { readCart, readOrders, readRaw, readSession } from '../support/appStorage';
import { demoCredentials, expectedSummary, FIXED_SHIPPING, PRODUCTS, uniqueEmail } from '../test-data';

const bottle = PRODUCTS.waterBottle; // PROD-004, ₹649: free delivery
const book = PRODUCTS.monsoonGarden; // PROD-017, ₹349: ₹40 delivery

test.describe('Checkout UI (signed out)', () => {
  test('CHK-UI-002 Signed-out shopper proceeding to checkout must sign in and returns to checkout with the cart kept', { tag: ['@ui', '@checkout', '@smoke'] }, async ({ page, cart, cartPage, loginPage, checkoutPage, header, auth }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /cart', async () => {
      await cartPage.goto();
      await expect(cartPage.loginNote).toHaveText("You'll be asked to sign in before checkout. Your cart will be saved.");
    });

    await test.step('S2 Click proceed-to-checkout', async () => {
      await cart.proceedToCheckout();
      await expect(page).toHaveURL(new URL('/login?redirect=%2Fcheckout', env.baseUrl).href);
      await expect(loginPage.requiredNotice).toHaveText('Please sign in to continue to checkout. Your cart has been saved.');
    });

    await test.step('S3 Sign in with the test user', async () => {
      await auth.submitCredentials(demoCredentials(), 'Demo');
      await expect(page).toHaveURL(new URL('/checkout', env.baseUrl).href);
      await expect(checkoutPage.form).toBeVisible();
      await expect(checkoutPage.item('PROD-004')).toBeVisible();
      await expect(header.cartCount).toHaveText('1');
    });
  });

  test('CHK-UI-012 Signed-out shopper redirected from checkout to login can press Back to the cart without a redirect loop', { tag: ['@ui', '@checkout', '@navigation'] }, async ({ page, cart, cartPage, loginPage, header }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /cart', async () => {
      await cartPage.goto();
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
      await expect(cartPage.line('PROD-004')).toBeVisible();
      await expect(cartPage.loginNote).toBeVisible();
    });

    await test.step('S2 Click proceed-to-checkout', async () => {
      await cart.proceedToCheckout();
      await expect(page).toHaveURL(new URL('/login?redirect=%2Fcheckout', env.baseUrl).href);
      await expect(loginPage.requiredNotice).toHaveText('Please sign in to continue to checkout. Your cart has been saved.');
    });

    await test.step('S3 Press the browser Back button', async () => {
      await page.goBack();
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
      await expect(cartPage.heading).toHaveText('Shopping Cart');
      await expect(cartPage.line('PROD-004')).toBeVisible();
      await expect(header.cartCount).toHaveText('1');
      await expect(cartPage.loginNote).toBeVisible();
      // No redirect loop: after the cart has rendered, the URL is still /cart.
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
    });

    await test.step('S4 Press the browser Forward button', async () => {
      await page.goForward();
      await expect(page).toHaveURL(new URL('/login?redirect=%2Fcheckout', env.baseUrl).href);
      await expect(loginPage.requiredNotice).toBeVisible();
    });
  });

  test('CHK-UI-013 End-to-end: sign up, sign out, log in, search, add 2 to cart and place a Cash on Delivery order', { tag: ['@ui', '@checkout', '@e2e', '@smoke'] }, async ({ page, data, log, auth, registerPage, loginPage, header, toast, shopping, listingPage, productPage, cartPage, checkoutPage, checkout, confirmationPage }) => {
    // Faker builds the unique account email; the name is fixed because the greeting and toasts quote it.
    const user = data.newUser({ name: 'QA Tester', email: uniqueEmail(data.faker, test.info().workerIndex, 'qa.e2e') });
    const book = PRODUCTS.indianCooking; // PROD-018, ₹449 × 2 = ₹898: crosses the ₹499 free-delivery threshold
    const expected = expectedSummary([{ price: book.price, quantity: 2 }]);
    log.info('Happy path account', { email: user.email });

    await test.step('S1 Open /register', async () => {
      await registerPage.goto();
      await expect(registerPage.heading).toHaveText('Create your account');
      await expect(registerPage.form).toBeVisible();
    });

    await test.step('S2 Sign up as "QA Tester" with the generated email', async () => {
      await registerPage.fill(user);
      await registerPage.submit.click();
      await expect(page).toHaveURL(new URL('/', env.baseUrl).href);
      await expect(toast.withText('Account created. Welcome to ShopNest, QA!')).toBeVisible();
      await expect(header.greeting).toHaveText('Hello, QA');
      expect((await readSession(page))?.userId).toBe('USR-1001');
    });

    await test.step('S3 Click logout-button', async () => {
      await auth.signOut();
      await expect(page).toHaveURL(new URL('/', env.baseUrl).href);
      await expect(toast.withText('You have been signed out.')).toBeVisible();
      await expect(header.loginLink).toBeVisible();
      await expect(header.greeting).toHaveCount(0);
      expect(await readRaw(page, 'session')).toBeNull();
    });

    await test.step('S4 Click login-link', async () => {
      await header.loginLink.click();
      await expect(page).toHaveURL(new URL('/login?redirect=%2F', env.baseUrl).href);
      await expect(loginPage.heading).toHaveText('Sign in');
    });

    await test.step('S5 Log in with the new account', async () => {
      await loginPage.login(user.email, user.password);
      await expect(page).toHaveURL(new URL('/', env.baseUrl).href);
      await expect(toast.withText('Welcome back, QA!')).toBeVisible();
      await expect(header.greeting).toHaveText('Hello, QA');
      await expect(header.logoutButton).toBeVisible();
      await expect(header.loginLink).toHaveCount(0);
      const session = await readSession(page);
      expect(session?.userId).toBe('USR-1001');
      expect(session?.token).toBe('demo-token-USR-1001');
    });

    await test.step('S6 Search for "Indian Cooking"', async () => {
      await shopping.search('Indian Cooking');
      await expect(page).toHaveURL(new URL('/products?q=Indian%20Cooking', env.baseUrl).href);
      await expect(listingPage.heading).toHaveText('Search results for "Indian Cooking"');
      await expect(listingPage.resultsCount).toHaveText('1 product');
      await expect(listingPage.card('PROD-018')).toBeVisible();
      expect(await listingPage.productIds()).toEqual(['PROD-018']);
    });

    await test.step('S7 Click product-link-PROD-018', async () => {
      await listingPage.productLink(book.id).click();
      await expect(page).toHaveURL(new URL('/product/PROD-018', env.baseUrl).href);
      await expect(productPage.title).toHaveText('Everyday Indian Cooking');
      await expect(productPage.productId).toHaveText('PROD-018');
      await expect(productPage.price).toHaveText('₹449');
      await expect(productPage.price).toHaveAttribute('data-price', '449');
      await expect(productPage.availability).toHaveText('In stock');
    });

    await test.step('S8 Select 2 and click add-to-cart-PROD-018', async () => {
      await productPage.quantity.selectOption('2');
      await productPage.addToCartButton(book.id).click();
      await expect(productPage.addSuccess).toHaveText('Added 2 × Everyday Indian Cooking to your cart.');
      await expect(header.cartCount).toHaveText('2');
    });

    await test.step('S9 Click go-to-cart', async () => {
      await productPage.goToCart.click();
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
      await expect(cartPage.lines).toHaveCount(1);
      await expect(cartPage.line('PROD-018')).toBeVisible();
      await expect(cartPage.lineName('PROD-018')).toHaveText('Everyday Indian Cooking');
      await expect(cartPage.unitPrice('PROD-018')).toHaveAttribute('data-amount', '449');
      await expect(cartPage.quantity('PROD-018')).toHaveValue('2');
      await expect(cartPage.lineSubtotal('PROD-018')).toHaveText('₹898');
      await expect(cartPage.lineSubtotal('PROD-018')).toHaveAttribute('data-amount', '898');
      await expect(cartPage.subtotal).toHaveText('₹898');
      await expect(cartPage.subtotal).toHaveAttribute('data-amount', '898');
      await expect(cartPage.summary).toContainText('Subtotal (2 items)');
      await expect(cartPage.delivery).toHaveText('FREE');
      await expect(cartPage.delivery).toHaveAttribute('data-amount', '0');
      await expect(cartPage.total).toHaveText('₹898');
      await expect(cartPage.total).toHaveAttribute('data-amount', '898');
      await expect(cartPage.deliveryNote).toHaveCount(0);
      await expect(cartPage.loginNote).toHaveCount(0);
      // The pricing rule computed independently from the seeded price gives the same totals the UI shows.
      expect(expected).toEqual({ subtotal: 898, deliveryFee: 0, total: 898 });
    });

    await test.step('S10 Click proceed-to-checkout', async () => {
      await cartPage.proceedToCheckout.click();
      await expect(page).toHaveURL(new URL('/checkout', env.baseUrl).href);
      await expect(checkoutPage.field('fullName')).toHaveValue('QA Tester');
      await expect(checkoutPage.field('email')).toHaveValue(user.email);
      await expect(checkoutPage.item('PROD-018')).toContainText('× 2');
      await expect(checkoutPage.itemSubtotal('PROD-018')).toHaveText('₹898');
      await expect(checkoutPage.subtotal).toHaveAttribute('data-amount', '898');
      await expect(checkoutPage.delivery).toHaveAttribute('data-amount', '0');
      await expect(checkoutPage.total).toHaveAttribute('data-amount', '898');
      await expect(checkoutPage.paymentMethod).toContainText('Cash on Delivery');
      await expect(checkoutPage.submit).toHaveText('Place order · ₹898');
    });

    await test.step('S11 Fill phone, address, city, state and PIN', async () => {
      await checkout.fillShipping({ phone: '9876543210', addressLine: '12 MG Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka', postalCode: '560038' });
      await expect(checkoutPage.field('postalCode')).toHaveValue('560038');
    });

    await test.step('S12 Click checkout-submit (simulated Cash on Delivery)', async () => {
      await checkoutPage.submit.click();
      await expect(page).toHaveURL(new URL('/order-confirmation/ORD-100001', env.baseUrl).href);
      await expect(confirmationPage.orderId).toHaveText('ORD-100001');
      await expect(toast.withText('Order ORD-100001 placed successfully.')).toBeVisible();
      await expect(confirmationPage.lines).toHaveCount(1);
      await expect(confirmationPage.item('PROD-018')).toContainText('Everyday Indian Cooking × 2 @ ₹449');
      await expect(confirmationPage.item('PROD-018')).toContainText('₹898');
      await expect(confirmationPage.subtotal).toHaveAttribute('data-amount', '898');
      await expect(confirmationPage.delivery).toHaveText('FREE');
      await expect(confirmationPage.delivery).toHaveAttribute('data-amount', '0');
      // Equal to the cart total asserted in S9.
      await expect(confirmationPage.total).toHaveAttribute('data-amount', '898');
      await expect(confirmationPage.email).toHaveText(user.email);
      for (const part of ['QA Tester', '12 MG Road, Indiranagar', 'Bengaluru, Karnataka 560038', 'Phone: 9876543210']) {
        await expect(confirmationPage.shippingAddress).toContainText(part);
      }
      await expect(header.cartCount).toHaveText('0');
      const orders = await readOrders(page);
      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({ id: 'ORD-100001', userId: 'USR-1001', summary: { subtotal: 898, deliveryFee: 0, total: 898 } });
    });

    await test.step('S13 Click cart-link', async () => {
      await header.openCart();
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
      await expect(cartPage.emptyCart).toBeVisible();
      await expect(header.cartCount).toHaveText('0');
    });
  });
});

test.describe('Checkout UI (signed in)', () => {
  test.use(signedIn);

  test('CHK-UI-001 Signed-in shopper places a Cash on Delivery order and the confirmation shows the same totals', { tag: ['@ui', '@checkout', '@smoke'] }, async ({ page, cart, checkoutPage, confirmationPage, checkout, header, toast }) => {
    await cart.prepare([{ productId: book.id, quantity: 1 }]);

    await test.step('S1 Open /checkout', async () => {
      await checkoutPage.goto();
      await expect(checkoutPage.field('fullName')).toHaveValue('Demo User');
      await expect(checkoutPage.field('email')).toHaveValue(env.testUser.email);
      await expect(checkoutPage.subtotal).toHaveAttribute('data-amount', '349');
      await expect(checkoutPage.delivery).toHaveAttribute('data-amount', '40');
      await expect(checkoutPage.total).toHaveAttribute('data-amount', '389');
      await expect(checkoutPage.paymentMethod).toContainText('Cash on Delivery');
      await expect(checkoutPage.submit).toHaveText('Place order · ₹389');
    });

    await test.step('S2 Fill phone, address, city, state and PIN', async () => {
      await checkout.fillShipping(FIXED_SHIPPING);
      await expect(checkoutPage.field('state')).toHaveValue('Karnataka');
    });

    await test.step('S3 Click checkout-submit', async () => {
      await checkoutPage.submit.click();
      await expect(page).toHaveURL(new URL('/order-confirmation/ORD-100001', env.baseUrl).href);
      await expect(confirmationPage.orderId).toHaveText('ORD-100001');
      await expect(confirmationPage.item('PROD-017')).toBeVisible();
      await expect(confirmationPage.subtotal).toHaveAttribute('data-amount', '349');
      await expect(confirmationPage.delivery).toHaveAttribute('data-amount', '40');
      await expect(confirmationPage.total).toHaveAttribute('data-amount', '389');
      for (const part of ['Demo User', '12 MG Road, Indiranagar', 'Bengaluru, Karnataka 560038', 'Phone: 9876543210']) {
        await expect(confirmationPage.shippingAddress).toContainText(part);
      }
      await expect(toast.withText('Order ORD-100001 placed successfully.')).toBeVisible();
      await expect(header.cartCount).toHaveText('0');
      expect(await readCart(page)).toEqual([]);
    });

    await test.step('S4 Click view-orders', async () => {
      await confirmationPage.viewOrders.click();
      await expect(page).toHaveURL(new URL('/orders', env.baseUrl).href);
      await expect(confirmationPage.orderRow('ORD-100001')).toBeVisible();
    });
  });

  test('CHK-UI-003 Checkout with an empty cart shows the empty-cart message and no form', { tag: ['@ui', '@checkout'] }, async ({ checkoutPage, header }) => {
    await test.step('S1 Open /checkout', async () => {
      await checkoutPage.goto();
      await expect(header.greeting).toHaveText('Hello, Demo');
      await expect(checkoutPage.emptyCart).toContainText('Your cart is empty');
      await expect(checkoutPage.emptyCart).toContainText('Add at least one item to your cart before checking out.');
      await expect(checkoutPage.form).toHaveCount(0);
    });
  });

  test('CHK-UI-004 Submitting checkout with empty fields shows the error summary and every required message', { tag: ['@ui', '@checkout'] }, async ({ page, cart, checkoutPage, header }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /checkout', async () => {
      await checkoutPage.goto();
      await expect(checkoutPage.form).toBeVisible();
    });

    await test.step('S2 Clear checkout-full-name and checkout-email', async () => {
      await checkoutPage.field('fullName').clear();
      await checkoutPage.field('email').clear();
      await expect(checkoutPage.field('fullName')).toHaveValue('');
      await expect(checkoutPage.field('email')).toHaveValue('');
    });

    await test.step('S3 Click checkout-submit', async () => {
      await checkoutPage.submit.click();
      await expect(checkoutPage.errorSummary).toHaveText('Please correct the highlighted fields before placing your order.');
      await expect(checkoutPage.fieldError('fullName')).toHaveText('Full name is required.');
      await expect(checkoutPage.fieldError('email')).toHaveText('Email is required.');
      await expect(checkoutPage.fieldError('phone')).toHaveText('Phone number is required.');
      await expect(checkoutPage.fieldError('addressLine')).toHaveText('Address is required.');
      await expect(checkoutPage.fieldError('city')).toHaveText('City is required.');
      await expect(checkoutPage.fieldError('state')).toHaveText('State is required.');
      await expect(checkoutPage.fieldError('postalCode')).toHaveText('Postal code is required.');
      await expect(checkoutPage.field('fullName')).toBeFocused();
      await expect(page).toHaveURL(new URL('/checkout', env.baseUrl).href);
      await expect(header.cartCount).toHaveText('1');
      expect(await readRaw(page, 'orders')).toBeNull();
    });
  });

  test('CHK-UI-005 Checkout field format rules: phone, PIN code, city and address line', { tag: ['@ui', '@checkout'] }, async ({ page, cart, checkoutPage }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /checkout', async () => {
      await checkoutPage.goto();
      await expect(checkoutPage.form).toBeVisible();
    });

    await test.step('S2 Phone "5876543210", "987654321", then "98765-43210"', async () => {
      await checkoutPage.enterAndBlur('phone', '5876543210');
      await expect(checkoutPage.fieldError('phone')).toHaveText('Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.');
      await checkoutPage.field('phone').fill('987654321');
      await expect(checkoutPage.fieldError('phone')).toHaveText('Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.');
      await checkoutPage.field('phone').fill('98765-43210');
      await expect(checkoutPage.fieldError('phone')).toHaveCount(0);
    });

    await test.step('S3 PIN "060001", "56000", then "560001"', async () => {
      await checkoutPage.enterAndBlur('postalCode', '060001');
      await expect(checkoutPage.fieldError('postalCode')).toHaveText('Enter a valid 6-digit PIN code.');
      await checkoutPage.field('postalCode').fill('56000');
      await expect(checkoutPage.fieldError('postalCode')).toHaveText('Enter a valid 6-digit PIN code.');
      await checkoutPage.field('postalCode').fill('560001');
      await expect(checkoutPage.fieldError('postalCode')).toHaveCount(0);
    });

    await test.step(`S4 City "Bengaluru1", then "St. John's-Wood"`, async () => {
      await checkoutPage.enterAndBlur('city', 'Bengaluru1');
      await expect(checkoutPage.fieldError('city')).toHaveText("City can only contain letters, spaces and . ' -");
      await checkoutPage.field('city').fill("St. John's-Wood");
      await expect(checkoutPage.fieldError('city')).toHaveCount(0);
    });

    await test.step('S5 Address "12 A", then "12 AB"', async () => {
      await checkoutPage.enterAndBlur('addressLine', '12 A');
      await expect(checkoutPage.fieldError('addressLine')).toHaveText('Address must be at least 5 characters.');
      await checkoutPage.field('addressLine').fill('12 AB');
      await expect(checkoutPage.fieldError('addressLine')).toHaveCount(0);
      // Invalid input never produced an order.
      expect(await readOrders(page)).toEqual([]);
    });
  });

  test('CHK-UI-006 Checkout draft survives reload and a round trip to the cart', { tag: ['@ui', '@checkout'] }, async ({ page, cart, cartPage, checkoutPage, checkout }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /checkout and fill checkout-phone and checkout-city', async () => {
      await checkoutPage.goto();
      await checkout.fillShipping({ phone: '9876543210', city: 'Bengaluru' });
      await expect(checkoutPage.field('phone')).toHaveValue('9876543210');
    });

    await test.step('S2 Reload the page', async () => {
      await page.reload();
      await expect(checkoutPage.field('phone')).toHaveValue('9876543210');
      await expect(checkoutPage.field('city')).toHaveValue('Bengaluru');
    });

    await test.step('S3 Click back-to-cart, then click proceed-to-checkout', async () => {
      await checkoutPage.backToCart.click();
      await expect(cartPage.line('PROD-004')).toBeVisible();
      await cart.proceedToCheckout();
      await expect(page).toHaveURL(new URL('/checkout', env.baseUrl).href);
      await expect(checkoutPage.field('phone')).toHaveValue('9876543210');
      await expect(checkoutPage.field('city')).toHaveValue('Bengaluru');
    });
  });

  test('CHK-UI-009 Back after placing an order goes to the cart, not the checkout', { tag: ['@ui', '@checkout'] }, async ({ page, cart, cartPage, checkout }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);
    await cart.proceedToCheckout();
    await expect(page).toHaveURL(new URL('/checkout', env.baseUrl).href);

    await test.step('S1 Fill all shipping fields and click checkout-submit', async () => {
      // Name and email are pre-filled from the account; the rest is the fixed test address.
      await checkout.fillShipping(FIXED_SHIPPING);
      const orderId = await checkout.placeOrder();
      expect(orderId).toBe('ORD-100001');
      await expect(page).toHaveURL(new URL('/order-confirmation/ORD-100001', env.baseUrl).href);
    });

    await test.step('S2 Press the browser Back button', async () => {
      await page.goBack();
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
      await expect(cartPage.emptyCart).toBeVisible();
    });
  });

  test('CHK-UI-011 Browser Back from checkout returns to the intact cart and Forward restores the typed shipping draft', { tag: ['@ui', '@checkout', '@navigation'] }, async ({ page, cart, cartPage, checkoutPage, checkout, header }) => {
    await cart.prepare([{ productId: bottle.id, quantity: 1 }]);

    await test.step('S1 Open /cart', async () => {
      await cartPage.goto();
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
      await expect(cartPage.line('PROD-004')).toBeVisible();
      await expect(header.cartCount).toHaveText('1');
    });

    await test.step('S2 Click proceed-to-checkout', async () => {
      await cart.proceedToCheckout();
      await expect(page).toHaveURL(new URL('/checkout', env.baseUrl).href);
      await expect(checkoutPage.form).toBeVisible();
      await expect(checkoutPage.field('fullName')).toHaveValue('Demo User');
      await expect(checkoutPage.field('email')).toHaveValue(env.testUser.email);
    });

    await test.step('S3 Fill phone, address, city and state; leave the PIN empty', async () => {
      await checkout.fillShipping({ phone: '9876543210', addressLine: '12 MG Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka' });
      await expect(checkoutPage.field('state')).toHaveValue('Karnataka');
    });

    await test.step('S4 Press the browser Back button', async () => {
      await page.goBack();
      await expect(page).toHaveURL(new URL('/cart', env.baseUrl).href);
      await expect(cartPage.line('PROD-004')).toBeVisible();
      await expect(cartPage.quantity('PROD-004')).toHaveValue('1');
      await expect(cartPage.subtotal).toHaveAttribute('data-amount', '649');
      await expect(cartPage.delivery).toHaveText('FREE');
      await expect(cartPage.delivery).toHaveAttribute('data-amount', '0');
      await expect(cartPage.total).toHaveAttribute('data-amount', '649');
      await expect(header.cartCount).toHaveText('1');
    });

    await test.step('S5 Press the browser Forward button', async () => {
      await page.goForward();
      await expect(page).toHaveURL(new URL('/checkout', env.baseUrl).href);
      await expect(checkoutPage.form).toBeVisible();
      await expect(checkoutPage.field('fullName')).toHaveValue('Demo User');
      await expect(checkoutPage.field('email')).toHaveValue(env.testUser.email);
      await expect(checkoutPage.field('phone')).toHaveValue('9876543210');
      await expect(checkoutPage.field('addressLine')).toHaveValue('12 MG Road, Indiranagar');
      await expect(checkoutPage.field('city')).toHaveValue('Bengaluru');
      await expect(checkoutPage.field('state')).toHaveValue('Karnataka');
      await expect(checkoutPage.field('postalCode')).toHaveValue('');
      await expect(checkoutPage.errorSummary).toHaveCount(0);
      await expect(checkoutPage.item('PROD-004')).toBeVisible();
      await expect(checkoutPage.total).toHaveAttribute('data-amount', '649');
    });
  });

  // Data-driven check: the Faker shipping builder produces data the app accepts end to end.
  test('Checkout accepts Faker-generated shipping details and confirms them on the order', { tag: ['@ui', '@checkout', '@faker'] }, async ({ page, cart, checkoutPage, checkout, confirmationPage, data, log }) => {
    const shipping = data.shipping();
    log.info('Generated shipping details', { city: shipping.city, state: shipping.state, postalCode: shipping.postalCode });
    await cart.prepare([{ productId: PRODUCTS.laptopStand.id, quantity: 1 }]);

    await checkoutPage.goto();
    await checkout.fillShipping(shipping);
    for (const field of ['fullName', 'email', 'phone', 'addressLine', 'city', 'state', 'postalCode'] as const) {
      await expect(checkoutPage.field(field)).toHaveValue(shipping[field]);
      await expect(checkoutPage.fieldError(field)).toHaveCount(0);
    }

    const orderId = await checkout.placeOrder();
    expect(orderId).toBe('ORD-100001');
    await expect(confirmationPage.email).toHaveText(shipping.email);
    for (const part of [shipping.fullName, shipping.addressLine, `${shipping.city}, ${shipping.state} ${shipping.postalCode}`, `Phone: ${shipping.phone}`]) {
      await expect(confirmationPage.shippingAddress).toContainText(part);
    }
    await expect(confirmationPage.total).toHaveAttribute('data-amount', String(PRODUCTS.laptopStand.price));
    expect(await readCart(page)).toEqual([]);
  });
});
