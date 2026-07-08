import { describe, it, expect } from 'vitest';
import type { InboxItem } from '@howard-aios/database';
import type { InboxRepository } from '../repository';
import { InboxService, InboxItemNotFoundError } from '../service';

// ─── Mock Repository ──────────────────────────────────────────────────────────

function createMockItem(overrides?: Partial<InboxItem>): InboxItem {
  return {
    id: 'test-id-1',
    sourceType: 'MANUAL',
    sourceDetail: null,
    title: 'Test Item',
    content: 'Test content',
    priority: 'NORMAL',
    status: 'RECEIVED',
    rawPayload: null,
    metadata: null,
    tags: [],
    archivedAt: null,
    processedAt: null,
    organizationId: '10000000-0000-0000-0000-000000000001',
    submittedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function createMockRepository(): InboxRepository {
  const store = new Map<string, InboxItem>();

  return {
    findById: async (id: string) => store.get(id) ?? null,
    findMany: async ({ skip, take }) => {
      const all = Array.from(store.values());
      return all.slice(skip ?? 0, (skip ?? 0) + (take ?? 20));
    },
    count: async () => store.size,
    create: async (data) => {
      const item = createMockItem({
        id: `00000000-0000-0000-0000-${String(store.size + 1).padStart(12, '0')}`,
        content: (data as { content: string }).content,
        sourceType: (data as { sourceType: string }).sourceType as InboxItem['sourceType'],
      });
      store.set(item.id, item);
      return item;
    },
    update: async (id: string, data: Record<string, unknown>) => {
      const existing = store.get(id);
      if (!existing) throw new Error('Not found');
      const updated = { ...existing, ...data, updatedAt: new Date() } as unknown as InboxItem;
      store.set(id, updated);
      return updated;
    },
    delete: async (id: string) => {
      const existing = store.get(id);
      if (!existing) throw new Error('Not found');
      store.delete(id);
      return existing;
    },
    deleteMany: async (ids: string[]) => {
      let count = 0;
      for (const id of ids) {
        if (store.delete(id)) count++;
      }
      return { count };
    },
    updateMany: async (ids: string[], data: Record<string, unknown>) => {
      let count = 0;
      for (const id of ids) {
        const existing = store.get(id);
        if (existing) {
          store.set(id, { ...existing, ...data, updatedAt: new Date() } as unknown as InboxItem);
          count++;
        }
      }
      return { count };
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InboxService', () => {
  it('should create an inbox item', async () => {
    const repo = createMockRepository();
    const service = new InboxService(repo);

    const item = await service.create({
      content: 'Hello from email',
      sourceType: 'EMAIL',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });

    expect(item.content).toBe('Hello from email');
    expect(item.sourceType).toBe('EMAIL');
  });

  it('should list inbox items with pagination', async () => {
    const repo = createMockRepository();
    const service = new InboxService(repo);

    await service.create({
      content: 'Item 1',
      sourceType: 'MANUAL',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });
    await service.create({
      content: 'Item 2',
      sourceType: 'EMAIL',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });

    const result = await service.list('10000000-0000-0000-0000-000000000001', { page: 1, pageSize: 10 });
    expect(result.data.length).toBe(2);
    expect(result.total).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it('should get item by id', async () => {
    const repo = createMockRepository();
    const service = new InboxService(repo);

    const created = await service.create({
      content: 'Find me',
      sourceType: 'WECHAT',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });

    const found = await service.getById(created.id);
    expect(found.content).toBe('Find me');
  });

  it('should throw InboxItemNotFoundError for unknown id', async () => {
    const repo = createMockRepository();
    const service = new InboxService(repo);

    await expect(service.getById('non-existent')).rejects.toThrow(InboxItemNotFoundError);
  });

  it('should archive an item', async () => {
    const repo = createMockRepository();
    const service = new InboxService(repo);

    const item = await service.create({
      content: 'Archive me',
      sourceType: 'API',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });

    const archived = await service.archive(item.id);
    expect(archived.status).toBe('ARCHIVED');
    expect(archived.archivedAt).toBeTruthy();
  });

  it('should batch archive items', async () => {
    const repo = createMockRepository();
    const service = new InboxService(repo);

    const item1 = await service.create({
      content: 'Batch 1',
      sourceType: 'MANUAL',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });
    const item2 = await service.create({
      content: 'Batch 2',
      sourceType: 'MANUAL',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });

    const result = await service.batch('10000000-0000-0000-0000-000000000001', {
      ids: [item1.id, item2.id],
      action: 'archive',
    });

    expect(result.count).toBe(2);
  });

  it('should delete an item', async () => {
    const repo = createMockRepository();
    const service = new InboxService(repo);

    const item = await service.create({
      content: 'Delete me',
      sourceType: 'MANUAL',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });

    await service.delete(item.id);
    await expect(service.getById(item.id)).rejects.toThrow(InboxItemNotFoundError);
  });

  it('should update an item', async () => {
    const repo = createMockRepository();
    const service = new InboxService(repo);

    const item = await service.create({
      content: 'Original',
      sourceType: 'MANUAL',
      organizationId: '10000000-0000-0000-0000-000000000001',
    });

    const updated = await service.update(item.id, {
      title: 'Updated Title',
      priority: 'HIGH',
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.priority).toBe('HIGH');
  });
});
