import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, AuthError } from '@howard-aios/auth';
import type { JwtPayload } from '@howard-aios/types';

const authService = new AuthService();

// Routes that don't require authentication
const PUBLIC_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/demo-user',
  '/api/health',
  '/api/version',
  '/',
]);

/**
 * Extract JWT token from Authorization header.
 */
function extractToken(req: FastifyRequest): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

/**
 * Check if a path is public (doesn't require auth).
 */
function isPublicPath(url: string): boolean {
  // Remove query string
  const path = url.split('?')[0];
  if (PUBLIC_PATHS.has(path)) return true;
  // Swagger docs
  if (path.startsWith('/docs')) return true;
  return false;
}

/**
 * Register authentication hooks on the Fastify instance.
 */
export async function registerAuth(app: FastifyInstance): Promise<void> {
  // Decorate request with user property
  app.decorateRequest('user', null as JwtPayload | null);

  // Pre-handler hook for authentication
  app.addHook('preHandler', async (req: FastifyRequest, _reply: FastifyReply) => {
    if (isPublicPath(req.url)) return;

    const token = extractToken(req);
    if (!token) {
      // Allow unauthenticated access with a warning (dev mode)
      // In production, this should throw
      if (process.env.NODE_ENV === 'production') {
        throw new AuthError('Authentication required', 401);
      }
      return;
    }

    try {
      const payload = authService.validateToken(token);
      (req as unknown as { user: JwtPayload }).user = payload;
    } catch {
      if (process.env.NODE_ENV === 'production') {
        throw new AuthError('Invalid or expired token', 401);
      }
    }
  });
}

export { authService };
