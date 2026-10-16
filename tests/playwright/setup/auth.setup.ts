// Setup project: signs the seeded Demo User in through the real login form once per run and saves the
// browser storage state (ShopNest's session lives in localStorage) to the git-ignored .auth/ folder.
// Specs opt in with `test.use(signedIn)`; each test still gets its own new context built from this file, so no
// cart, draft or order state is ever shared between tests.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { HeaderComponent, LoginPage } from '../pages';
import { AUTH_STATE_FILE } from '../support/authState';
import { readCart, readSession } from '../support/appStorage';
import { DEMO_USER, demoCredentials } from '../test-data/users';

setup('authenticate as the seeded Demo User', async ({ page }) => {
  const { email, password } = demoCredentials();
  const loginPage = new LoginPage(page);
  const header = new HeaderComponent(page);

  await loginPage.goto();
  await loginPage.login(email, password);
  await expect(header.greeting).toHaveText(`Hello, ${DEMO_USER.firstName}`);

  const session = await readSession(page);
  expect(session?.userId, 'the saved state must hold the Demo User session').toBe(DEMO_USER.id);
  expect(await readCart(page), 'the saved state must start with an empty cart').toEqual([]);

  mkdirSync(path.dirname(AUTH_STATE_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_STATE_FILE });
});
