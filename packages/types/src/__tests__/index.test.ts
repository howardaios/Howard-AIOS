import { describe, it, expect } from 'vitest';
import type { ApiResponse, Paginated } from '../index';

describe('types', () => {
  it('should compile ApiResponse correctly', () => {
    const response: ApiResponse<string> = {
      success: true,
      code: 0,
      message: 'OK',
      data: 'hello',
    };
    expect(response.success).toBe(true);
  });

  it('should compile Paginated correctly', () => {
    const paginated: Paginated<string> = {
      data: ['item-1'],
      total: 1,
      page: 1,
      pageSize: 10,
      hasMore: false,
    };
    expect(paginated.total).toBe(1);
  });
});
