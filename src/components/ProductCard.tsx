import { Link } from 'react-router-dom';
import { getCategory } from '../data/categories';
import { useCart } from '../context/CartContext';
import { useNotice } from '../context/NoticeContext';
import type { Product } from '../types';
import { ProductImage } from './ProductImage';
import { AvailabilityBadge, PriceTag } from './ProductMeta';

export function ProductCard({ product }: { product: Product }) {
  const { addItem, quantityOf } = useCart();
  const { notify } = useNotice();
  const inCart = quantityOf(product.id);
  const outOfStock = product.availability === 'out_of_stock';
  const href = `/product/${product.id}`;

  const onAdd = () => {
    const result = addItem(product.id, 1);
    if (result.ok) notify(`Added ${product.name} to your cart.`);
    else notify(result.error.message, 'error');
  };

  return (
    <article className="product-card" data-testid={`product-card-${product.id}`} data-product-id={product.id}>
      <Link to={href} className="product-card__media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} />
      </Link>
      <div className="product-card__body">
        <p className="product-card__category">{getCategory(product.category)?.name}</p>
        <h3 className="product-card__title">
          <Link to={href} data-testid={`product-link-${product.id}`}>
            {product.name}
          </Link>
        </h3>
        <PriceTag product={product} testId={`product-price-${product.id}`} />
        <AvailabilityBadge product={product} testId={`product-availability-${product.id}`} />
        <div className="product-card__actions">
          <button
            type="button"
            className="button button--primary button--block"
            onClick={onAdd}
            disabled={outOfStock}
            data-testid={`add-to-cart-${product.id}`}
          >
            {outOfStock ? 'Out of stock' : 'Add to cart'}
            <span className="sr-only">: {product.name}</span>
          </button>
          {inCart > 0 && (
            <p className="product-card__in-cart" data-testid={`in-cart-${product.id}`}>
              <Link to="/cart">{inCart} in cart</Link>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, testId = 'product-grid' }: { products: readonly Product[]; testId?: string }) {
  return (
    <ul className="product-grid" data-testid={testId} aria-label="Products">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
