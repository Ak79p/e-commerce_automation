// Reads the app's namespaced localStorage entries from the browser context under test.
// Assertions on persisted state (session, cart, orders, checkout drafts) go through these helpers.
import type { Page } from '@playwright/test';

/** Same prefix as the app's STORAGE_PREFIX (src/lib/storage.ts). */
export const STORAGE_PREFIX = 'shopnest:v1:';

export const StorageKeys = {
  session: 'session',
  users: 'users',
  cart: 'cart',
  orders: 'orders',
  checkoutDraft: (userId: string) => `checkoutDraft:${userId}`,
} as const;

export interface StoredSession {
  userId: string;
  token: string;
  createdAt: string;
}

export interface StoredCartItem {
  productId: string;
  quantity: number;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface StoredOrder {
  id: string;
  userId: string;
  lines: { productId: string; quantity: number; unitPrice: number; lineTotal: number }[];
  summary: { itemCount: number; subtotal: number; deliveryFee: number; total: number };
}

/** Raw string value of `shopnest:v1:<key>`, or null when the key is absent. */
export async function readRaw(page: Page, key: string): Promise<string | null> {
  return page.evaluate((fullKey) => window.localStorage.getItem(fullKey), `${STORAGE_PREFIX}${key}`);
}

/** Parsed JSON value of `shopnest:v1:<key>`, or null when it is missing or not valid JSON. */
export async function readJson<T>(page: Page, key: string): Promise<T | null> {
  const raw = await readRaw(page, key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Returns the parsed `shopnest:v1:session` value, or null when it is missing or not valid JSON. */
export async function readSession(page: Page): Promise<StoredSession | null> {
  return readJson<StoredSession>(page, StorageKeys.session);
}

export async function readCart(page: Page): Promise<StoredCartItem[]> {
  return (await readJson<StoredCartItem[]>(page, StorageKeys.cart)) ?? [];
}

/** Registered (non-seeded) users. Passwords are stripped so they can never end up in a report. */
export async function readRegisteredUsers(page: Page): Promise<StoredUser[]> {
  const users = (await readJson<(StoredUser & { password?: string })[]>(page, StorageKeys.users)) ?? [];
  return users.map(({ password: _password, ...user }) => user);
}

export async function readOrders(page: Page): Promise<StoredOrder[]> {
  return (await readJson<StoredOrder[]>(page, StorageKeys.orders)) ?? [];
}
