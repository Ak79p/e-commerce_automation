// Page object for /register (sign-up). Field error test ids are `<field-id>-error` (src/components/FormField.tsx).
import type { Locator, Page } from '@playwright/test';

export class RegisterPage {
  readonly heading: Locator;
  readonly form: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;
  readonly submit: Locator;
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;
  /** Form-level error, used only for errors without field details. */
  readonly formError: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.form = page.getByTestId('signup-form');
    this.name = page.getByTestId('signup-name');
    this.email = page.getByTestId('signup-email');
    this.password = page.getByTestId('signup-password');
    this.confirmPassword = page.getByTestId('signup-confirm-password');
    this.submit = page.getByTestId('signup-submit');
    this.nameError = page.getByTestId('signup-name-error');
    this.emailError = page.getByTestId('signup-email-error');
    this.passwordError = page.getByTestId('signup-password-error');
    this.confirmPasswordError = page.getByTestId('signup-confirm-password-error');
    this.formError = page.getByTestId('signup-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  async fill(user: { name: string; email: string; password: string; confirmPassword?: string }): Promise<void> {
    await this.name.fill(user.name);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.confirmPassword.fill(user.confirmPassword ?? user.password);
  }

  /** Types a value and moves focus away, which triggers the field's on-blur validation. */
  async enterAndBlur(field: Locator, value: string): Promise<void> {
    await field.fill(value);
    await field.blur();
  }
}
