import { test, expect } from '../fixtures';
import { env } from '../config/env';
import { readRaw, readRegisteredUsers, readSession } from '../support/appStorage';
import { invalidCredentials, invalidRegistration } from '../test-data';

// Every auth test starts in a fresh, signed-out browser context (no storage state).
test.describe('Auth UI', () => {
  test('AUTH-UI-001 Sign-up with valid details creates the account and signs the user in', { tag: ['@ui', '@auth', '@smoke'] }, async ({ page, registerPage, header, toast, data, log }) => {
    // Fixed name (the greeting and toast quote its first word); unique generated email and valid password.
    const user = data.newUser({ name: 'QA Tester' });
    log.info('Registering a new account', { email: user.email });

    await test.step('S1 Open /register', async () => {
      await registerPage.goto();
      await expect(registerPage.heading).toHaveText('Create your account');
      await expect(registerPage.form).toBeVisible();
    });

    await test.step('S2 Fill signup-name, signup-email, signup-password and signup-confirm-password', async () => {
      await registerPage.fill(user);
      await expect(registerPage.email).toHaveValue(user.email);
    });

    await test.step('S3 Click signup-submit', async () => {
      await registerPage.submit.click();
      await expect(page).toHaveURL(new URL('/', env.baseUrl).href);
      await expect(toast.withText('Account created. Welcome to ShopNest, QA!')).toBeVisible();
      await expect(header.greeting).toHaveText('Hello, QA');
      await expect(header.logoutButton).toBeVisible();
      await expect(header.loginLink).toHaveCount(0);
    });

    await test.step('S4 Read localStorage key shopnest:v1:session', async () => {
      const session = await readSession(page);
      expect(session).not.toBeNull();
      expect(session!.userId).toBe('USR-1001');
      // The account itself was stored once, with the normalised email.
      const users = await readRegisteredUsers(page);
      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({ id: 'USR-1001', name: 'QA Tester', email: user.email.toLowerCase() });
    });
  });

  test('AUTH-UI-002 Sign-up with an already registered email (different case) is rejected', { tag: ['@ui', '@auth'] }, async ({ page, registerPage, header, data }) => {
    const user = invalidRegistration.duplicateEmail(data.faker, test.info().workerIndex);
    const duplicate = { ...user, name: 'QA Tester' };

    await test.step('S1 Open /register', async () => {
      await registerPage.goto();
      await expect(registerPage.heading).toHaveText('Create your account');
    });

    await test.step('S2 Fill the form with the upper-cased TEST_USER_EMAIL', async () => {
      await registerPage.fill(duplicate);
      await expect(registerPage.email).toHaveValue(env.testUser.email.toUpperCase());
    });

    await test.step('S3 Click signup-submit', async () => {
      await registerPage.submit.click();
      await expect(registerPage.emailError).toHaveText('An account with this email already exists.');
      await expect(registerPage.email).toHaveAttribute('aria-invalid', 'true');
      await expect(registerPage.formError).toHaveCount(0);
      await expect(page).toHaveURL(new URL('/register', env.baseUrl).href);
      await expect(header.loginLink).toBeVisible();
      // No account and no session were created by the rejected attempt.
      expect(await readRegisteredUsers(page)).toEqual([]);
      expect(await readSession(page)).toBeNull();
    });
  });

  test('AUTH-UI-003 Sign-up with all fields empty shows a required error on every field', { tag: ['@ui', '@auth'] }, async ({ page, registerPage }) => {
    await test.step('S1 Open /register', async () => {
      await registerPage.goto();
      await expect(registerPage.form).toBeVisible();
    });

    await test.step('S2 Click signup-submit without typing anything', async () => {
      await registerPage.submit.click();
      await expect(registerPage.nameError).toHaveText('Name is required.');
      await expect(registerPage.emailError).toHaveText('Email is required.');
      await expect(registerPage.passwordError).toHaveText('Password is required.');
      await expect(registerPage.confirmPasswordError).toHaveText('Please confirm your password.');
      await expect(registerPage.name).toBeFocused();
      await expect(page).toHaveURL(new URL('/register', env.baseUrl).href);
      expect(await readRaw(page, 'session')).toBeNull();
    });
  });

  test('AUTH-UI-004 Sign-up field rules: name length, email format, password length and confirmation match', { tag: ['@ui', '@auth'] }, async ({ page, registerPage }) => {
    await test.step('S1 Open /register', async () => {
      await registerPage.goto();
      await expect(registerPage.form).toBeVisible();
    });

    await test.step('S2 Name " A " then "Al"', async () => {
      await registerPage.enterAndBlur(registerPage.name, invalidRegistration.shortName);
      await expect(registerPage.nameError).toHaveText('Name must be at least 2 characters.');
      await registerPage.name.fill('Al');
      await expect(registerPage.nameError).toHaveCount(0);
    });

    await test.step('S3 Email "qa.user@shopnest" then "qa.user@shopnest.test"', async () => {
      await registerPage.enterAndBlur(registerPage.email, invalidRegistration.malformedEmail);
      await expect(registerPage.emailError).toHaveText('Enter a valid email address.');
      await registerPage.email.fill('qa.user@shopnest.test');
      await expect(registerPage.emailError).toHaveCount(0);
    });

    await test.step('S4 Password with 7, 8, 64 and 65 characters', async () => {
      await registerPage.enterAndBlur(registerPage.password, invalidRegistration.shortPassword);
      await expect(registerPage.passwordError).toHaveText('Password must be at least 8 characters.');
      await registerPage.password.fill(invalidRegistration.minPassword);
      await expect(registerPage.passwordError).toHaveCount(0);
      await registerPage.password.fill(invalidRegistration.maxPassword);
      await expect(registerPage.passwordError).toHaveCount(0);
      await registerPage.password.fill(invalidRegistration.tooLongPassword);
      await expect(registerPage.passwordError).toHaveText('Password must be at most 64 characters.');
    });

    await test.step('S5 Password "Abcd@1234" with confirmation "Abcd@1235", then submit', async () => {
      await registerPage.password.fill(invalidRegistration.password);
      await registerPage.confirmPassword.fill(invalidRegistration.mismatchedConfirmation);
      await registerPage.submit.click();
      await expect(registerPage.confirmPasswordError).toHaveText('Passwords do not match.');
      await expect(page).toHaveURL(new URL('/register', env.baseUrl).href);
      expect(await readRaw(page, 'session')).toBeNull();
    });
  });

  test('AUTH-UI-005 Login with valid credentials signs the user in', { tag: ['@ui', '@auth', '@smoke'] }, async ({ page, loginPage, header, toast }) => {
    const { email, password } = env.testUser;

    await test.step('S1 Open /login', async () => {
      await loginPage.goto();
      await expect(page).toHaveURL(new URL('/login', env.baseUrl).href);
      await expect(loginPage.heading).toHaveText('Sign in');
      await expect(header.loginLink).toBeVisible();
    });

    await test.step('S2 Fill login-email with TEST_USER_EMAIL and login-password with TEST_USER_PASSWORD', async () => {
      await loginPage.email.fill(email);
      await loginPage.password.fill(password);
      await expect(loginPage.email).toHaveValue(email);
    });

    await test.step('S3 Click login-submit', async () => {
      await loginPage.submit.click();
      await expect(page).toHaveURL(new URL('/', env.baseUrl).href);
      await expect(toast.withText('Welcome back, Demo!')).toBeVisible();
      await expect(header.greeting).toHaveText('Hello, Demo');
      await expect(header.ordersLink).toBeVisible();
      await expect(header.logoutButton).toBeVisible();
      await expect(header.loginLink).toHaveCount(0);
    });

    await test.step('S4 Read localStorage key shopnest:v1:session', async () => {
      const session = await readSession(page);
      expect(session).not.toBeNull();
      expect(session!.userId).toBe('USR-0001');
      expect(session!.token).toBe('demo-token-USR-0001');
    });
  });

  test('AUTH-UI-006 Login with a wrong-case password or an unregistered email shows the same generic error', { tag: ['@ui', '@auth'] }, async ({ page, loginPage, header }) => {
    const wrongCase = invalidCredentials.wrongCasePassword();
    const unregistered = invalidCredentials.unregisteredEmail();

    await test.step('S1 Open /login', async () => {
      await loginPage.goto();
      await expect(loginPage.heading).toHaveText('Sign in');
    });

    await test.step('S2 TEST_USER_EMAIL with the lower-cased password', async () => {
      await loginPage.login(wrongCase.email, wrongCase.password);
      await expect(loginPage.error).toHaveText('Invalid email or password.');
      await expect(page).toHaveURL(new URL('/login', env.baseUrl).href);
      await expect(header.loginLink).toBeVisible();
      expect(await readRaw(page, 'session')).toBeNull();
    });

    await test.step('S3 "nobody.qa@shopnest.test" with TEST_USER_PASSWORD', async () => {
      await loginPage.login(unregistered.email, unregistered.password);
      // The submit button returns to its idle label once the rejected request has completed.
      await expect(loginPage.submit).toHaveText('Sign in');
      await expect(loginPage.error).toHaveText('Invalid email or password.');
      await expect(loginPage.emailError).toHaveCount(0);
      await expect(loginPage.email).toHaveValue('nobody.qa@shopnest.test');
      expect(await readRaw(page, 'session')).toBeNull();
      await expect(header.greeting).toHaveCount(0);
    });
  });

  test('AUTH-UI-007 Login with empty or malformed fields shows field errors and does not submit', { tag: ['@ui', '@auth'] }, async ({ page, loginPage }) => {
    await test.step('S1 Open /login', async () => {
      await loginPage.goto();
      await expect(loginPage.heading).toHaveText('Sign in');
    });

    await test.step('S2 Click login-submit with both fields empty', async () => {
      await loginPage.submit.click();
      await expect(loginPage.emailError).toHaveText('Email is required.');
      await expect(loginPage.passwordError).toHaveText('Password is required.');
      await expect(loginPage.error).toHaveCount(0);
      await expect(loginPage.email).toBeFocused();
    });

    await test.step('S3 Type "demo@shopnest" in login-email', async () => {
      await loginPage.email.fill(invalidCredentials.malformedEmail);
      await expect(loginPage.emailError).toHaveText('Enter a valid email address.');
      await expect(page).toHaveURL(new URL('/login', env.baseUrl).href);
      expect(await readRaw(page, 'session')).toBeNull();
    });
  });
});

