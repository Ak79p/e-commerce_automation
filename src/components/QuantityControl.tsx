import { useEffect, useState, type KeyboardEvent } from 'react';
import { validateQuantity } from '../lib/validation';

interface Props {
  productId: string;
  productName: string;
  quantity: number;
  max: number;
  onChange: (quantity: number) => string | undefined;
}

/**
 * Accessible stepper: −/+ buttons plus an editable number input.
 * Typed values are committed on blur or Enter; invalid values show an error and revert.
 */
export function QuantityControl({ productId, productName, quantity, max, onChange }: Props) {
  const [draft, setDraft] = useState(String(quantity));
  const [error, setError] = useState<string>();
  const inputId = `cart-quantity-${productId}`;
  const errorId = `${inputId}-error`;

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const apply = (next: number) => {
    const failure = onChange(next);
    setError(failure);
    if (failure) setDraft(String(quantity));
  };

  const commit = () => {
    if (draft.trim() === String(quantity)) {
      setError(undefined);
      return;
    }
    const invalid = validateQuantity(draft, max);
    if (invalid) {
      setError(invalid);
      setDraft(String(quantity));
      return;
    }
    apply(Number(draft.trim()));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  };

  return (
    <div className="qty">
      <div className="qty__controls" role="group" aria-label={`Quantity for ${productName}`}>
        <button
          type="button"
          className="qty__button"
          onClick={() => apply(quantity - 1)}
          disabled={quantity <= 1}
          aria-label={`Decrease quantity of ${productName}`}
          data-testid={`cart-decrease-${productId}`}
        >
          −
        </button>
        <label htmlFor={inputId} className="sr-only">
          Quantity of {productName}
        </label>
        <input
          id={inputId}
          className="qty__input"
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          step={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          data-testid={inputId}
        />
        <button
          type="button"
          className="qty__button"
          onClick={() => apply(quantity + 1)}
          disabled={quantity >= max}
          aria-label={`Increase quantity of ${productName}`}
          data-testid={`cart-increase-${productId}`}
        >
          +
        </button>
      </div>
      {error ? (
        <p id={errorId} className="field__error" role="alert" data-testid={`${inputId}-error`}>
          {error}
        </p>
      ) : (
        quantity >= max && (
          <p className="qty__hint" data-testid={`cart-max-${productId}`}>
            Maximum quantity: {max}
          </p>
        )
      )}
    </div>
  );
}
