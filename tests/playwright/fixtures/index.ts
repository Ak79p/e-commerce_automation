// Shared fixtures. Specs import { test, expect } from this file instead of '@playwright/test'.
//
// Isolation: Playwright creates a new browser context per test, and ShopNest keeps all state (users, session,
// cart, drafts, orders) in that context's localStorage, so every test starts from the seeded, signed-out state
// unless its scope opts in to the saved Demo User session with `test.use(signedIn)` (support/authState.ts).
// Tests never depend on each other: prerequisites (cart contents, sign-in) are set up inside each test.
import { test as base, expect } from '@playwright/test';
import type { Faker } from '@faker-js/faker';
import { env } from '../config/env';
import {
  CartPage,
  CheckoutPage,
  HeaderComponent,
  HomePage,
  LoginPage,
  OrderConfirmationPage,
  OrdersPage,
  ProductDetailsPage,
  ProductListPage,
  RegisterPage,
  ToastRegion,
} from '../pages';
import { TestLogger } from '../support/logger';
import { buildNewUser, buildShippingDetails, seededFaker, type NewUser, type ShippingDetails } from '../test-data';
import { AuthWorkflow, CartWorkflow, CheckoutWorkflow, ShoppingWorkflow } from '../workflows';

export interface TestData {
  faker: Faker;
  seed: number;
  newUser(overrides?: Partial<NewUser>): NewUser;
  shipping(overrides?: Partial<ShippingDetails>): ShippingDetails;
}

interface Fixtures {
  log: TestLogger;
  data: TestData;
  header: HeaderComponent;
  homePage: HomePage;
  ordersPage: OrdersPage;
  toast: ToastRegion;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  listingPage: ProductListPage;
  productPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  confirmationPage: OrderConfirmationPage;
  auth: AuthWorkflow;
  shopping: ShoppingWorkflow;
  cart: CartWorkflow;
  checkout: CheckoutWorkflow;
}

export const test = base.extend<Fixtures>({
  log: async ({ page }, use, testInfo) => {
    const log = new TestLogger(testInfo, env.verboseLog);
    // Browser errors are recorded so a failure report shows them next to the steps.
    page.on('pageerror', (error) => log.warn('Page error', { message: error.message }));
    page.on('console', (msg) => {
      if (msg.type() === 'error') log.warn('Console error', { text: msg.text() });
    });
    await use(log);
    await log.flush();
  },
  data: async ({ log }, use, testInfo) => {
    const { faker, seed } = seededFaker(testInfo.titlePath.join(' › '));
    log.info('Test data seed (set FAKER_SEED to reproduce a different run)', { seed });
    await use({
      faker,
      seed,
      newUser: (overrides) => buildNewUser(faker, testInfo.workerIndex, overrides),
      shipping: (overrides) => buildShippingDetails(faker, overrides),
    });
  },
  header: async ({ page }, use) => use(new HeaderComponent(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  ordersPage: async ({ page }, use) => use(new OrdersPage(page)),
  toast: async ({ page }, use) => use(new ToastRegion(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  listingPage: async ({ page }, use) => use(new ProductListPage(page)),
  productPage: async ({ page }, use) => use(new ProductDetailsPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  confirmationPage: async ({ page }, use) => use(new OrderConfirmationPage(page)),
  auth: async ({ page, log }, use) => use(new AuthWorkflow(page, log)),
  shopping: async ({ page, log }, use) => use(new ShoppingWorkflow(page, log)),
  cart: async ({ page, log }, use) => use(new CartWorkflow(page, log)),
  checkout: async ({ page, log }, use) => use(new CheckoutWorkflow(page, log)),
});

export { expect };
export { signedIn, signedOut } from '../support/authState';
