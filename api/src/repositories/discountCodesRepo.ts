/**
 * Repository for discount codes data access
 */

import { getDatabase, DatabaseConnection } from '../db/sqlite';
import { DiscountCode } from '../models/discountCode';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import { buildInsertSQL, buildUpdateSQL, objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';

export class DiscountCodesRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Get all discount codes
   */
  async findAll(): Promise<DiscountCode[]> {
    try {
      const rows = await this.db.all<DatabaseRow>('SELECT * FROM discount_codes ORDER BY discount_code_id');
      return mapDatabaseRows<DiscountCode>(rows).map(this.convertBooleanFields);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get discount code by ID
   */
  async findById(id: number): Promise<DiscountCode | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM discount_codes WHERE discount_code_id = ?', [id]);
      return row ? this.convertBooleanFields(objectToCamelCase<DiscountCode>(row)) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Find a discount code by its code string
   */
  async findByCode(code: string): Promise<DiscountCode | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM discount_codes WHERE code = ?', [code]);
      return row ? this.convertBooleanFields(objectToCamelCase<DiscountCode>(row)) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get all active discount codes
   */
  async findActive(): Promise<DiscountCode[]> {
    try {
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM discount_codes WHERE is_active = 1 ORDER BY discount_code_id',
      );
      return mapDatabaseRows<DiscountCode>(rows).map(this.convertBooleanFields);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Create a new discount code
   */
  async create(discountCode: Omit<DiscountCode, 'discountCodeId'>): Promise<DiscountCode> {
    try {
      const { sql, values } = buildInsertSQL('discount_codes', this.toBooleanIntegers(discountCode));
      const result = await this.db.run(sql, values);

      const created = await this.findById(result.lastID || 0);
      if (!created) {
        throw new Error('Failed to retrieve created discount code');
      }

      return created;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Update discount code by ID
   */
  async update(id: number, discountCode: Partial<Omit<DiscountCode, 'discountCodeId'>>): Promise<DiscountCode> {
    try {
      const { sql, values } = buildUpdateSQL('discount_codes', this.toBooleanIntegers(discountCode), 'discount_code_id = ?');
      const result = await this.db.run(sql, [...values, id]);

      if (result.changes === 0) {
        throw new NotFoundError('DiscountCode', id);
      }

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated discount code');
      }

      return updated;
    } catch (error) {
      handleDatabaseError(error, 'DiscountCode', id);
    }
  }

  /**
   * Delete discount code by ID
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.run('DELETE FROM discount_codes WHERE discount_code_id = ?', [id]);

      if (result.changes === 0) {
        throw new NotFoundError('DiscountCode', id);
      }
    } catch (error) {
      handleDatabaseError(error, 'DiscountCode', id);
    }
  }

  /**
   * Check if discount code exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM discount_codes WHERE discount_code_id = ?',
        [id],
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Increment usage count for a discount code
   */
  async incrementUsageCount(id: number): Promise<DiscountCode> {
    try {
      const result = await this.db.run(
        'UPDATE discount_codes SET usage_count = usage_count + 1 WHERE discount_code_id = ?',
        [id],
      );

      if (result.changes === 0) {
        throw new NotFoundError('DiscountCode', id);
      }

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated discount code');
      }

      return updated;
    } catch (error) {
      handleDatabaseError(error, 'DiscountCode', id);
    }
  }

  /**
   * Convert SQLite integer boolean fields to actual booleans
   */
  private convertBooleanFields(code: DiscountCode): DiscountCode {
    return {
      ...code,
      isActive: Boolean(code.isActive),
    };
  }

  /**
   * Convert JavaScript boolean fields to SQLite integers (0/1) for storage
   */
  private toBooleanIntegers<T extends Record<string, unknown>>(data: T): T {
    const result = { ...data } as Record<string, unknown>;
    if ('isActive' in result) {
      result['isActive'] = result['isActive'] ? 1 : 0;
    }
    return result as T;
  }
}

// Factory function to create repository instance
export async function createDiscountCodesRepository(isTest: boolean = false): Promise<DiscountCodesRepository> {
  const db = await getDatabase(isTest);
  return new DiscountCodesRepository(db);
}

// Singleton instance for default usage
let discountCodesRepo: DiscountCodesRepository | null = null;

export async function getDiscountCodesRepository(isTest: boolean = false): Promise<DiscountCodesRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createDiscountCodesRepository(true);
  }
  if (!discountCodesRepo) {
    discountCodesRepo = await createDiscountCodesRepository(false);
  }
  return discountCodesRepo;
}
