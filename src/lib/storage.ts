/**
 * Storage abstraction over window.localStorage.
 *
 * - All keys are namespaced with STORAGE_PREFIX so the demo can be reset without touching other data.
 * - Reads are validated; missing, unparsable or structurally invalid values return the fallback
 *   and the corrupted entry is removed.
 * - Storage failures (private mode, quota, disabled storage) never crash the app; an in-memory
 *   map is used instead for the lifetime of the page.
 */

export const STORAGE_PREFIX = 'shopnest:v1:';

export const StorageKeys = {
  users: 'users',
  session: 'session',
  cart: 'cart',
  orders: 'orders',
  orderSequence: 'orderSequence',
  checkoutDraft: (userId: string) => `checkoutDraft:${userId}`,
} as const;

const memoryFallback = new Map<string, string>();

function backend(): Storage | null {
  try {
    const storage = window.localStorage;
    const probe = `${STORAGE_PREFIX}__probe__`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function rawGet(fullKey: string): string | null {
  const store = backend();
  return store ? store.getItem(fullKey) : (memoryFallback.get(fullKey) ?? null);
}

function rawSet(fullKey: string, value: string): void {
  const store = backend();
  try {
    if (store) store.setItem(fullKey, value);
    else memoryFallback.set(fullKey, value);
  } catch {
    memoryFallback.set(fullKey, value);
  }
}

function rawRemove(fullKey: string): void {
  backend()?.removeItem(fullKey);
  memoryFallback.delete(fullKey);
}

export type Validator<T> = (value: unknown) => value is T;

export const storage = {
  read<T>(key: string, fallback: T, isValid: Validator<T>): T {
    const fullKey = STORAGE_PREFIX + key;
    const raw = rawGet(fullKey);
    if (raw === null) return fallback;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isValid(parsed)) return parsed;
    } catch {
      // fall through: corrupted JSON
    }
    console.warn(`[storage] Discarding invalid data for "${key}".`);
    rawRemove(fullKey);
    return fallback;
  },

  write<T>(key: string, value: T): void {
    rawSet(STORAGE_PREFIX + key, JSON.stringify(value));
  },

  remove(key: string): void {
    rawRemove(STORAGE_PREFIX + key);
  },

  /** Removes every ShopNest key (used by the demo reset). */
  clearAll(): void {
    const store = backend();
    if (store) {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => store.removeItem(k));
    }
    memoryFallback.clear();
  },

  /** Subscribes to changes made in other tabs. Returns an unsubscribe function. */
  subscribe(key: string, listener: () => void): () => void {
    const fullKey = STORAGE_PREFIX + key;
    const handler = (event: StorageEvent) => {
      if (event.key === null || event.key === fullKey) listener();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};

// ---- Small reusable validators -------------------------------------------------------------

export const isString = (v: unknown): v is string => typeof v === 'string';
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
export const isArrayOf =
  <T>(item: Validator<T>): Validator<T[]> =>
  (v: unknown): v is T[] =>
    Array.isArray(v) && v.every(item);
export const hasStringFields = (v: unknown, fields: string[]): v is Record<string, string> =>
  isRecord(v) && fields.every((f) => typeof v[f] === 'string');
