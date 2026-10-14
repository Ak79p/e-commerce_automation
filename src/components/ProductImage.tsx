import type { Product } from '../types';

/** Simple category glyphs drawn in a 100×100 box. */
const GLYPHS: Record<Product['category'], string> = {
  electronics: 'M28 58v-6a22 22 0 0 1 44 0v6 M24 56h8v20h-8a4 4 0 0 1-4-4v-12a4 4 0 0 1 4-4z M76 56h-8v20h8a4 4 0 0 0 4-4v-12a4 4 0 0 0-4-4z',
  fashion: 'M38 26l-16 10 6 12 8-4v32h28V44l8 4 6-12-16-10a12 12 0 0 1-24 0z',
  'home-kitchen': 'M26 38h40v28a10 10 0 0 1-10 10H36a10 10 0 0 1-10-10z M66 44h6a8 8 0 0 1 0 16h-6 M36 30c0-4 4-4 4-8 M46 30c0-4 4-4 4-8 M56 30c0-4 4-4 4-8',
  books: 'M50 32c-8-6-18-6-26-4v44c8-2 18-2 26 4 8-6 18-6 26-4V28c-8-2-18-2-26 4z M50 32v44',
  accessories: 'M30 40h40l4 36H26z M40 40v-6a10 10 0 0 1 20 0v6',
};

function hueFor(id: string): number {
  const n = Number(id.replace(/\D/g, '')) || 0;
  return (n * 47 + 170) % 360;
}

/**
 * Renders the product image if one is configured; otherwise a deterministic, locally generated
 * SVG illustration (no network dependency, identical on every load).
 */
export function ProductImage({ product, size = 'md' }: { product: Product; size?: 'sm' | 'md' | 'lg' }) {
  if (product.image) {
    return <img className={`product-image product-image--${size}`} src={product.image} alt={product.name} loading="lazy" />;
  }
  const hue = hueFor(product.id);
  const gradientId = `grad-${product.id}-${size}`;
  return (
    <svg
      className={`product-image product-image--${size}`}
      viewBox="0 0 100 100"
      role="img"
      aria-label={product.name}
      data-testid={`product-image-${product.id}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 70% 94%)`} />
          <stop offset="1" stopColor={`hsl(${(hue + 40) % 360} 65% 84%)`} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      <circle cx="50" cy="52" r="34" fill="#ffffff" opacity="0.55" />
      <path
        d={GLYPHS[product.category]}
        fill="none"
        stroke={`hsl(${hue} 55% 32%)`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
