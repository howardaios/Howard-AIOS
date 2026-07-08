import { randomUUID } from 'node:crypto';
import { prisma } from '@howard-aios/database';

// ─── Memory Types ────────────────────────────────────────────────────────────

export type MemoryStatus = 'active' | 'merged' | 'archived' | 'expired';

export interface MemoryEntry {
  id: string;
  content: string;
  source: string;
  sourceId?: string;
  tags: string[];
  status: MemoryStatus;
  importance: number;
  accessCount: number;
  lastAccessedAt: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  mergedFrom?: string[];
  expiresAt?: Date;
}

// ─── Memory Service ──────────────────────────────────────────────────────────

export class MemoryService {
  // ── Extract ────────────────────────────────────────────────────────────────

  async extract(text: string, source: string, sourceId?: string, orgId?: string): Promise<MemoryEntry[]> {
    const memories: MemoryEntry[] = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    for (const sentence of sentences.slice(0, 20)) {
      const trimmed = sentence.trim();
      const importance = this.calculateImportance(trimmed);
      if (importance > 0.3) {
        memories.push(await this.create(trimmed, source, sourceId, importance, orgId));
      }
    }

    return memories;
  }

  // ── Merge ──────────────────────────────────────────────────────────────────

  async merge(ids: string[], orgId?: string): Promise<MemoryEntry | null> {
    const entries: MemoryEntry[] = [];
    for (const id of ids) {
      const e = await this.get(id);
      if (e) entries.push(e);
    }
    if (entries.length < 2) return entries[0] ?? null;

    const merged = await this.create(
      entries.map((e) => e.content).join(' | '),
      entries[0].source,
      undefined,
      Math.max(...entries.map((e) => e.importance)),
      orgId,
    );
    merged.mergedFrom = ids;
    merged.tags = [...new Set(entries.flatMap((e) => e.tags))];

    // Mark originals as merged
    for (const id of ids) {
      await prisma.memory.update({ where: { id }, data: { status: 'merged' } });
    }

    // Update merged memory tags
    await prisma.memory.update({ where: { id: merged.id }, data: { tags: merged.tags, mergedFrom: ids } });

    return merged;
  }

  // ── Auto-merge similar ─────────────────────────────────────────────────────

  async autoMerge(threshold = 0.7, orgId?: string): Promise<MemoryEntry[]> {
    const active = await this.listActive(orgId);
    const merged: MemoryEntry[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < active.length; i++) {
      if (processed.has(active[i].id)) continue;
      const group = [active[i]];

      for (let j = i + 1; j < active.length; j++) {
        if (processed.has(active[j].id)) continue;
        if (this.similarity(active[i].content, active[j].content) >= threshold) {
          group.push(active[j]);
          processed.add(active[j].id);
        }
      }

      if (group.length > 1) {
        const result = await this.merge(group.map((m) => m.id), orgId);
        if (result) merged.push(result);
      }
    }

    return merged;
  }

  // ── Rank ───────────────────────────────────────────────────────────────────

  async rank(limit = 50, orgId?: string): Promise<MemoryEntry[]> {
    const active = await this.listActive(orgId);
    return active
      .sort((a, b) => {
        const scoreA = a.importance * 0.5 + Math.min(a.accessCount / 10, 0.3) + (Date.now() - a.lastAccessedAt.getTime() < 86400000 ? 0.2 : 0);
        const scoreB = b.importance * 0.5 + Math.min(b.accessCount / 10, 0.3) + (Date.now() - b.lastAccessedAt.getTime() < 86400000 ? 0.2 : 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  // ── Archive ────────────────────────────────────────────────────────────────

  async archiveOlderThan(days: number, orgId?: string): Promise<number> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const cutoff = new Date(Date.now() - days * 86400000);
    const result = await prisma.memory.updateMany({
      where: {
        organizationId,
        status: 'active',
        lastAccessedAt: { lt: cutoff },
      },
      data: { status: 'archived' },
    });
    return result.count;
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(content: string, source: string, sourceId?: string, importance?: number, orgId?: string): Promise<MemoryEntry> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const now = new Date();
    const tags = this.extractTags(content);
    const imp = importance ?? this.calculateImportance(content);

    const row = await prisma.memory.create({
      data: {
        id: randomUUID(),
        content,
        source,
        sourceId,
        tags,
        importance: imp,
        accessCount: 0,
        lastAccessedAt: now,
        status: 'active',
        organizationId,
      },
    });

    return toMemoryEntry(row);
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    const row = await prisma.memory.findUnique({ where: { id } });
    if (!row) return undefined;
    // Increment access count
    await prisma.memory.update({
      where: { id },
      data: { accessCount: { increment: 1 }, lastAccessedAt: new Date() },
    });
    return toMemoryEntry({ ...row, accessCount: row.accessCount + 1, lastAccessedAt: new Date() });
  }

  async listActive(orgId?: string): Promise<MemoryEntry[]> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const rows = await prisma.memory.findMany({
      where: { organizationId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toMemoryEntry);
  }

  async listAll(orgId?: string): Promise<MemoryEntry[]> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const rows = await prisma.memory.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toMemoryEntry);
  }

  async search(query: string, limit = 20, orgId?: string): Promise<MemoryEntry[]> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const rows = await prisma.memory.findMany({
      where: {
        organizationId,
        status: 'active',
        content: { contains: query.toLowerCase(), mode: 'insensitive' },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toMemoryEntry);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.memory.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getStats(orgId?: string): Promise<{ total: number; active: number; merged: number; archived: number }> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const [total, active, merged, archived] = await Promise.all([
      prisma.memory.count({ where: { organizationId } }),
      prisma.memory.count({ where: { organizationId, status: 'active' } }),
      prisma.memory.count({ where: { organizationId, status: 'merged' } }),
      prisma.memory.count({ where: { organizationId, status: 'archived' } }),
    ]);
    return { total, active, merged, archived };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private calculateImportance(text: string): number {
    let score = 0.5;
    const lower = text.toLowerCase();
    if (/important|critical|urgent|must|key|essential/.test(lower)) score += 0.2;
    if (/deadline|due|asap|immediately/.test(lower)) score += 0.15;
    if (/decision|agreed|approved|rejected/.test(lower)) score += 0.15;
    if (text.length > 100) score += 0.1;
    return Math.min(1, score);
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();
    if (/meeting|call|discussion/.test(lower)) tags.push('meeting');
    if (/task|todo|action/.test(lower)) tags.push('task');
    if (/decision|agreed|approved/.test(lower)) tags.push('decision');
    if (/risk|concern|issue/.test(lower)) tags.push('risk');
    return tags;
  }

  private similarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

// ─── Prisma Row Converter ──────────────────────────────────────────────────────

function toMemoryEntry(row: {
  id: string; content: string; source: string; sourceId: string | null;
  tags: string[]; importance: number; accessCount: number;
  lastAccessedAt: Date | null; status: string; mergedFrom: string[];
  createdAt: Date; updatedAt: Date;
}): MemoryEntry {
  return {
    id: row.id,
    content: row.content,
    source: row.source,
    sourceId: row.sourceId ?? undefined,
    tags: row.tags,
    status: row.status as MemoryStatus,
    importance: row.importance,
    accessCount: row.accessCount,
    lastAccessedAt: row.lastAccessedAt ?? row.createdAt,
    metadata: {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    mergedFrom: row.mergedFrom.length > 0 ? row.mergedFrom : undefined,
  };
}
