/**
 * Helpers that make the in-browser mock services behave like a network API:
 * every call is asynchronous, has simulated latency, and resolves to an ApiResult envelope.
 */
import { config } from '../lib/config';
import type { ApiError, ApiErrorCode, ApiResult } from '../types';

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ApiErrorCode, message: string, fieldErrors?: Record<string, string>): ApiResult<T> {
  const error: ApiError = { code, message };
  if (fieldErrors && Object.keys(fieldErrors).length > 0) error.fieldErrors = fieldErrors;
  return { ok: false, error };
}

/** Runs a handler after the configured mock latency. Unexpected exceptions become UNKNOWN errors. */
export function simulateRequest<T>(handler: () => ApiResult<T>): Promise<ApiResult<T>> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      try {
        resolve(handler());
      } catch (err) {
        console.error('[mock-api] Unexpected error', err);
        resolve(fail('UNKNOWN', 'Something went wrong. Please try again.'));
      }
    }, config.mockLatencyMs);
  });
}

/** Removes undefined entries so field error maps serialize cleanly. */
export function compactErrors(errors: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) if (value) result[key] = value;
  return result;
}
