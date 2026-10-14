import { Link } from 'react-router-dom';
import { OrderSummary } from '../components/OrderSummary';
import { ProductImage } from '../components/ProductImage';
import { AvailabilityBadge } from '../components/ProductMeta';
import { QuantityControl } from '../components/QuantityControl';
import { MessageState } from '../components/StatusViews';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotice } from '../context/NoticeContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatINR } from '../lib/format';
import type { CartLine } from '../types';

function CartItemRow({ line }: { line: CartLine }) {
  const { setQuantity, removeItem } = useCart();
  const { notify } = useNotice();
  const { product } = line;
  const href = `/product/${product.id}`;

  const onRemove = () => {
    removeItem(product.id);
    notify(`Removed ${product.name} from your cart.`, 'info');
  };

  return (
    <li className="cart-item" data-testid={`cart-item-${product.id}`} data-product-id={product.id}>
      <Link to={href} className="cart-item__media" tabIndex={-1} aria-hidden="true">
        <ProductImage product={product} size="sm" />
      </Link>
      <div className="cart-item__info">
        <h2 className="cart-item__title">
          <Link to={href} data-testid={`cart-item-name-${product.id}`}>
            {product.name}
          </Link>
        </h2>
        <p className="cart-item__price">
          Unit price:{' '}
          <span data-testid={`cart-item-price-${product.id}`} data-amount={product.price}>
            {formatINR(product.price)}
          </span>
        </p>
        <AvailabilityBadge product={product} />
        <div className="cart-item__controls">
          <QuantityControl
            productId={product.id}
            productName={product.name}
            quantity={line.quantity}
            max={line.maxQuantity}
            onChange={(q) => {
              const result = setQuantity(product.id, q);
              return result.ok ? undefined : result.error.message;
            }}
          />
          <button type="button" className="button button--link" onClick={onRemove} data-testid={`remove-from-cart-${product.id}`}>
            Remove<span className="sr-only"> {product.name} from cart</span>
          </button>
        </div>
      </div>
      <p className="cart-item__subtotal">
        <span className="sr-only">Item subtotal: </span>
        <span data-testid={`cart-item-subtotal-${product.id}`} data-amount={line.lineTotal}>
          {formatINR(line.lineTotal)}
        </span>
      </p>
    </li>
  );
}

export function CartPage() {
  useDocumentTitle('Shopping Cart');
  const { lines, summary } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <div className="page" data-testid="cart-page">
      <h1 className="page__title">Shopping Cart</h1>
      {lines.length === 0 ? (
        <MessageState
          testId="empty-cart"
          title="Your cart is empty"
          message={<p>Looks like you haven't added anything yet.</p>}
          actions={
            <Link to="/products" className="button button--primary" data-testid="continue-shopping">
              Continue shopping
            </Link>
          }
        />
      ) : (
        <div className="two-column">
          <section aria-label="Cart items" className="panel">
            <ul className="cart-list" data-testid="cart-items">
              {lines.map((line) => (
                <CartItemRow key={line.product.id} line={line} />
              ))}
            </ul>
            <div className="panel__footer">
              <Link to="/products" className="link-arrow link-arrow--back" data-testid="continue-shopping">
                Continue shopping
              </Link>
            </div>
          </section>
          <aside className="two-column__aside">
            <OrderSummary
              summary={summary}
              prefix="cart"
              footer={
                <>
                  <Link to="/checkout" className="button button--accent button--block button--large" data-testid="proceed-to-checkout">
                    Proceed to checkout
                  </Link>
                  {!isAuthenticated && (
                    <p className="summary-card__note" data-testid="checkout-login-note">
                      You'll be asked to sign in before checkout. Your cart will be saved.
                    </p>
                  )}
                </>
              }
            />
          </aside>
        </div>
      )}
    </div>
  );
}
