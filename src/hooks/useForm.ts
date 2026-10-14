import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { hasErrors } from '../lib/validation';
import type { FieldErrors } from '../types';

type StringRecord<T> = { [K in keyof T]: string };

/**
 * Minimal form state helper with predictable validation timing:
 * - a field is validated when it loses focus (blur);
 * - after a field has been touched (or the form was submitted) it is re-validated on every change,
 *   so errors disappear as soon as the value is corrected;
 * - submit validates every field.
 */
export function useForm<T extends StringRecord<T>>(initialValues: T | (() => T), validate: (values: T) => FieldErrors<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const touched = useRef<Set<keyof T>>(new Set());
  const submitted = useRef(false);

  // Errors returned by the mock API (e.g. duplicate email) stay visible until that field is edited.
  const serverErrors = useRef<FieldErrors<T>>({});

  const revalidate = useCallback(
    (next: T) => {
      const all = validate(next);
      const result: FieldErrors<T> = {};
      for (const key of Object.keys(next) as (keyof T)[]) {
        const clientError = submitted.current || touched.current.has(key) ? all[key] : undefined;
        const message = clientError ?? serverErrors.current[key];
        if (message) result[key] = message;
      }
      setErrors(result);
    },
    [validate],
  );

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const setValue = useCallback(
    (field: keyof T, value: string) => {
      const next = { ...valuesRef.current, [field]: value };
      valuesRef.current = next;
      delete serverErrors.current[field];
      setValues(next);
      if (submitted.current || touched.current.has(field)) revalidate(next);
    },
    [revalidate],
  );

  const field = useCallback(
    (name: keyof T) => ({
      name: name as string,
      value: values[name],
      error: errors[name],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValue(name, e.target.value),
      onBlur: () => {
        touched.current.add(name);
        revalidate(valuesRef.current);
      },
    }),
    [values, errors, setValue, revalidate],
  );

  /** Validates all fields. Returns true when the form is valid. */
  const validateAll = useCallback((): boolean => {
    submitted.current = true;
    serverErrors.current = {};
    const all = validate(valuesRef.current);
    setErrors(all);
    return !hasErrors(all);
  }, [validate]);

  /** Applies field errors returned by a mock API call. */
  const applyServerErrors = useCallback((fieldErrors: Record<string, string> | undefined) => {
    if (!fieldErrors) return;
    serverErrors.current = fieldErrors as FieldErrors<T>;
    setErrors((prev) => ({ ...prev, ...(fieldErrors as FieldErrors<T>) }));
  }, []);

  return { values, errors, field, validateAll, applyServerErrors, setValues };
}

/** Focuses the first field (in DOM order) that currently has an error. */
export function focusFirstError(form: HTMLFormElement | null): void {
  window.requestAnimationFrame(() => {
    const target = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    target?.focus();
  });
}
