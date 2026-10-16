// Seeded products used by the tests (source of truth: src/data/products.ts).
// Product data is static at runtime, so these values are deterministic in every fresh browser context.
export interface ProductData {
  id: string;
  name: string;
  category: string;
  /** Whole INR, taxes included. */
  price: number;
  stock: number;
}

export const PRODUCTS = {
  wirelessHeadphones: { id: 'PROD-001', name: 'Wireless Headphones', category: 'Electronics', price: 2999, stock: 25 },
  waterBottle: { id: 'PROD-004', name: 'Stainless Steel Water Bottle', category: 'Home & Kitchen', price: 649, stock: 50 },
  laptopStand: { id: 'PROD-005', name: 'Laptop Stand', category: 'Accessories', price: 1599, stock: 35 },
  indianCooking: { id: 'PROD-018', name: 'Everyday Indian Cooking', category: 'Books', price: 449, stock: 14 },
  monsoonGarden: { id: 'PROD-017', name: 'The Monsoon Garden', category: 'Books', price: 349, stock: 60 },
} as const satisfies Record<string, ProductData>;

export const TOTAL_PRODUCTS = 24;

/** Pricing rules (src/lib/pricing.ts): ₹40 delivery below a ₹499 subtotal, free from ₹499. */
export const PRICING = { freeDeliveryThreshold: 499, deliveryFee: 40 } as const;

export function expectedSummary(lines: ReadonlyArray<{ price: number; quantity: number }>) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= PRICING.freeDeliveryThreshold ? 0 : PRICING.deliveryFee;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

/** "₹2,999": the app formats whole rupees with Intl en-IN (src/lib/format.ts). */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export const SEARCH_TERMS = {
  /** Upper-case partial name: matches only PROD-001 (case-insensitive substring search). */
  partialName: { query: 'HEAD', expectedIds: ['PROD-001'] },
  /** Matches nothing in any product name, brand or category. */
  nonexistent: 'zzqx',
} as const;
