import type { ApiError } from '@/types/factory/apiError.ts';

/** Outcome of a factory service call. Errors are returned as values, never thrown across the service boundary. */
export type FactoryResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ApiError };
