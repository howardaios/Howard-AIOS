/**
 * @howard-aios/types — Result<T> monad for error handling
 *
 * Follows the Railway-Oriented Programming pattern.
 * All service methods should return Result<T> instead of throwing.
 */

export type Result<T, E = AiosError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function fail<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

export function isFail<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}

/**
 * Base error interface for all AIOS errors.
 */
export interface AiosError {
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
  readonly cause?: unknown;
}
