import type { PriceSummary } from '../types';

/** Orders with a subtotal below this amount (INR) pay a flat delivery fee. */
export const FREE_DELIVERY_THRESHOLD = 499;
export const DELIVERY_FEE = 40;

/** Single source of truth for cart and checkout totals. All amounts are whole INR, prices include GST. */
export function calculateSummary(lines: ReadonlyArray<{ unitPrice: number; quantity: number }>): PriceSummary {
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return { itemCount, subtotal, deliveryFee, total: subtotal + deliveryFee };
}
