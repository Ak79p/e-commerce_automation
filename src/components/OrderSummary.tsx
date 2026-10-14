import type { ReactNode } from 'react';
import { formatINR } from '../lib/format';
import { FREE_DELIVERY_THRESHOLD } from '../lib/pricing';
import type { PriceSummary } from '../types';

interface Props {
  summary: PriceSummary;
  /** Test-id prefix: "cart" -> cart-subtotal, cart-delivery, cart-total. */
  prefix: string;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

export function OrderSummary({ summary, prefix, title = 'Order Summary', children, footer }: Props) {
  const remaining = FREE_DELIVERY_THRESHOLD - summary.subtotal;
  return (
    <section className="summary-card" aria-labelledby={`${prefix}-summary-heading`} data-testid={`${prefix}-summary`}>
      <h2 id={`${prefix}-summary-heading`} className="summary-card__title">
        {title}
      </h2>
      {children}
      <dl className="summary-card__rows">
        <div className="summary-card__row">
          <dt>
            Subtotal ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'})
          </dt>
          <dd data-testid={`${prefix}-subtotal`} data-amount={summary.subtotal}>
            {formatINR(summary.subtotal)}
          </dd>
        </div>
        <div className="summary-card__row">
          <dt>Delivery</dt>
          <dd data-testid={`${prefix}-delivery`} data-amount={summary.deliveryFee}>
            {summary.deliveryFee === 0 ? 'FREE' : formatINR(summary.deliveryFee)}
          </dd>
        </div>
        <div className="summary-card__row summary-card__row--total">
          <dt>Total</dt>
          <dd data-testid={`${prefix}-total`} data-amount={summary.total}>
            {formatINR(summary.total)}
          </dd>
        </div>
      </dl>
      {summary.subtotal > 0 && remaining > 0 && (
        <p className="summary-card__note" data-testid={`${prefix}-delivery-note`}>
          Add {formatINR(remaining)} more for free delivery.
        </p>
      )}
      {footer}
    </section>
  );
}
