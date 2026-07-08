/**
 * @howard-aios/utils — Environment loader with validation
 */

import type { Environment } from '@howard-aios/types';

export interface EnvConfig {
  readonly NODE_ENV: Environment;
  readonly PORT: number;
  readonly HOST: string;
  readonly LOG_LEVEL: string;
  readonly DATABASE_URL: string;
  readonly CORS_ORIGIN: string;
  readonly REDIS_URL: string;
}

const REQUIRED_ENVS: string[] = ['DATABASE_URL'];

export function loadEnv(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as Environment;

  for (const key of REQUIRED_ENVS) {
    if (!process.env[key] && nodeEnv === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: Number(process.env.PORT) || 3000,
    HOST: process.env.HOST ?? '0.0.0.0',
    LOG_LEVEL: process.env.LOG_LEVEL ?? (nodeEnv === 'production' ? 'info' : 'debug'),
    DATABASE_URL:
      process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/howard_aios',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
    REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
  };
}

export function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
