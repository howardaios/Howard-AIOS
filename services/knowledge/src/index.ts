import { randomUUID } from 'node:crypto';
import { prisma, type Prisma } from '@howard-aios/database';

// ─── Knowledge Types ─────────────────────────────────────────────────────────

export type KnowledgeNodeType = 'person' | 'company' | 'task' | 'decision' | 'risk' | 'keyword' | 'timeline' | 'concept' | 'fact';

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  title: string;
  content: string;
  confidence: number;
  source: string;
  sourceId?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeEdge {
  id: string;
  fromId: string;
  toId: string;
  type: string;
  weight: number;
  metadata: Record<string, unknown>;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface ExtractionResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  source: string;
  sourceId: string;
}

// ─── Knowledge Extractor ─────────────────────────────────────────────────────

export class KnowledgeExtractor {
  extract(text: string, source: string, sourceId?: string): ExtractionResult {
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];

    // Extract people (patterns: "Name said", "Name mentioned", "@Name")
    const peopleRegex = /(?:^|\s)((?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|mentioned|proposed|asked|agreed|noted))/gm;
    let m;
    while ((m = peopleRegex.exec(text)) !== null) {
      const name = m[1].split(' ').slice(0, -1).join(' ');
      nodes.push(this.createNode('person', name, `Person extracted from ${source}`, source, sourceId));
    }

    // Extract companies (patterns: common suffixes)
    const companyRegex = /\b([A-Z][A-Za-z]*(?:\s+(?:Inc|Corp|Ltd|LLC|Co|Group|Tech|AI|Labs))\.?)/g;
    while ((m = companyRegex.exec(text)) !== null) {
      nodes.push(this.createNode('company', m[1], `Company extracted from ${source}`, source, sourceId));
    }

    // Extract tasks (patterns: "TODO", "need to", "should", "must")
    const taskRegex = /(?:TODO|FIXME|need to|should|must|will|plan to|action item)[:\s]+([^.!?\n]{5,100})/gi;
    while ((m = taskRegex.exec(text)) !== null) {
      nodes.push(this.createNode('task', m[1].trim(), `Task from ${source}`, source, sourceId));
    }

    // Extract decisions
    const decisionRegex = /(?:decided|decision|agreed|approved|rejected|chosen)[:\s]+([^.!?\n]{5,100})/gi;
    while ((m = decisionRegex.exec(text)) !== null) {
      nodes.push(this.createNode('decision', m[1].trim(), `Decision from ${source}`, source, sourceId));
    }

    // Extract risks
    const riskRegex = /(?:risk|concern|warning|danger|issue|problem|blocker)[:\s]+([^.!?\n]{5,100})/gi;
    while ((m = riskRegex.exec(text)) !== null) {
      nodes.push(this.createNode('risk', m[1].trim(), `Risk from ${source}`, source, sourceId));
    }

    // Extract keywords (top-frequency nouns)
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter((w) => w.length > 3);
    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'were', 'will', 'would', 'could', 'should', 'about', 'their', 'there', 'what', 'when', 'where', 'which', 'who']);
    const freq = new Map<string, number>();
    for (const w of words) {
      if (!stopWords.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
    }
    const topKeywords = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    for (const [word, count] of topKeywords) {
      nodes.push(this.createNode('keyword', word, `Keyword (${count}x) from ${source}`, source, sourceId, 0.6));
    }

    // Extract timeline items (dates)
    const dateRegex = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g;
    while ((m = dateRegex.exec(text)) !== null) {
      nodes.push(this.createNode('timeline', m[1], `Date reference from ${source}`, source, sourceId));
    }

    // Create edges between co-occurring people
    const peopleNodes = nodes.filter((n) => n.type === 'person');
    for (let i = 0; i < peopleNodes.length; i++) {
      for (let j = i + 1; j < peopleNodes.length; j++) {
        edges.push({
          id: randomUUID(),
          fromId: peopleNodes[i].id,
          toId: peopleNodes[j].id,
          type: 'related_to',
          weight: 0.5,
          metadata: {},
        });
      }
    }

    return { nodes, edges, source, sourceId: sourceId ?? '' };
  }

  private createNode(type: KnowledgeNodeType, title: string, content: string, source: string, sourceId?: string, confidence = 0.85): KnowledgeNode {
    const now = new Date();
    return {
      id: randomUUID(),
      type,
      title,
      content,
      confidence,
      source,
      sourceId,
      tags: [type, source],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
  }
}

// ─── Knowledge Builder Service ───────────────────────────────────────────────

export class KnowledgeService {
  private extractor: KnowledgeExtractor;

  constructor(extractor?: KnowledgeExtractor) {
    this.extractor = extractor ?? new KnowledgeExtractor();
  }

