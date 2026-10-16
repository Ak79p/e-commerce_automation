// Test-side page object for the /login screen (not the app's src/pages/LoginPage.tsx React component).
import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  /** The page's only h1 ("Sign in"); located by role because the form label and button share the text. */
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  /** Form-level error for rejected credentials. */
  readonly error: Locator;
  /** Shown when the redirect target is /checkout. */
  readonly requiredNotice: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.email = page.getByTestId('login-email');
    this.password = page.getByTestId('login-password');
    this.submit = page.getByTestId('login-submit');
    this.emailError = page.getByTestId('login-email-error');
    this.passwordError = page.getByTestId('login-password-error');
    this.error = page.getByTestId('login-error');
    this.requiredNotice = page.getByTestId('login-required-notice');
  }

  async goto(redirect?: string): Promise<void> {
    await this.page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
