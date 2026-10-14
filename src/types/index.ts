// Shared domain types for the ShopNest demo application.

export type CategorySlug = 'electronics' | 'fashion' | 'home-kitchen' | 'books' | 'accessories';

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
}

export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  /** Stable identifier, e.g. PROD-001. */
  id: string;
  name: string;
  description: string;
  category: CategorySlug;
  brand: string;
  /** Selling price in whole Indian Rupees (INR). */
  price: number;
  /** Maximum retail price in whole INR (used to show a discount). */
  mrp: number;
  stock: number;
  availability: Availability;
  /** Optional path to an image in /public. A generated SVG fallback is used otherwise. */
  image?: string;
  highlights: string[];
}

/** Public user profile (never contains the password). */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

/** Demo-only stored account record. Passwords are stored in plain text on purpose: this is NOT real auth. */
export interface StoredUserRecord extends User {
  password: string;
}

export interface Session {
  userId: string;
  token: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
  maxQuantity: number;
}

export interface PriceSummary {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface OrderLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus = 'placed';

export interface Order {
  id: string;
  userId: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  shipping: ShippingDetails;
  paymentMethod: 'cash_on_delivery';
  summary: PriceSummary;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'NOT_FOUND'
  | 'UNAUTHENTICATED'
  | 'EMPTY_CART'
  | 'OUT_OF_STOCK'
  | 'QUANTITY_LIMIT'
  | 'UNKNOWN';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

/** Consistent response envelope returned by every mock service. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: ProductSort;
}