  async extractAndStore(text: string, source: string, sourceId?: string, orgId?: string): Promise<ExtractionResult> {
    const result = this.extractor.extract(text, source, sourceId);
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';

    // Persist nodes to Prisma
    for (const node of result.nodes) {
      await prisma.knowledgeNode.create({
        data: {
          id: node.id,
          type: node.type.toUpperCase() as 'PERSON' | 'COMPANY' | 'TASK' | 'DECISION' | 'RISK' | 'KEYWORD' | 'TIMELINE' | 'CONCEPT' | 'FACT',
          title: node.title,
          content: node.content,
          confidence: node.confidence,
          source: node.source,
          sourceId: node.sourceId,
          tags: node.tags,
          metadata: node.metadata as Record<string, unknown> as Prisma.InputJsonValue,
          organizationId,
        },
      });
    }

    // Persist edges to Prisma
    for (const edge of result.edges) {
      await prisma.knowledgeEdge.create({
        data: {
          id: edge.id,
          fromId: edge.fromId,
          toId: edge.toId,
          type: edge.type,
          weight: edge.weight,
          metadata: edge.metadata as Record<string, unknown> as Prisma.InputJsonValue,
          organizationId,
        },
      });
    }

    return result;
  }

  async addNode(node: KnowledgeNode, orgId?: string): Promise<void> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    await prisma.knowledgeNode.create({
      data: {
        id: node.id,
        type: node.type.toUpperCase() as 'PERSON' | 'COMPANY' | 'TASK' | 'DECISION' | 'RISK' | 'KEYWORD' | 'TIMELINE' | 'CONCEPT' | 'FACT',
        title: node.title,
        content: node.content,
        confidence: node.confidence,
        source: node.source,
        sourceId: node.sourceId,
        tags: node.tags,
        metadata: node.metadata as Record<string, unknown> as Prisma.InputJsonValue,
        organizationId,
      },
    });
  }

  async addEdge(edge: KnowledgeEdge, orgId?: string): Promise<void> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    await prisma.knowledgeEdge.create({
      data: {
        id: edge.id,
        fromId: edge.fromId,
        toId: edge.toId,
        type: edge.type,
        weight: edge.weight,
        metadata: edge.metadata as Record<string, unknown> as Prisma.InputJsonValue,
        organizationId,
      },
    });
  }

  async getNode(id: string): Promise<KnowledgeNode | undefined> {
    const row = await prisma.knowledgeNode.findUnique({ where: { id } });
    return row ? toKnowledgeNode(row) : undefined;
  }

  async getEdge(id: string): Promise<KnowledgeEdge | undefined> {
    const row = await prisma.knowledgeEdge.findUnique({ where: { id } });
    return row ? toKnowledgeEdge(row) : undefined;
  }

  async listNodes(type?: KnowledgeNodeType, orgId?: string): Promise<KnowledgeNode[]> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const where: Record<string, unknown> = { organizationId };
    if (type) where.type = type.toUpperCase();
    const rows = await prisma.knowledgeNode.findMany({ where, orderBy: { createdAt: 'desc' } });
    return rows.map(toKnowledgeNode);
  }

  async listEdges(orgId?: string): Promise<KnowledgeEdge[]> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const rows = await prisma.knowledgeEdge.findMany({ where: { organizationId } });
    return rows.map(toKnowledgeEdge);
  }

  async getGraph(type?: KnowledgeNodeType, orgId?: string): Promise<KnowledgeGraph> {
    return { nodes: await this.listNodes(type, orgId), edges: await this.listEdges(orgId) };
  }

  async search(query: string, limit = 20, orgId?: string): Promise<KnowledgeNode[]> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const q = query.toLowerCase();
    const rows = await prisma.knowledgeNode.findMany({
      where: {
        organizationId,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: { confidence: 'desc' },
      take: limit,
    });
    return rows.map(toKnowledgeNode);
  }

  async getStats(orgId?: string): Promise<Record<KnowledgeNodeType, number>> {
    const organizationId = orgId ?? '10000000-0000-0000-0000-000000000001';
    const types = ['PERSON', 'COMPANY', 'TASK', 'DECISION', 'RISK', 'KEYWORD', 'TIMELINE', 'CONCEPT', 'FACT'] as const;
    const counts = await Promise.all(
      types.map((t) => prisma.knowledgeNode.count({ where: { organizationId, type: t } })),
    );
    const stats = {} as Record<KnowledgeNodeType, number>;
    const lowerTypes = ['person', 'company', 'task', 'decision', 'risk', 'keyword', 'timeline', 'concept', 'fact'] as KnowledgeNodeType[];
    for (let i = 0; i < types.length; i++) {
      stats[lowerTypes[i]] = counts[i];
    }
    return stats;
  }

  async deleteNode(id: string): Promise<boolean> {
    try {
      // Delete associated edges first
      await prisma.knowledgeEdge.deleteMany({ where: { OR: [{ fromId: id }, { toId: id }] } });
      await prisma.knowledgeNode.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Prisma Row Converters ───────────────────────────────────────────────────

function toKnowledgeNode(row: {
  id: string; type: string; title: string; content: string | null;
  confidence: number; source: string | null; sourceId: string | null;
  tags: string[]; metadata: unknown; createdAt: Date; updatedAt: Date;
}): KnowledgeNode {
  return {
    id: row.id,
    type: row.type.toLowerCase() as KnowledgeNodeType,
    title: row.title,
    content: row.content ?? '',
    confidence: row.confidence,
    source: row.source ?? '',
    sourceId: row.sourceId ?? undefined,
    tags: row.tags,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toKnowledgeEdge(row: {
  id: string; fromId: string; toId: string;
  type: string; weight: number; metadata: unknown;
}): KnowledgeEdge {
  return {
    id: row.id,
    fromId: row.fromId,
    toId: row.toId,
    type: row.type,
    weight: row.weight,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}
