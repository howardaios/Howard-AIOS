import type { FastifyPluginAsync } from 'fastify';
import { AuthService, AuthError } from '@howard-aios/auth';

const svc = new AuthService();

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/login', {
    schema: { description: 'Login with email and password', tags: ['Auth'] },
  }, async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      return reply.status(400).send({ success: false, code: 400, message: 'Email and password required', data: null });
    }
    try {
      const result = await svc.login(email, password, req.ip, req.headers['user-agent']);
      return reply.send({ success: true, code: 200, message: 'Login successful', data: result });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(err.statusCode).send({ success: false, code: err.statusCode, message: err.message, data: null });
      }
      throw err;
    }
  });

  app.post('/auth/logout', {
    schema: { description: 'Logout and invalidate session', tags: ['Auth'] },
  }, async (req, reply) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      await svc.logout(auth.slice(7));
    }
    return reply.send({ success: true, code: 200, message: 'Logged out', data: null });
  });

  app.post('/auth/refresh', {
    schema: { description: 'Refresh access token', tags: ['Auth'] },
  }, async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      return reply.status(400).send({ success: false, code: 400, message: 'Refresh token required', data: null });
    }
    try {
      const result = await svc.refresh(refreshToken, req.ip, req.headers['user-agent']);
      return reply.send({ success: true, code: 200, message: 'Token refreshed', data: result });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(err.statusCode).send({ success: false, code: err.statusCode, message: err.message, data: null });
      }
      throw err;
    }
  });

  app.get('/auth/me', {
    schema: { description: 'Get current user info', tags: ['Auth'] },
  }, async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.status(401).send({ success: false, code: 401, message: 'No token provided', data: null });
    }
    try {
      const user = await svc.getUserInfo(auth.slice(7));
      return reply.send({ success: true, code: 200, message: 'OK', data: user });
    } catch (err) {
      if (err instanceof AuthError) {
        return reply.status(err.statusCode).send({ success: false, code: err.statusCode, message: err.message, data: null });
      }
      throw err;
    }
  });

  app.post('/auth/demo-user', {
    schema: { description: 'Get or create demo user (for demo convenience)', tags: ['Auth'] },
  }, async (_req, reply) => {
    const result = await svc.getOrCreateDemoUser();
    return reply.send({ success: true, code: 200, message: 'Demo user ready', data: result });
  });
};
