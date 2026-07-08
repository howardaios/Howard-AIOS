import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InformationService, InformationNotFoundError, InformationValidationError } from '../service';
import type { InformationRepository } from '../repository';
import type { Information, SourceType, InformationStatus } from '@howard-aios/database';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const USER_ID = 'b0000000-0000-0000-0000-000000000001';

function makeRecord(overrides?: Partial<Information>): Information {
  return {
    id: 'c0000000-0000-0000-0000-000000000001',
    title: null,
    content: 'Test content',
    sourceType: 'MANUAL' as SourceType,
    sourceDetail: null,
    rawPayload: null,
    status: 'RECEIVED' as InformationStatus,
    submittedById: null,
    organizationId: ORG_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createMockRepository(): InformationRepository {
  return {
    findById: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InformationService', () => {
  let repo: ReturnType<typeof createMockRepository>;
  let service: InformationService;

  beforeEach(() => {
    repo = createMockRepository();
    service = new InformationService(repo);
  });

  // ── getById ─────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('should return an information record', async () => {
      const record = makeRecord();
      vi.mocked(repo.findById).mockResolvedValue(record);

      const result = await service.getById(record.id);
      expect(result).toEqual(record);
      expect(repo.findById).toHaveBeenCalledWith(record.id);
    });

    it('should throw InformationNotFoundError when not found', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.getById('missing-id')).rejects.toThrow(InformationNotFoundError);
    });
  });

  // ── list ────────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('should return paginated results', async () => {
      const records = [makeRecord(), makeRecord({ id: 'c0000000-0000-0000-0000-000000000002' })];
      vi.mocked(repo.findMany).mockResolvedValue(records);
      vi.mocked(repo.count).mockResolvedValue(2);

      const result = await service.list(ORG_ID, { page: 1, pageSize: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should apply sourceType filter', async () => {
      vi.mocked(repo.findMany).mockResolvedValue([]);
      vi.mocked(repo.count).mockResolvedValue(0);

      await service.list(ORG_ID, { page: 1, pageSize: 10, sourceType: 'EMAIL' });

      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sourceType: 'EMAIL' }),
        }),
      );
    });

    it('should apply search filter on title and content', async () => {
      vi.mocked(repo.findMany).mockResolvedValue([]);
      vi.mocked(repo.count).mockResolvedValue(0);

      await service.list(ORG_ID, { page: 1, pageSize: 10, search: 'hello' });

      expect(repo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.objectContaining({ contains: 'hello' }) }),
              expect.objectContaining({ content: expect.objectContaining({ contains: 'hello' }) }),
            ]),
          }),
        }),
      );
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a record with valid input', async () => {
      const record = makeRecord();
      vi.mocked(repo.create).mockResolvedValue(record);

      const result = await service.create({
        content: 'Test content',
        sourceType: 'MANUAL',
        organizationId: ORG_ID,
      });

      expect(result).toEqual(record);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test content',
          sourceType: 'MANUAL',
        }),
      );
    });

    it('should create with all optional fields', async () => {
      const record = makeRecord({ title: 'Title', sourceDetail: 'detail' });
      vi.mocked(repo.create).mockResolvedValue(record);

      await service.create({
        title: 'Title',
        content: 'Test content',
        sourceType: 'WECHAT',
        sourceDetail: 'detail',
        rawPayload: { key: 'value' },
        submittedById: USER_ID,
        organizationId: ORG_ID,
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Title',
          content: 'Test content',
          sourceType: 'WECHAT',
          sourceDetail: 'detail',
        }),
      );
    });

    it('should throw InformationValidationError for empty content', async () => {
      await expect(
        service.create({ content: '', sourceType: 'MANUAL', organizationId: ORG_ID }),
      ).rejects.toThrow(InformationValidationError);
    });

    it('should throw InformationValidationError for invalid sourceType', async () => {
      await expect(
        service.create({
          content: 'Test',
          sourceType: 'INVALID' as unknown as 'MANUAL',
          organizationId: ORG_ID,
        }),
      ).rejects.toThrow(InformationValidationError);
    });

    it('should throw InformationValidationError for missing organizationId', async () => {
      await expect(
        service.create({
          content: 'Test',
          sourceType: 'MANUAL',
        } as { content: string; sourceType: 'MANUAL'; organizationId: string }),
      ).rejects.toThrow(InformationValidationError);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update a record', async () => {
      const record = makeRecord();
      const updated = { ...record, content: 'Updated' };
      vi.mocked(repo.findById).mockResolvedValue(record);
      vi.mocked(repo.update).mockResolvedValue(updated);

      const result = await service.update(record.id, { content: 'Updated' });
      expect(result.content).toBe('Updated');
    });

    it('should update status', async () => {
      const record = makeRecord();
      vi.mocked(repo.findById).mockResolvedValue(record);
      vi.mocked(repo.update).mockResolvedValue({ ...record, status: 'STORED' });

      const result = await service.update(record.id, { status: 'STORED' });
      expect(result.status).toBe('STORED');
    });

    it('should throw InformationNotFoundError for non-existent id', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.update('missing-id', { content: 'Test' })).rejects.toThrow(
        InformationNotFoundError,
      );
    });

    it('should throw InformationValidationError for invalid update', async () => {
      const record = makeRecord();
      vi.mocked(repo.findById).mockResolvedValue(record);

      await expect(
        service.update(record.id, { status: 'INVALID' as unknown as 'RECEIVED' }),
      ).rejects.toThrow(InformationValidationError);
    });
  });

  // ── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete a record', async () => {
      const record = makeRecord();
      vi.mocked(repo.findById).mockResolvedValue(record);
      vi.mocked(repo.delete).mockResolvedValue(record);

      const result = await service.delete(record.id);
      expect(result).toEqual(record);
      expect(repo.delete).toHaveBeenCalledWith(record.id);
    });

    it('should throw InformationNotFoundError for non-existent id', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(service.delete('missing-id')).rejects.toThrow(InformationNotFoundError);
    });
  });
});
