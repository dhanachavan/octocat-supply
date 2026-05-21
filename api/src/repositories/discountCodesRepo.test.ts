import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiscountCodesRepository } from './discountCodesRepo';
import { NotFoundError } from '../utils/errors';

// Mock the getDatabase function first
vi.mock('../db/sqlite', () => ({
  getDatabase: vi.fn(),
}));

import { getDatabase } from '../db/sqlite';

describe('DiscountCodesRepository', () => {
  let repository: DiscountCodesRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      db: {} as any,
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      close: vi.fn(),
    };

    (getDatabase as any).mockResolvedValue(mockDb);
    repository = new DiscountCodesRepository(mockDb);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all discount codes mapped to camelCase with boolean conversion', async () => {
      const mockRows = [
        {
          discount_code_id: 1,
          code: 'WELCOME10',
          description: '10% off',
          discount_type: 'percentage',
          discount_value: 10.0,
          minimum_order_amount: 0.0,
          is_active: 1,
          usage_limit: null,
          usage_count: 0,
          expires_at: null,
          created_at: '2024-01-01T00:00:00.000Z',
        },
        {
          discount_code_id: 2,
          code: 'FLAT15',
          description: '$15 off',
          discount_type: 'fixed',
          discount_value: 15.0,
          minimum_order_amount: 50.0,
          is_active: 0,
          usage_limit: 100,
          usage_count: 5,
          expires_at: null,
          created_at: '2024-02-01T00:00:00.000Z',
        },
      ];
      mockDb.all.mockResolvedValue(mockRows);

      const result = await repository.findAll();

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM discount_codes ORDER BY discount_code_id',
      );
      expect(result).toHaveLength(2);
      expect(result[0].discountCodeId).toBe(1);
      expect(result[0].code).toBe('WELCOME10');
      expect(result[0].isActive).toBe(true);
      expect(result[1].isActive).toBe(false);
    });

    it('should return empty array when no discount codes exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockDb.all.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.findAll()).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return discount code when found', async () => {
      const mockRow = {
        discount_code_id: 1,
        code: 'WELCOME10',
        description: '10% off',
        discount_type: 'percentage',
        discount_value: 10.0,
        minimum_order_amount: 0.0,
        is_active: 1,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: '2024-01-01T00:00:00.000Z',
      };
      mockDb.get.mockResolvedValue(mockRow);

      const result = await repository.findById(1);

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM discount_codes WHERE discount_code_id = ?',
        [1],
      );
      expect(result?.discountCodeId).toBe(1);
      expect(result?.code).toBe('WELCOME10');
      expect(result?.isActive).toBe(true);
    });

    it('should return null when not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should return null when undefined is returned', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should return discount code when found by code string', async () => {
      const mockRow = {
        discount_code_id: 1,
        code: 'SUMMER20',
        description: '20% off',
        discount_type: 'percentage',
        discount_value: 20.0,
        minimum_order_amount: 100.0,
        is_active: 1,
        usage_limit: 500,
        usage_count: 42,
        expires_at: '2025-09-01T00:00:00.000Z',
        created_at: '2024-06-01T00:00:00.000Z',
      };
      mockDb.get.mockResolvedValue(mockRow);

      const result = await repository.findByCode('SUMMER20');

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM discount_codes WHERE code = ?',
        ['SUMMER20'],
      );
      expect(result?.code).toBe('SUMMER20');
      expect(result?.discountValue).toBe(20.0);
    });

    it('should return null when code not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await repository.findByCode('NOTEXIST');

      expect(result).toBeNull();
    });
  });

  describe('findActive', () => {
    it('should return only active discount codes', async () => {
      const mockRows = [
        {
          discount_code_id: 1,
          code: 'WELCOME10',
          description: '10% off',
          discount_type: 'percentage',
          discount_value: 10.0,
          minimum_order_amount: 0.0,
          is_active: 1,
          usage_limit: null,
          usage_count: 0,
          expires_at: null,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      ];
      mockDb.all.mockResolvedValue(mockRows);

      const result = await repository.findActive();

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM discount_codes WHERE is_active = 1 ORDER BY discount_code_id',
      );
      expect(result).toHaveLength(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should return empty array when no active codes exist', async () => {
      mockDb.all.mockResolvedValue([]);

      const result = await repository.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create a new discount code and return it', async () => {
      const newCode = {
        code: 'NEWCODE',
        description: 'New discount',
        discountType: 'percentage',
        discountValue: 15.0,
        minimumOrderAmount: 0.0,
        isActive: true,
        usageLimit: null,
        usageCount: 0,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockDb.run.mockResolvedValue({ lastID: 6, changes: 1 });
      mockDb.get.mockResolvedValue({
        discount_code_id: 6,
        code: 'NEWCODE',
        description: 'New discount',
        discount_type: 'percentage',
        discount_value: 15.0,
        minimum_order_amount: 0.0,
        is_active: 1,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.create(newCode);

      expect(mockDb.run).toHaveBeenCalled();
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM discount_codes WHERE discount_code_id = ?',
        [6],
      );
      expect(result.discountCodeId).toBe(6);
      expect(result.code).toBe('NEWCODE');
    });

    it('should throw error if created code cannot be retrieved', async () => {
      mockDb.run.mockResolvedValue({ lastID: 6, changes: 1 });
      mockDb.get.mockResolvedValue(null);

      await expect(
        repository.create({
          code: 'TEST',
          description: '',
          discountType: 'percentage',
          discountValue: 10,
          minimumOrderAmount: 0,
          isActive: true,
          usageLimit: null,
          usageCount: 0,
          expiresAt: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      ).rejects.toThrow('Failed to retrieve created discount code');
    });
  });

  describe('update', () => {
    it('should update discount code and return updated record', async () => {
      const updates = { description: 'Updated description', isActive: false };

      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.get.mockResolvedValue({
        discount_code_id: 1,
        code: 'WELCOME10',
        description: 'Updated description',
        discount_type: 'percentage',
        discount_value: 10.0,
        minimum_order_amount: 0.0,
        is_active: 0,
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
        created_at: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.update(1, updates);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result.description).toBe('Updated description');
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundError when discount code does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.update(999, { description: 'Updated' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete existing discount code', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });

      await repository.delete(1);

      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM discount_codes WHERE discount_code_id = ?',
        [1],
      );
    });

    it('should throw NotFoundError when discount code does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('exists', () => {
    it('should return true when discount code exists', async () => {
      mockDb.get.mockResolvedValue({ count: 1 });

      const result = await repository.exists(1);

      expect(result).toBe(true);
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM discount_codes WHERE discount_code_id = ?',
        [1],
      );
    });

    it('should return false when discount code does not exist', async () => {
      mockDb.get.mockResolvedValue({ count: 0 });

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });

    it('should handle null result', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment usage count and return updated record', async () => {
      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.get.mockResolvedValue({
        discount_code_id: 1,
        code: 'WELCOME10',
        description: '10% off',
        discount_type: 'percentage',
        discount_value: 10.0,
        minimum_order_amount: 0.0,
        is_active: 1,
        usage_limit: null,
        usage_count: 1,
        expires_at: null,
        created_at: '2024-01-01T00:00:00.000Z',
      });

      const result = await repository.incrementUsageCount(1);

      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE discount_codes SET usage_count = usage_count + 1 WHERE discount_code_id = ?',
        [1],
      );
      expect(result.usageCount).toBe(1);
    });

    it('should throw NotFoundError when discount code does not exist', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(repository.incrementUsageCount(999)).rejects.toThrow(NotFoundError);
    });
  });
});
