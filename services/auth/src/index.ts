import bcrypt from 'bcryptjs';
import { prisma } from '@howard-aios/database';
import type { User } from '@howard-aios/database';
import type { LoginResponse, UserInfo } from '@howard-aios/types';
import { signAccessToken, signRefreshToken, verifyToken } from './jwt';
import { SessionRepository } from './session';

export type { JwtPayload } from '@howard-aios/types';
export type { AuthToken, SessionInfo } from './types';
export { SessionRepository } from './session';
export { signAccessToken, signRefreshToken, verifyToken, decodeToken } from './jwt';

const BCRYPT_ROUNDS = 10;
const DEMO_PASSWORD = '$2b$10$NKrfA2eXAO19wuVgr8rY/e2Uckut7dmz0plyWpuNHB3WCc3OlVef.';

export class AuthService {
  private sessions = new SessionRepository();

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Login with email/password. Returns JWT tokens and user info.
   */
  async login(email: string, password: string, ip?: string, userAgent?: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AuthError('Invalid credentials', 401);

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) throw new AuthError('Invalid credentials', 401);

    // Update last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return this.createSession(user, ip, userAgent);
  }

  /**
   * Logout by deleting the session.
   */
  async logout(accessToken: string): Promise<void> {
    await this.sessions.deleteByAccessToken(accessToken);
  }

  /**
   * Refresh access token using refresh token.
   */
  async refresh(refreshToken: string, ip?: string, userAgent?: string): Promise<LoginResponse> {
    const session = await this.sessions.findByRefreshToken(refreshToken);
    if (!session) throw new AuthError('Invalid refresh token', 401);
    if (session.expiresAt < new Date()) {
      await this.sessions.deleteById(session.id);
      throw new AuthError('Refresh token expired', 401);
    }

    // Delete old session
    await this.sessions.deleteById(session.id);

    // Fetch fresh user data
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new AuthError('User not found', 401);

    return this.createSession(user, ip, userAgent);
  }

  /**
   * Validate an access token and return the payload.
   */
  validateToken(token: string) {
    try {
      return verifyToken(token);
    } catch {
      throw new AuthError('Invalid or expired token', 401);
    }
  }

  /**
   * Get or create demo user. For demo convenience.
   */
  async getOrCreateDemoUser(): Promise<LoginResponse> {
    const email = 'demo@howard.ai';
    const name = 'Demo User';
    const DEMO_ORG_ID = '10000000-0000-0000-0000-000000000001';

    // Find or create demo organization
    let org = await prisma.organization.findUnique({ where: { id: DEMO_ORG_ID } });
    if (!org) {
      org = await prisma.organization.create({
        data: { id: DEMO_ORG_ID, name: '北京哈顿幼儿园', shortName: 'Demo' },
      });
    }

    // Find or create demo user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = DEMO_PASSWORD;
      user = await prisma.user.create({
        data: { email, name, passwordHash, role: 'FOUNDER', organizationId: DEMO_ORG_ID },
      });
    }

    return this.createSession(user);
  }

  /**
   * Get current user info from token.
   */
  async getUserInfo(token: string): Promise<UserInfo> {
    const payload = this.validateToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new AuthError('User not found', 401);
    return toUserInfo(user);
  }

  private async createSession(user: User, ip?: string, userAgent?: string): Promise<LoginResponse> {
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.sessions.create({
      userId: user.id,
      accessToken,
      refreshToken,
      expiresAt,
      ip,
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAt.toISOString(),
      user: toUserInfo(user),
    };
  }
}

function toUserInfo(user: User): UserInfo {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  };
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}
