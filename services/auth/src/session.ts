import { prisma } from '@howard-aios/database';
import type { Session } from '@howard-aios/database';

export class SessionRepository {
  async create(data: {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }): Promise<Session> {
    return prisma.session.create({ data });
  }

  async findByAccessToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { accessToken: token }, include: { user: true } });
  }

  async findByRefreshToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({ where: { refreshToken: token }, include: { user: true } });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.session.delete({ where: { id } }).catch(() => {});
  }

  async deleteByAccessToken(token: string): Promise<void> {
    await prisma.session.delete({ where: { accessToken: token } }).catch(() => {});
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  }

  async cleanExpired(): Promise<number> {
    const result = await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return result.count;
  }
}
