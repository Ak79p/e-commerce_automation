/**
 * Pure validation utilities shared by pages (instant feedback) and services (authoritative checks).
 * Every function returns a map of field -> message; an empty map means the input is valid.
 */
import { INDIAN_STATES } from '../data/states';
import type { FieldErrors, ShippingDetails } from '../types';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const NAME_MIN_LENGTH = 2;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Indian mobile number: 10 digits starting with 6-9. Spaces and hyphens are ignored. */
const PHONE_PATTERN = /^[6-9]\d{9}$/;
/** Indian PIN code: 6 digits, not starting with 0. */
const POSTAL_CODE_PATTERN = /^[1-9]\d{5}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '');
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}

// ---- Registration ---------------------------------------------------------------------------

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateRegistration(input: RegistrationInput): FieldErrors<RegistrationInput> {
  const errors: FieldErrors<RegistrationInput> = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Name is required.';
  else if (name.length < NAME_MIN_LENGTH) errors.name = `Name must be at least ${NAME_MIN_LENGTH} characters.`;

  if (!input.email.trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(input.email)) errors.email = 'Enter a valid email address.';

  if (!input.password) errors.password = 'Password is required.';
  else if (input.password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  else if (input.password.length > PASSWORD_MAX_LENGTH)
    errors.password = `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;

  if (!input.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (input.confirmPassword !== input.password) errors.confirmPassword = 'Passwords do not match.';

  return errors;
}

// ---- Login ----------------------------------------------------------------------------------

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLogin(input: LoginInput): FieldErrors<LoginInput> {
  const errors: FieldErrors<LoginInput> = {};
  if (!input.email.trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(input.email)) errors.email = 'Enter a valid email address.';
  if (!input.password) errors.password = 'Password is required.';
  return errors;
}

// ---- Checkout -------------------------------------------------------------------------------

export function validateShippingField(field: keyof ShippingDetails, rawValue: string): string | undefined {
  const value = rawValue.trim();
  switch (field) {
    case 'fullName':
      if (!value) return 'Full name is required.';
      if (value.length < NAME_MIN_LENGTH) return `Full name must be at least ${NAME_MIN_LENGTH} characters.`;
      return undefined;
    case 'email':
      if (!value) return 'Email is required.';
      if (!isValidEmail(value)) return 'Enter a valid email address.';
      return undefined;
    case 'phone':
      if (!value) return 'Phone number is required.';
      if (!PHONE_PATTERN.test(normalizePhone(value)))
        return 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.';
      return undefined;
    case 'addressLine':
      if (!value) return 'Address is required.';
      if (value.length < 5) return 'Address must be at least 5 characters.';
      return undefined;
    case 'city':
      if (!value) return 'City is required.';
      if (!/^[A-Za-z][A-Za-z .'-]*$/.test(value)) return 'City can only contain letters, spaces and . \' -';
      return undefined;
    case 'state':
      if (!value) return 'State is required.';
      if (!INDIAN_STATES.includes(value)) return 'Select a valid state.';
      return undefined;
    case 'postalCode':
      if (!value) return 'Postal code is required.';
      if (!POSTAL_CODE_PATTERN.test(value)) return 'Enter a valid 6-digit PIN code.';
      return undefined;
    default:
      return undefined;
  }
}

export const SHIPPING_FIELDS: readonly (keyof ShippingDetails)[] = [
  'fullName',
  'email',
  'phone',
  'addressLine',
  'city',
  'state',
  'postalCode',
];

export function validateShipping(input: ShippingDetails): FieldErrors<ShippingDetails> {
  const errors: FieldErrors<ShippingDetails> = {};
  for (const field of SHIPPING_FIELDS) {
    const message = validateShippingField(field, input[field] ?? '');
    if (message) errors[field] = message;
  }
  return errors;
}

// ---- Quantity -------------------------------------------------------------------------------

export function validateQuantity(raw: string | number, max: number): string | undefined {
  const text = String(raw).trim();
  if (!/^\d+$/.test(text)) return 'Enter a whole number.';
  const value = Number(text);
  if (value < 1) return 'Quantity must be at least 1.';
  if (value > max) return `You can buy at most ${max} of this item.`;
  return undefined;
}
