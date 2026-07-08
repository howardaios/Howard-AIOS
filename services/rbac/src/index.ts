/**
 * RBAC Service — Role-Based Access Control
 */

export type { Permission, Role, Policy } from './types';

export type Resource = 'meeting' | 'recording' | 'task' | 'decision' | 'knowledge' | 'memory' | 'inbox' | 'upload' | 'pipeline' | 'llm' | 'search' | 'user' | 'organization';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'list';

interface PermissionRule {
  resource: Resource;
  actions: Action[];
}

// ── Role-Permission Matrix ─────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, PermissionRule[]> = {
  FOUNDER: [
    { resource: 'meeting', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'recording', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'task', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'decision', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'knowledge', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'memory', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'inbox', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'upload', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'pipeline', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'llm', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'search', actions: ['read', 'list'] },
    { resource: 'user', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'organization', actions: ['create', 'read', 'update', 'delete'] },
  ],
  ADMIN: [
    { resource: 'meeting', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'recording', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'task', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'decision', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'knowledge', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'memory', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'inbox', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'upload', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'pipeline', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'llm', actions: ['create', 'read', 'list'] },
    { resource: 'search', actions: ['read', 'list'] },
    { resource: 'user', actions: ['read', 'list'] },
    { resource: 'organization', actions: ['read'] },
  ],
  MANAGER: [
    { resource: 'meeting', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'recording', actions: ['create', 'read', 'update', 'list'] },
    { resource: 'task', actions: ['create', 'read', 'update', 'delete', 'list'] },
    { resource: 'decision', actions: ['create', 'read', 'update', 'list'] },
    { resource: 'knowledge', actions: ['create', 'read', 'update', 'list'] },
    { resource: 'memory', actions: ['create', 'read', 'list'] },
    { resource: 'inbox', actions: ['create', 'read', 'update', 'list'] },
    { resource: 'upload', actions: ['create', 'read', 'list'] },
    { resource: 'pipeline', actions: ['read', 'list'] },
    { resource: 'llm', actions: ['create', 'read', 'list'] },
    { resource: 'search', actions: ['read', 'list'] },
    { resource: 'user', actions: ['read', 'list'] },
  ],
  MEMBER: [
    { resource: 'meeting', actions: ['create', 'read', 'update', 'list'] },
    { resource: 'recording', actions: ['create', 'read', 'list'] },
    { resource: 'task', actions: ['create', 'read', 'update', 'list'] },
    { resource: 'decision', actions: ['read', 'list'] },
    { resource: 'knowledge', actions: ['read', 'list'] },
    { resource: 'memory', actions: ['read', 'list'] },
    { resource: 'inbox', actions: ['create', 'read', 'list'] },
    { resource: 'upload', actions: ['create', 'read', 'list'] },
    { resource: 'pipeline', actions: ['read', 'list'] },
    { resource: 'llm', actions: ['create', 'read'] },
    { resource: 'search', actions: ['read', 'list'] },
  ],
  VIEWER: [
    { resource: 'meeting', actions: ['read', 'list'] },
    { resource: 'recording', actions: ['read', 'list'] },
    { resource: 'task', actions: ['read', 'list'] },
    { resource: 'decision', actions: ['read', 'list'] },
    { resource: 'knowledge', actions: ['read', 'list'] },
    { resource: 'memory', actions: ['read', 'list'] },
    { resource: 'inbox', actions: ['read', 'list'] },
    { resource: 'upload', actions: ['read', 'list'] },
    { resource: 'pipeline', actions: ['read', 'list'] },
    { resource: 'search', actions: ['read'] },
  ],
  GUEST: [
    { resource: 'meeting', actions: ['read', 'list'] },
    { resource: 'knowledge', actions: ['read', 'list'] },
    { resource: 'search', actions: ['read'] },
  ],
};

export class RBACService {
  /**
   * Check if a role has permission to perform an action on a resource.
   */
  checkPermission(role: string, resource: Resource, action: Action): boolean {
    const rules = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS['GUEST'] ?? [];
    const rule = rules.find(r => r.resource === resource);
    if (!rule) return false;
    return rule.actions.includes(action);
  }

  /**
   * Get all permissions for a role.
   */
  getRolePermissions(role: string): PermissionRule[] {
    return ROLE_PERMISSIONS[role] ?? [];
  }

  /**
   * Get all available roles.
   */
  getRoles(): string[] {
    return Object.keys(ROLE_PERMISSIONS);
  }

  /**
   * Assert permission — throws if not allowed.
   */
  assertPermission(role: string, resource: Resource, action: Action): void {
    if (!this.checkPermission(role, resource, action)) {
      throw new RBACError(`Permission denied: ${role} cannot ${action} ${resource}`);
    }
  }
}

export class RBACError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RBACError';
  }
}
