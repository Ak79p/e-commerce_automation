import { getCategory } from '../data/categories';
import { findProductById, PRODUCTS } from '../data/products';
import type { ApiResult, Product, ProductQuery, ProductSort } from '../types';
import { fail, ok, simulateRequest } from './api';

export const SORT_OPTIONS: ReadonlyArray<{ value: ProductSort; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

export function isProductSort(value: string | null): value is ProductSort {
  return SORT_OPTIONS.some((o) => o.value === value);
}

/**
 * Search rules: trimmed, case-insensitive, partial (substring) match against the product
 * name, brand or category name. An empty query matches every product.
 */
export function matchesQuery(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const categoryName = getCategory(product.category)?.name ?? '';
  return [product.name, product.brand, categoryName].some((field) => field.toLowerCase().includes(q));
}

function sortProducts(products: Product[], sort: ProductSort): Product[] {
  const sorted = [...products];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted; // seed order (by product ID)
  }
}

export const productService = {
  /** GET /products?q=&category=&sort= */
  listProducts(query: ProductQuery = {}): Promise<ApiResult<Product[]>> {
    return simulateRequest(() => {
      const { q = '', category, sort = 'featured' } = query;
      if (category && !getCategory(category)) return ok([]);
      const filtered = PRODUCTS.filter(
        (p) => (!category || p.category === category) && matchesQuery(p, q),
      );
      return ok(sortProducts(filtered, sort));
    });
  },

  /** GET /products/:id */
  getProduct(id: string): Promise<ApiResult<Product>> {
    return simulateRequest(() => {
      const product = findProductById(id);
      return product ? ok(product) : fail('NOT_FOUND', `No product found with ID "${id}".`);
    });
  },
};
