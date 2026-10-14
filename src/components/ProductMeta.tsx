import { discountPercent, formatINR } from '../lib/format';
import type { Product } from '../types';

export function PriceTag({ product, testId, large }: { product: Product; testId?: string; large?: boolean }) {
  const off = discountPercent(product.price, product.mrp);
  return (
    <div className={`price${large ? ' price--large' : ''}`}>
      <span className="price__current" data-testid={testId} data-price={product.price}>
        {formatINR(product.price)}
      </span>
      {off > 0 && (
        <>
          <span className="price__mrp">
            <span className="sr-only">M.R.P.: </span>
            <s>{formatINR(product.mrp)}</s>
          </span>
          <span className="price__off">{off}% off</span>
        </>
      )}
    </div>
  );
}

export function availabilityLabel(product: Product): string {
  switch (product.availability) {
    case 'out_of_stock':
      return 'Out of stock';
    case 'low_stock':
      return `Only ${product.stock} left in stock`;
    default:
      return 'In stock';
  }
}

export function AvailabilityBadge({ product, testId }: { product: Product; testId?: string }) {
  return (
    <p className={`availability availability--${product.availability}`} data-testid={testId} data-availability={product.availability}>
      {availabilityLabel(product)}
    </p>
  );
}
