import { prisma } from '@howard-aios/database';
export type SearchDomain = 'meeting' | 'inbox' | 'document' | 'memory' | 'knowledge';
export interface SearchResult { id: string; domain: SearchDomain; title: string; snippet: string; score: number; metadata: Record<string, unknown>; createdAt: Date; }
export interface SearchQuery { query: string; domains?: SearchDomain[]; limit?: number; offset?: number; organizationId: string; }
export interface SearchResponse { results: SearchResult[]; total: number; query: string; domains: SearchDomain[]; tookMs: number; }
export class SearchService {
  async search(q: SearchQuery): Promise<SearchResponse> {
    const start = Date.now();
    const domains = q.domains ?? ['meeting','inbox','document','memory','knowledge'];
    const limit = q.limit ?? 20;
    const all: SearchResult[] = [];
    const results = await Promise.all(domains.map(d => this.searchDomain(d, q.query, q.organizationId, limit)));
    for (const r of results) all.push(...r);
    all.sort((a, b) => b.score - a.score);
    const paginated = all.slice(q.offset ?? 0, (q.offset ?? 0) + limit);
    return { results: paginated, total: all.length, query: q.query, domains, tookMs: Date.now() - start };
  }
  private async searchDomain(domain: SearchDomain, query: string, orgId: string, limit: number): Promise<SearchResult[]> {
    const s = query.toLowerCase();
    try {
      switch (domain) {
        case 'meeting': {
          const items = await prisma.meeting.findMany({ where: { organizationId: orgId, OR: [{ title: { contains: s, mode: 'insensitive' } }, { description: { contains: s, mode: 'insensitive' } }] }, take: limit, orderBy: { startedAt: 'desc' } });
          return items.map(m => ({ id: m.id, domain: 'meeting' as SearchDomain, title: m.title, snippet: m.description ?? '', score: this.score(m.title, query), metadata: { status: m.status }, createdAt: m.createdAt }));
        }
        case 'inbox': {
          const items = await prisma.inboxItem.findMany({ where: { organizationId: orgId, OR: [{ title: { contains: s, mode: 'insensitive' } }, { content: { contains: s, mode: 'insensitive' } }] }, take: limit, orderBy: { createdAt: 'desc' } });
          return items.map(i => ({ id: i.id, domain: 'inbox' as SearchDomain, title: i.title ?? 'Untitled', snippet: i.content.slice(0, 200), score: this.score(i.title ?? '', query), metadata: { sourceType: i.sourceType }, createdAt: i.createdAt }));
        }
        case 'document': {
          const items = await prisma.document.findMany({ where: { organizationId: orgId, OR: [{ title: { contains: s, mode: 'insensitive' } }, { content: { contains: s, mode: 'insensitive' } }] }, take: limit, orderBy: { createdAt: 'desc' } });
          return items.map(d => ({ id: d.id, domain: 'document' as SearchDomain, title: d.title, snippet: (d.content ?? '').slice(0, 200), score: this.score(d.title, query), metadata: { type: d.type }, createdAt: d.createdAt }));
        }
        case 'memory': {
          const items = await prisma.memory.findMany({ where: { organizationId: orgId, content: { contains: s, mode: 'insensitive' } }, take: limit, orderBy: { createdAt: 'desc' } });
          return items.map(m => ({ id: m.id, domain: 'memory' as SearchDomain, title: m.content.slice(0, 50), snippet: m.content.slice(0, 200), score: this.score(m.content, query), metadata: { source: m.source }, createdAt: m.createdAt }));
        }
        case 'knowledge': {
          const items = await prisma.knowledgeNode.findMany({ where: { organizationId: orgId, OR: [{ title: { contains: s, mode: 'insensitive' } }, { content: { contains: s, mode: 'insensitive' } }] }, take: limit, orderBy: { confidence: 'desc' } });
          return items.map(n => ({ id: n.id, domain: 'knowledge' as SearchDomain, title: n.title, snippet: (n.content ?? '').slice(0, 200), score: this.score(n.title, query), metadata: { type: n.type }, createdAt: n.createdAt }));
        }
        default: return [];
      }
    } catch { return []; }
  }
  private score(text: string, query: string): number {
    const l = text.toLowerCase(), q = query.toLowerCase();
    if (l === q) return 1.0; if (l.includes(q)) return 0.8;
    const words = q.split(/\s+/); const matched = words.filter(w => l.includes(w));
    return matched.length / words.length * 0.7;
  }
}
