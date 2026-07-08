import type { ApiResponse } from '@howard-aios/types';

export function success<T>(data: T, message = 'OK'): ApiResponse<T> {
  return {
    success: true,
    code: 0,
    message,
    data,
  };
}

export function error(message = 'Error', code = -1): ApiResponse<null> {
  return {
    success: false,
    code,
    message,
    data: null,
  };
}
