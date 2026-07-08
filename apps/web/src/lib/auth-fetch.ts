/**
 * Global authenticated fetch wrapper.
 * Reads JWT token from localStorage and attaches Authorization header
 * plus x-organization-id to every API request.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);
      if (user?.organizationId) headers['x-organization-id'] = user.organizationId;
    } catch {
      // ignore
    }
  }
  return headers;
}

/**
 * Drop-in replacement for `fetch()` that automatically attaches auth headers.
 * Usage: `authFetch('/api/dashboard').then(r => r.json())`
 */
export function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const authHeaders = getAuthHeaders();
  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders,
      ...init?.headers,
    },
  });
}
