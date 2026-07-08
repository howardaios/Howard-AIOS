import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from '@howard-aios/types';

const DEFAULT_SECRET = 'howard-aios-dev-secret';

function getSecret(): string {
  return process.env.JWT_SECRET ?? DEFAULT_SECRET;
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'] };
  return jwt.sign(payload as object, getSecret(), options);
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'] };
  return jwt.sign(payload as object, getSecret(), options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}
