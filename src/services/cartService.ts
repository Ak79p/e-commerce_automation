/**
 * Cart business rules. The cart is a list of { productId, quantity } persisted per browser
 * (it is kept across login/logout). All operations are pure functions over the item list that
 * return an ApiResult; the CartContext applies successful results and persists them.
 */
import { findProductById } from '../data/products';
import { config } from '../lib/config';
import { calculateSummary } from '../lib/pricing';
import { isArrayOf, isRecord, storage, StorageKeys } from '../lib/storage';
import type { ApiResult, CartItem, CartLine, PriceSummary, Product } from '../types';
import { fail, ok } from './api';

const isCartItem = (v: unknown): v is CartItem =>
  isRecord(v) && typeof v.productId === 'string' && typeof v.quantity === 'number';

/** Highest quantity of a product that may be in the cart. */
export function maxQuantityFor(product: Product): number {
  return Math.max(0, Math.min(product.stock, config.maxQuantityPerItem));
}

/** Drops unknown/unavailable products, merges duplicates and clamps quantities to valid ranges. */
export function sanitizeCart(items: CartItem[]): CartItem[] {
  const merged = new Map<string, number>();
  for (const item of items) {
    const product = findProductById(item.productId);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) continue;
    merged.set(product.id, (merged.get(product.id) ?? 0) + item.quantity);
  }
  const result: CartItem[] = [];
  for (const [productId, quantity] of merged) {
    const max = maxQuantityFor(findProductById(productId)!);
    if (max > 0) result.push({ productId, quantity: Math.min(quantity, max) });
  }
  return result;
}

function limitMessage(product: Product, max: number): string {
  return product.stock <= config.maxQuantityPerItem
    ? `Only ${max} unit${max === 1 ? '' : 's'} of ${product.name} available.`
    : `You can buy at most ${max} units of ${product.name} per order.`;
}

export const cartService = {
  load(): CartItem[] {
    const stored = storage.read(StorageKeys.cart, [], isArrayOf(isCartItem));
    const clean = sanitizeCart(stored);
    if (JSON.stringify(clean) !== JSON.stringify(stored)) storage.write(StorageKeys.cart, clean);
    return clean;
  },

  save(items: CartItem[]): void {
    storage.write(StorageKeys.cart, items);
  },

  clear(): void {
    storage.remove(StorageKeys.cart);
  },

  subscribe(listener: () => void): () => void {
    return storage.subscribe(StorageKeys.cart, listener);
  },

  /** Adds `quantity` units, merging with any existing line. */
  addItem(items: CartItem[], productId: string, quantity = 1): ApiResult<CartItem[]> {
    const product = findProductById(productId);
    if (!product) return fail('NOT_FOUND', 'This product does not exist.');
    if (product.availability === 'out_of_stock') return fail('OUT_OF_STOCK', `${product.name} is out of stock.`);
    if (!Number.isInteger(quantity) || quantity < 1) return fail('VALIDATION_ERROR', 'Quantity must be at least 1.');
    const max = maxQuantityFor(product);
    const existing = items.find((i) => i.productId === product.id)?.quantity ?? 0;
    if (existing + quantity > max) {
      const already = existing > 0 ? ` You already have ${existing} in your cart.` : '';
      return fail('QUANTITY_LIMIT', limitMessage(product, max) + already);
    }
    const next = existing
      ? items.map((i) => (i.productId === product.id ? { ...i, quantity: existing + quantity } : i))
      : [...items, { productId: product.id, quantity }];
    return ok(next);
  },

  /** Sets the exact quantity of an existing line. */
  setQuantity(items: CartItem[], productId: string, quantity: number): ApiResult<CartItem[]> {
    const product = findProductById(productId);
    if (!product || !items.some((i) => i.productId === product.id)) return fail('NOT_FOUND', 'Item is not in your cart.');
    if (!Number.isInteger(quantity) || quantity < 1) return fail('VALIDATION_ERROR', 'Quantity must be at least 1.');
    const max = maxQuantityFor(product);
    if (quantity > max) return fail('QUANTITY_LIMIT', limitMessage(product, max));
    return ok(items.map((i) => (i.productId === product.id ? { ...i, quantity } : i)));
  },

  removeItem(items: CartItem[], productId: string): ApiResult<CartItem[]> {
    return ok(items.filter((i) => i.productId !== productId));
  },

  toLines(items: CartItem[]): CartLine[] {
    return items.flatMap((item) => {
      const product = findProductById(item.productId);
      if (!product) return [];
      return [{ product, quantity: item.quantity, lineTotal: product.price * item.quantity, maxQuantity: maxQuantityFor(product) }];
    });
  },

  summarize(lines: CartLine[]): PriceSummary {
    return calculateSummary(lines.map((l) => ({ unitPrice: l.product.price, quantity: l.quantity })));
  },
};
