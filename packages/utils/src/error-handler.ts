/**
 * @howard-aios/utils — Error handler utilities
 */

import {
  BaseError,
  InternalError,
  type ApiResponse,
} from '@howard-aios/types';
import { error as errorResponse } from './response';

/**
 * Converts any thrown error into a standardized ApiResponse.
 */
export function handleError(err: unknown): { status: number; body: ApiResponse<null> } {
  if (err instanceof BaseError) {
    return {
      status: err.statusCode,
      body: errorResponse(err.message, err.statusCode),
    };
  }

  const internal = new InternalError(
    err instanceof Error ? err.message : 'Unknown error',
    err,
  );

  return {
    status: 500,
    body: errorResponse(internal.message, 500),
  };
}
