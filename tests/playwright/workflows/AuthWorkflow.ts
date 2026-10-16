// Business-level sign-up, sign-in and sign-out. Each action waits until the app has settled into the
// resulting state, so specs can assert outcomes without timing workarounds. Passwords are never logged.
import { expect, type Page } from '@playwright/test';
import { HeaderComponent, LoginPage, RegisterPage } from '../pages';
import type { TestLogger } from '../support/logger';
import type { Credentials, NewUser } from '../test-data/users';

export class AuthWorkflow {
  private readonly header: HeaderComponent;
  private readonly loginPage: LoginPage;
  private readonly registerPage: RegisterPage;

  constructor(
    private readonly page: Page,
    private readonly log: TestLogger,
  ) {
    this.header = new HeaderComponent(page);
    this.loginPage = new LoginPage(page);
    this.registerPage = new RegisterPage(page);
  }

  /** Registers through /register; resolves once the header shows the new user as signed in. */
  async signUp(user: NewUser): Promise<void> {
    this.log.info('Sign up', { name: user.name, email: user.email, password: user.password });
    await this.registerPage.goto();
    await this.registerPage.fill(user);
    await this.registerPage.submit.click();
    await expect(this.header.greeting, 'sign-up should sign the new user in').toHaveText(`Hello, ${user.firstName}`);
  }

  /** Signs in through /login (optionally with a redirect target); resolves once the user is signed in. */
  async signIn(credentials: Credentials, options: { redirect?: string; expectedFirstName?: string } = {}): Promise<void> {
    this.log.info('Sign in', { email: credentials.email, password: credentials.password, redirect: options.redirect });
    await this.loginPage.goto(options.redirect);
    await this.submitCredentials(credentials, options.expectedFirstName);
  }

  /** Signs in on the login page that is already open (e.g. after a redirect to /login). */
  async submitCredentials(credentials: Credentials, expectedFirstName?: string): Promise<void> {
    await this.loginPage.login(credentials.email, credentials.password);
    await expect(this.header.greeting, 'sign-in should succeed').toHaveText(expectedFirstName ? `Hello, ${expectedFirstName}` : /^Hello, /);
  }

  /** Signs out from the header; resolves on the home page once the signed-out header is shown. */
  async signOut(): Promise<void> {
    this.log.info('Sign out');
    await this.header.signOut();
    await expect(this.header.loginLink, 'sign-out should show the Sign in link').toBeVisible();
    await expect(this.page).toHaveURL(/\/$/);
  }
}
