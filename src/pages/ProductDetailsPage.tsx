import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { AvailabilityBadge, PriceTag } from '../components/ProductMeta';
import { Alert, LoadingState, MessageState } from '../components/StatusViews';
import { useCart } from '../context/CartContext';
import { useNotice } from '../context/NoticeContext';
import { getCategory } from '../data/categories';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { maxQuantityFor } from '../services/cartService';
import { productService } from '../services/productService';
import type { Product } from '../types';

function ProductDetails({ product }: { product: Product }) {
  const { addItem, quantityOf } = useCart();
  const { notify } = useNotice();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const inCart = quantityOf(product.id);
  const max = maxQuantityFor(product);
  const remaining = Math.max(0, max - inCart);
  const outOfStock = product.availability === 'out_of_stock';
  const category = getCategory(product.category);

  useEffect(() => {
    if (quantity > Math.max(1, remaining)) setQuantity(Math.max(1, remaining));
  }, [remaining, quantity]);

  const onAdd = () => {
    const result = addItem(product.id, quantity);
    if (result.ok) {
      const text = `Added ${quantity} × ${product.name} to your cart.`;
      setMessage({ tone: 'success', text });
      notify(text);
      setQuantity(1);
    } else {
      setMessage({ tone: 'error', text: result.error.message });
    }
  };

  return (
    <article className="product-detail" data-testid={`product-detail-${product.id}`} data-product-id={product.id}>
      <div className="product-detail__media">
        <ProductImage product={product} size="lg" />
      </div>
      <div className="product-detail__info">
        <p className="product-detail__brand">
          {product.brand} · <Link to={`/products?category=${product.category}`}>{category?.name}</Link>
        </p>
        <h1 className="page__title" data-testid="product-title">
          {product.name}
        </h1>
        <p className="product-detail__id">
          Product ID: <span data-testid="product-id">{product.id}</span>
        </p>
        <PriceTag product={product} testId="product-price" large />
        <p className="product-detail__tax">Inclusive of all taxes</p>
        <AvailabilityBadge product={product} testId="product-availability" />

        <div className="purchase-box">
          {outOfStock ? (
            <p className="purchase-box__note">This item is currently unavailable.</p>
          ) : remaining === 0 ? (
            <p className="purchase-box__note" data-testid="max-in-cart">
              You have the maximum quantity ({max}) of this item in your cart.
            </p>
          ) : (
            <div className="purchase-box__qty">
              <label htmlFor="product-quantity">Quantity</label>
              <select
                id="product-quantity"
                className="input select"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                data-testid="product-quantity"
              >
                {Array.from({ length: remaining }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="purchase-box__actions">
            <button
              type="button"
              className="button button--primary button--large"
              onClick={onAdd}
              disabled={outOfStock || remaining === 0}
              data-testid={`add-to-cart-${product.id}`}
            >
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
            {inCart > 0 && (
              <Link to="/cart" className="button button--outline button--large" data-testid="go-to-cart">
                Go to cart ({inCart})
              </Link>
            )}
          </div>
          {inCart > 0 && (
            <p className="purchase-box__note" data-testid="in-cart-quantity">
              {inCart} already in your cart.
            </p>
          )}
          {message && (
            <Alert tone={message.tone} testId={message.tone === 'error' ? 'add-to-cart-error' : 'add-to-cart-success'}>
              {message.text}
            </Alert>
          )}
        </div>

        <section aria-labelledby="about-heading" className="product-detail__about">
          <h2 id="about-heading">About this item</h2>
          <p data-testid="product-description">{product.description}</p>
          <ul>
            {product.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}

export function ProductDetailsPage() {
  const { productId = '' } = useParams();
  const { state, reload } = useAsync(() => productService.getProduct(productId), [productId]);
  const product = state.status === 'success' ? state.data : null;
  const category = product ? getCategory(product.category) : undefined;
  useDocumentTitle(product?.name ?? (state.status === 'error' ? 'Product not found' : 'Loading product'));

  return (
    <div className="page" data-testid="product-details-page">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          <li>
            <Link to="/">Home</Link>
          </li>
          {category && (
            <li>
              <Link to={`/products?category=${category.slug}`}>{category.name}</Link>
            </li>
          )}
          <li aria-current="page">{product?.name ?? 'Product'}</li>
        </ol>
      </nav>
      {state.status === 'loading' && <LoadingState label="Loading product…" />}
      {state.status === 'error' &&
        (state.error.code === 'NOT_FOUND' ? (
          <MessageState
            asPageHeading
            testId="product-not-found"
            title="Product not found"
            message={<p>{state.error.message} It may have been removed or the link is incorrect.</p>}
            actions={
              <Link to="/products" className="button button--primary">
                Browse all products
              </Link>
            }
          />
        ) : (
          <MessageState
            asPageHeading
            tone="error"
            testId="product-error"
            title="We couldn't load this product"
            message={state.error.message}
            actions={
              <button type="button" className="button" onClick={reload}>
                Try again
              </button>
            }
          />
        ))}
      {product && <ProductDetails key={product.id} product={product} />}
    </div>
  );
}
