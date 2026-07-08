/**
 * @howard-aios/types — Shared error classes
 */

import type { AiosError } from './result';

export class BaseError extends Error implements AiosError {
  public readonly code: string;
  public readonly statusCode: number;
  public override readonly cause?: unknown;

  constructor(code: string, message: string, statusCode: number, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

export class NotFoundError extends BaseError {
  constructor(entity: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${entity} with id '${id}' not found` : `${entity} not found`,
      404,
    );
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, cause?: unknown) {
    super('VALIDATION_ERROR', message, 400, cause);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class InternalError extends BaseError {
  constructor(message = 'Internal server error', cause?: unknown) {
    super('INTERNAL_ERROR', message, 500, cause);
  }
}
