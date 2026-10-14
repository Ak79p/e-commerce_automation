/**
 * Mock order placement and order history. Orders are stored in localStorage and scoped to the
 * user who placed them. No payment is taken: every order is "Cash on Delivery" in demo mode.
 */
import { findProductById } from '../data/products';
import { calculateSummary } from '../lib/pricing';
import { isArrayOf, isRecord, storage, StorageKeys } from '../lib/storage';
import { hasErrors, normalizeEmail, normalizePhone, validateShipping } from '../lib/validation';
import type { ApiResult, CartItem, Order, OrderLine, ShippingDetails } from '../types';
import { compactErrors, fail, ok, simulateRequest } from './api';
import { authService } from './authService';
import { maxQuantityFor } from './cartService';

const FIRST_ORDER_NUMBER = 100001;

const isOrder = (v: unknown): v is Order =>
  isRecord(v) &&
  typeof v.id === 'string' &&
  typeof v.userId === 'string' &&
  typeof v.createdAt === 'string' &&
  Array.isArray(v.lines) &&
  isRecord(v.shipping) &&
  isRecord(v.summary);

function readOrders(): Order[] {
  return storage.read(StorageKeys.orders, [], isArrayOf(isOrder));
}

function nextOrderId(existing: Order[]): string {
  const stored = storage.read(StorageKeys.orderSequence, FIRST_ORDER_NUMBER, (v): v is number => Number.isInteger(v));
  const used = new Set(existing.map((o) => o.id));
  let n = Math.max(stored, FIRST_ORDER_NUMBER);
  while (used.has(`ORD-${n}`)) n += 1;
  storage.write(StorageKeys.orderSequence, n + 1);
  return `ORD-${n}`;
}

export interface PlaceOrderRequest {
  items: CartItem[];
  shipping: ShippingDetails;
}

export const orderService = {
  /** POST /orders — validates session, cart, stock and shipping details, then records the order. */
  placeOrder({ items, shipping }: PlaceOrderRequest): Promise<ApiResult<Order>> {
    return simulateRequest(() => {
      const user = authService.getCurrentUser();
      if (!user) return fail('UNAUTHENTICATED', 'Please sign in to place your order.');
      if (items.length === 0) return fail('EMPTY_CART', 'Your cart is empty.');

      const errors = validateShipping(shipping);
      if (hasErrors(errors)) return fail('VALIDATION_ERROR', 'Please correct the highlighted fields.', compactErrors(errors));

      const lines: OrderLine[] = [];
      for (const item of items) {
        const product = findProductById(item.productId);
        if (!product) return fail('NOT_FOUND', 'An item in your cart is no longer available.');
        if (product.availability === 'out_of_stock') return fail('OUT_OF_STOCK', `${product.name} is out of stock.`);
        if (item.quantity < 1 || item.quantity > maxQuantityFor(product))
          return fail('QUANTITY_LIMIT', `The quantity of ${product.name} is not available.`);
        lines.push({
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
        });
      }

      const orders = readOrders();
      const order: Order = {
        id: nextOrderId(orders),
        userId: user.id,
        createdAt: new Date().toISOString(),
        status: 'placed',
        lines,
        paymentMethod: 'cash_on_delivery',
        shipping: {
          fullName: shipping.fullName.trim(),
          email: normalizeEmail(shipping.email),
          phone: normalizePhone(shipping.phone.trim()),
          addressLine: shipping.addressLine.trim(),
          city: shipping.city.trim(),
          state: shipping.state,
          postalCode: shipping.postalCode.trim(),
        },
        summary: calculateSummary(lines),
      };
      storage.write(StorageKeys.orders, [...orders, order]);
      return ok(order);
    });
  },

  /** GET /orders/:id — only returns orders that belong to the signed-in user. */
  getOrder(orderId: string): Promise<ApiResult<Order>> {
    return simulateRequest(() => {
      const user = authService.getCurrentUser();
      if (!user) return fail('UNAUTHENTICATED', 'Please sign in to view this order.');
      const order = readOrders().find((o) => o.id === orderId && o.userId === user.id);
      return order ? ok(order) : fail('NOT_FOUND', `Order "${orderId}" was not found.`);
    });
  },

  /** GET /orders — newest first. */
  listOrders(): Promise<ApiResult<Order[]>> {
    return simulateRequest(() => {
      const user = authService.getCurrentUser();
      if (!user) return fail('UNAUTHENTICATED', 'Please sign in to view your orders.');
      const mine = readOrders().filter((o) => o.userId === user.id);
      return ok(mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)));
    });
  },
};
