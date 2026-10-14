import { Link, useParams } from 'react-router-dom';
import { OrderSummary } from '../components/OrderSummary';
import { LoadingState, MessageState } from '../components/StatusViews';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDateTime, formatINR } from '../lib/format';
import { orderService } from '../services/orderService';
import type { Order } from '../types';

function OrderDetails({ order }: { order: Order }) {
  const s = order.shipping;
  return (
    <div className="confirmation" data-testid="order-confirmation" data-order-id={order.id}>
      <section className="confirmation__banner" aria-labelledby="confirmation-heading">
        <span className="confirmation__check" aria-hidden="true">
          ✓
        </span>
        <div>
          <h1 id="confirmation-heading" className="page__title">
            Thank you, your order has been placed!
          </h1>
          <p>
            Order number: <strong data-testid="order-id">{order.id}</strong>
          </p>
          <p className="muted">
            Placed on <span data-testid="order-date">{formatDateTime(order.createdAt)}</span>. A confirmation would be
            sent to <span data-testid="order-email">{s.email}</span> (demo — no email is sent).
          </p>
        </div>
      </section>

      <div className="two-column">
        <div className="stack">
          <section className="panel" aria-labelledby="items-heading">
            <h2 id="items-heading" className="panel__title">
              Items in this order
            </h2>
            <ul className="summary-lines" data-testid="order-items">
              {order.lines.map((l) => (
                <li key={l.productId} className="summary-lines__item" data-testid={`order-item-${l.productId}`}>
                  <span className="summary-lines__name">
                    <Link to={`/product/${l.productId}`}>{l.name}</Link>{' '}
                    <span className="summary-lines__qty">
                      × {l.quantity} @ {formatINR(l.unitPrice)}
                    </span>
                  </span>
                  <span>{formatINR(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel" aria-labelledby="ship-heading">
            <h2 id="ship-heading" className="panel__title">
              Delivery address
            </h2>
            <address className="address" data-testid="order-shipping-address">
              {s.fullName}
              <br />
              {s.addressLine}
              <br />
              {s.city}, {s.state} {s.postalCode}
              <br />
              Phone: {s.phone}
            </address>
            <p>
              Payment: <strong>Cash on Delivery</strong>
            </p>
          </section>
        </div>
        <aside className="two-column__aside">
          <OrderSummary
            summary={order.summary}
            prefix="order"
            title="Payment summary"
            footer={
              <div className="stack stack--tight">
                <Link to="/products" className="button button--primary button--block" data-testid="continue-shopping">
                  Continue shopping
                </Link>
                <Link to="/orders" className="button button--outline button--block" data-testid="view-orders">
                  View my orders
                </Link>
              </div>
            }
          />
        </aside>
      </div>
    </div>
  );
}

export function OrderConfirmationPage() {
  const { orderId = '' } = useParams();
  const { state } = useAsync(() => orderService.getOrder(orderId), [orderId]);
  useDocumentTitle(state.status === 'success' ? `Order ${state.data.id}` : 'Order');

  return (
    <div className="page" data-testid="order-confirmation-page">
      {state.status === 'loading' && <LoadingState label="Loading your order…" />}
      {state.status === 'error' && (
        <MessageState
          asPageHeading
          testId="order-not-found"
          title="Order not found"
          message={<p>{state.error.message}</p>}
          actions={
            <Link to="/orders" className="button button--primary">
              View my orders
            </Link>
          }
        />
      )}
      {state.status === 'success' && <OrderDetails order={state.data} />}
    </div>
  );
}
