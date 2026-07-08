export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface SessionInfo {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}
