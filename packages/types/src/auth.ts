/**
 * Auth-related shared types.
 */

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

export interface RefreshRequest {
  refreshToken: string;
}
