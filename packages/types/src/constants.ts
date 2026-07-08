/**
 * @howard-aios/types — Shared constants
 */

export const AIOS_NAME = 'Howard AIOS';
export const AIOS_VERSION = '0.6.0';

/** Default pagination */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Token configuration */
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/** Rate limiting */
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 60;
export const AI_RATE_LIMIT_PER_MINUTE = 20;

/** Database */
export const MAX_QUERY_TIMEOUT_MS = 30_000;

/** Upload limits (bytes) */
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 100 * 1024 * 1024;
