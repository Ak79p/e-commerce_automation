import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SelectField, TextField } from '../components/FormField';
import { OrderSummary } from '../components/OrderSummary';
import { Alert, MessageState } from '../components/StatusViews';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotice } from '../context/NoticeContext';
import { INDIAN_STATES } from '../data/states';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { focusFirstError, useForm } from '../hooks/useForm';
import { formatINR } from '../lib/format';
import { hasErrors, validateShipping } from '../lib/validation';
import { checkoutService } from '../services/checkoutService';
import { orderService } from '../services/orderService';
import type { User } from '../types';

function CheckoutForm({ user }: { user: User }) {
  const navigate = useNavigate();
  const { items, lines, summary, clear } = useCart();
  const { notify } = useNotice();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const { values, errors, field, validateAll, applyServerErrors } = useForm(() => checkoutService.loadDraft(user), validateShipping);

  // Persist the draft on every change so reloads and cart <-> checkout navigation keep it.
  useEffect(() => {
    checkoutService.saveDraft(user.id, values);
  }, [user.id, values]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    setAttempted(true);
    if (!validateAll()) {
      focusFirstError(formRef.current);
      return;
    }
    setSubmitting(true);
    const result = await orderService.placeOrder({ items, shipping: values });
    if (result.ok) {
      checkoutService.clearDraft(user.id);
      navigate(`/order-confirmation/${result.data.id}`, { replace: true });
      clear();
      notify(`Order ${result.data.id} placed successfully.`);
      return;
    }
    setSubmitting(false);
    applyServerErrors(result.error.fieldErrors);
    setFormError(result.error.message);
    if (result.error.fieldErrors) focusFirstError(formRef.current);
  };

  const showSummaryError = attempted && hasErrors(errors);

  return (
    <div className="two-column">
      <form
        ref={formRef}
        className="panel form"
        onSubmit={onSubmit}
        noValidate
        aria-labelledby="shipping-heading"
        data-testid="checkout-form"
      >
        <h2 id="shipping-heading" className="panel__title">
          Shipping details
        </h2>
        {showSummaryError && (
          <Alert tone="error" testId="checkout-error-summary">
            Please correct the highlighted fields before placing your order.
          </Alert>
        )}
        {formError && !showSummaryError && (
          <Alert tone="error" testId="checkout-error">
            {formError}
          </Alert>
        )}
        <div className="form-grid">
          <TextField id="checkout-full-name" label="Full name" autoComplete="name" required {...field('fullName')} />
          <TextField id="checkout-email" label="Email" type="email" autoComplete="email" required {...field('email')} />
          <TextField
            id="checkout-phone"
            label="Phone number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            hint="10-digit mobile number, e.g. 9876543210"
            required
            {...field('phone')}
          />
          <div className="form-grid__full">
            <TextField
              id="checkout-address"
              label="Address line"
              autoComplete="street-address"
              hint="House number, street and area"
              required
              {...field('addressLine')}
            />
          </div>
          <TextField id="checkout-city" label="City" autoComplete="address-level2" required {...field('city')} />
          <SelectField
            id="checkout-state"
            label="State"
            autoComplete="address-level1"
            placeholder="Select a state"
            options={INDIAN_STATES}
            required
            {...field('state')}
          />
          <TextField
            id="checkout-postal-code"
            label="Postal code (PIN)"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            hint="6 digits, e.g. 560001"
            required
            {...field('postalCode')}
          />
        </div>

        <section className="payment-note" aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="panel__title">
            Payment method
          </h2>
          <p data-testid="payment-method">
            <strong>Cash on Delivery</strong> — demo store, no payment details are collected.
          </p>
        </section>

        <div className="form__actions">
          <button
            type="submit"
            className="button button--accent button--large"
            disabled={submitting}
            aria-busy={submitting || undefined}
            data-testid="checkout-submit"
          >
            {submitting ? 'Placing order…' : `Place order · ${formatINR(summary.total)}`}
          </button>
          <Link to="/cart" className="button button--outline button--large" data-testid="back-to-cart">
            Back to cart
          </Link>
        </div>
      </form>

      <aside className="two-column__aside">
        <OrderSummary
          summary={summary}
          prefix="checkout"
          footer={
            <Link to="/products" className="link-arrow" data-testid="continue-shopping">
              Continue shopping
            </Link>
          }
        >
          <ul className="summary-lines" data-testid="checkout-items">
            {lines.map((l) => (
              <li key={l.product.id} className="summary-lines__item" data-testid={`checkout-item-${l.product.id}`}>
                <span className="summary-lines__name">
                  {l.product.name} <span className="summary-lines__qty">× {l.quantity}</span>
                </span>
                <span data-testid={`checkout-item-subtotal-${l.product.id}`}>{formatINR(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </OrderSummary>
      </aside>
    </div>
  );
}

/** Policy: checkout requires sign-in (enforced by RequireAuth in the router) and a non-empty cart. */
export function CheckoutPage() {
  useDocumentTitle('Checkout');
  const { user } = useAuth();
  const { lines } = useCart();

  return (
    <div className="page" data-testid="checkout-page">
      <nav aria-label="Checkout steps" className="steps">
        <ol>
          <li>
            <Link to="/cart">Cart</Link>
          </li>
          <li aria-current="step">Shipping</li>
          <li>Confirmation</li>
        </ol>
      </nav>
      <h1 className="page__title">Checkout</h1>
      {lines.length === 0 || !user ? (
        <MessageState
          testId="checkout-empty-cart"
          title="Your cart is empty"
          message={<p>Add at least one item to your cart before checking out.</p>}
          actions={
            <Link to="/products" className="button button--primary" data-testid="continue-shopping">
              Continue shopping
            </Link>
          }
        />
      ) : (
        <CheckoutForm user={user} />
      )}
    </div>
  );
}
