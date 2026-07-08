import { describe, it, expect } from 'vitest';
import { success, error } from '../response';

describe('response', () => {
  it('should create a success response', () => {
    const res = success('data');
    expect(res.success).toBe(true);
    expect(res.code).toBe(0);
    expect(res.data).toBe('data');
  });

  it('should create an error response', () => {
    const res = error('something went wrong', 500);
    expect(res.success).toBe(false);
    expect(res.code).toBe(500);
    expect(res.data).toBeNull();
  });
});
