import type { Category, CategorySlug } from '../types';

export const CATEGORIES: readonly Category[] = [
  { slug: 'electronics', name: 'Electronics', description: 'Audio, wearables, keyboards and gadgets' },
  { slug: 'fashion', name: 'Fashion', description: 'Footwear, clothing and everyday style' },
  { slug: 'home-kitchen', name: 'Home & Kitchen', description: 'Cookware, drinkware and home essentials' },
  { slug: 'books', name: 'Books', description: 'Fiction, cooking, technology and wellbeing' },
  { slug: 'accessories', name: 'Accessories', description: 'Desk, travel and personal accessories' },
];

export function getCategory(slug: string | null | undefined): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}
