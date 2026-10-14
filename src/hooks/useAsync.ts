import { useCallback, useEffect, useState, type DependencyList } from 'react';
import type { ApiError, ApiResult } from '../types';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

type KeyedState<T> = { key: string; value: AsyncState<T> };

const LOADING = { status: 'loading' } as const;

/**
 * Runs a mock API call whenever `deps` change. Results are tagged with the deps they were
 * requested for, so stale data is never shown for new inputs (it reports "loading" instead)
 * and late responses for old inputs are ignored.
 */
export function useAsync<T>(request: () => Promise<ApiResult<T>>, deps: DependencyList) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([...deps, attempt]);
  const [state, setState] = useState<KeyedState<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    request().then((result) => {
      if (cancelled) return;
      setState({
        key,
        value: result.ok ? { status: 'success', data: result.data } : { status: 'error', error: result.error },
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const current: AsyncState<T> = state && state.key === key ? state.value : LOADING;
  return { state: current, reload };
}
