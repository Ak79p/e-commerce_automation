import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface BaseProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  testId?: string;
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

function FieldShell({ id, label, error, hint, testId, required, children }: BaseProps & { required?: boolean; children: ReactNode }) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field__error" data-testid={`${testId ?? id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>;

export function TextField({ id, label, error, hint, testId, required, ...inputProps }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} testId={testId} required={required}>
      <input
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, error, hint)}
        data-testid={testId ?? id}
        {...inputProps}
      />
    </FieldShell>
  );
}

type SelectFieldProps = BaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & { options: readonly string[]; placeholder: string };

export function SelectField({ id, label, error, hint, testId, required, options, placeholder, ...selectProps }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} testId={testId} required={required}>
      <select
        id={id}
        className="input select"
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, error, hint)}
        data-testid={testId ?? id}
        {...selectProps}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
