import { useEffect, useState } from 'react';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string; httpStatus?: number }
  | { status: 'success'; data: T };

/** Runs an API call when its dependencies change and tracks loading/error/success. */
export function useApi<T>(load: () => Promise<T>, deps: unknown[]): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false; // ignore late responses after navigating away
    setState({ status: 'loading' });
    load()
      .then((data) => !cancelled && setState({ status: 'success', data }))
      .catch((err: { message?: string; status?: number }) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err.message ?? 'Something went wrong',
            httpStatus: err.status,
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // `load` is a new function on every render, so callers pass the values it depends on.
  }, deps);

  return state;
}
