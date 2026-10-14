import { Link } from 'react-router-dom';
import { LoadingState, MessageState } from '../components/StatusViews';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDateTime, formatINR, pluralize } from '../lib/format';
import { orderService } from '../services/orderService';

export function OrdersPage() {
  useDocumentTitle('My Orders');
  const { state, reload } = useAsync(() => orderService.listOrders(), []);

  return (
    <div className="page" data-testid="orders-page">
      <h1 className="page__title">My Orders</h1>
      {state.status === 'loading' && <LoadingState label="Loading your orders…" />}
      {state.status === 'error' && (
        <MessageState
          tone="error"
          testId="orders-error"
          title="We couldn't load your orders"
          message={state.error.message}
          actions={
            <button type="button" className="button" onClick={reload}>
              Try again
            </button>
          }
        />
      )}
      {state.status === 'success' && state.data.length === 0 && (
        <MessageState
          testId="no-orders"
          title="You haven't placed any orders yet"
          actions={
            <Link to="/products" className="button button--primary">
              Start shopping
            </Link>
          }
        />
      )}
      {state.status === 'success' && state.data.length > 0 && (
        <ul className="order-list" data-testid="order-list">
          {state.data.map((o) => (
            <li key={o.id} className="panel order-row" data-testid={`order-row-${o.id}`}>
              <div>
                <h2 className="order-row__id">{o.id}</h2>
                <p className="muted">
                  {formatDateTime(o.createdAt)} · {pluralize(o.summary.itemCount, 'item')}
                </p>
                <p className="order-row__items">{o.lines.map((l) => `${l.name} × ${l.quantity}`).join(', ')}</p>
              </div>
              <div className="order-row__side">
                <p className="order-row__total">{formatINR(o.summary.total)}</p>
                <Link to={`/order-confirmation/${o.id}`} className="button button--outline" data-testid={`order-view-${o.id}`}>
                  View order<span className="sr-only"> {o.id}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
