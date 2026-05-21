import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import discountCodeRouter from './discountCode';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db/sqlite';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Discount Code API', () => {
  beforeEach(async () => {
    // Ensure a fresh in-memory database for each test
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Set up express app
    app = express();
    app.use(express.json());
    app.use('/discount-codes', discountCodeRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should create a new discount code', async () => {
    const newCode = {
      code: 'TEST10',
      description: 'Test 10% discount',
      discountType: 'percentage',
      discountValue: 10.0,
      minimumOrderAmount: 0.0,
      isActive: true,
      usageLimit: null,
      usageCount: 0,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    const response = await request(app).post('/discount-codes').send(newCode);

    expect(response.status).toBe(201);
    expect(response.body.code).toBe('TEST10');
    expect(response.body.discountCodeId).toBeDefined();
    expect(response.body.isActive).toBe(true);
  });

  it('should get all discount codes', async () => {
    const response = await request(app).get('/discount-codes');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should get all active discount codes', async () => {
    // Create one active and one inactive code
    await request(app).post('/discount-codes').send({
      code: 'ACTIVE1',
      description: 'Active code',
      discountType: 'percentage',
      discountValue: 10.0,
      minimumOrderAmount: 0.0,
      isActive: true,
      usageLimit: null,
      usageCount: 0,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    await request(app).post('/discount-codes').send({
      code: 'INACTIVE1',
      description: 'Inactive code',
      discountType: 'percentage',
      discountValue: 5.0,
      minimumOrderAmount: 0.0,
      isActive: false,
      usageLimit: null,
      usageCount: 0,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const response = await request(app).get('/discount-codes/active');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.every((c: any) => c.isActive === true)).toBe(true);
  });

  it('should get a discount code by ID', async () => {
    const createResponse = await request(app).post('/discount-codes').send({
      code: 'GETBYID',
      description: 'Get by ID test',
      discountType: 'fixed',
      discountValue: 5.0,
      minimumOrderAmount: 0.0,
      isActive: true,
      usageLimit: null,
      usageCount: 0,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    const id = createResponse.body.discountCodeId;

    const response = await request(app).get(`/discount-codes/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.discountCodeId).toBe(id);
    expect(response.body.code).toBe('GETBYID');
  });

  it('should return 404 for non-existing discount code', async () => {
    const response = await request(app).get('/discount-codes/9999');

    expect(response.status).toBe(404);
  });

  it('should update a discount code by ID', async () => {
    const createResponse = await request(app).post('/discount-codes').send({
      code: 'UPDATEME',
      description: 'Original description',
      discountType: 'percentage',
      discountValue: 10.0,
      minimumOrderAmount: 0.0,
      isActive: true,
      usageLimit: null,
      usageCount: 0,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    const id = createResponse.body.discountCodeId;

    const response = await request(app)
      .put(`/discount-codes/${id}`)
      .send({ description: 'Updated description', discountValue: 15.0 });

    expect(response.status).toBe(200);
    expect(response.body.description).toBe('Updated description');
    expect(response.body.discountValue).toBe(15.0);
  });

  it('should return 404 when updating non-existing discount code', async () => {
    const response = await request(app)
      .put('/discount-codes/9999')
      .send({ description: 'Updated' });

    expect(response.status).toBe(404);
  });

  it('should delete a discount code by ID', async () => {
    const createResponse = await request(app).post('/discount-codes').send({
      code: 'DELETEME',
      description: 'Delete me',
      discountType: 'percentage',
      discountValue: 10.0,
      minimumOrderAmount: 0.0,
      isActive: true,
      usageLimit: null,
      usageCount: 0,
      expiresAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    const id = createResponse.body.discountCodeId;

    const response = await request(app).delete(`/discount-codes/${id}`);

    expect(response.status).toBe(204);

    // Verify it's gone
    const getResponse = await request(app).get(`/discount-codes/${id}`);
    expect(getResponse.status).toBe(404);
  });

  it('should return 404 when deleting non-existing discount code', async () => {
    const response = await request(app).delete('/discount-codes/9999');

    expect(response.status).toBe(404);
  });

  describe('POST /validate', () => {
    it('should return 400 when code is missing', async () => {
      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ orderAmount: 100 });

      expect(response.status).toBe(400);
    });

    it('should return 400 when orderAmount is missing', async () => {
      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ code: 'TEST' });

      expect(response.status).toBe(400);
    });

    it('should return valid=false for non-existing code', async () => {
      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ code: 'NOTEXIST', orderAmount: 100 });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.reason).toBe('Discount code not found');
    });

    it('should return valid=false for inactive code', async () => {
      await request(app).post('/discount-codes').send({
        code: 'INACTIVETEST',
        description: 'Inactive',
        discountType: 'percentage',
        discountValue: 10.0,
        minimumOrderAmount: 0.0,
        isActive: false,
        usageLimit: null,
        usageCount: 0,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ code: 'INACTIVETEST', orderAmount: 100 });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.reason).toBe('Discount code is not active');
    });

    it('should return valid=false when order amount is below minimum', async () => {
      await request(app).post('/discount-codes').send({
        code: 'MINCHECK',
        description: 'Minimum order check',
        discountType: 'percentage',
        discountValue: 20.0,
        minimumOrderAmount: 100.0,
        isActive: true,
        usageLimit: null,
        usageCount: 0,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ code: 'MINCHECK', orderAmount: 50 });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.reason).toContain('Minimum order amount');
    });

    it('should return valid=true with correct discountAmount for percentage discount', async () => {
      await request(app).post('/discount-codes').send({
        code: 'PERC20',
        description: '20% off',
        discountType: 'percentage',
        discountValue: 20.0,
        minimumOrderAmount: 0.0,
        isActive: true,
        usageLimit: null,
        usageCount: 0,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ code: 'PERC20', orderAmount: 100 });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.discountAmount).toBe(20);
    });

    it('should return valid=true with correct discountAmount for fixed discount', async () => {
      await request(app).post('/discount-codes').send({
        code: 'FIXED15',
        description: '$15 off',
        discountType: 'fixed',
        discountValue: 15.0,
        minimumOrderAmount: 0.0,
        isActive: true,
        usageLimit: null,
        usageCount: 0,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ code: 'FIXED15', orderAmount: 100 });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.discountAmount).toBe(15);
    });

    it('should return valid=false when usage limit is reached', async () => {
      await request(app).post('/discount-codes').send({
        code: 'LIMITREACH',
        description: 'Usage limit reached',
        discountType: 'percentage',
        discountValue: 10.0,
        minimumOrderAmount: 0.0,
        isActive: true,
        usageLimit: 5,
        usageCount: 5,
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ code: 'LIMITREACH', orderAmount: 100 });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.reason).toBe('Discount code usage limit reached');
    });

    it('should return valid=false for expired code', async () => {
      await request(app).post('/discount-codes').send({
        code: 'EXPIRED',
        description: 'Expired code',
        discountType: 'percentage',
        discountValue: 10.0,
        minimumOrderAmount: 0.0,
        isActive: true,
        usageLimit: null,
        usageCount: 0,
        expiresAt: '2020-01-01T00:00:00.000Z',
        createdAt: '2019-01-01T00:00:00.000Z',
      });

      const response = await request(app)
        .post('/discount-codes/validate')
        .send({ code: 'EXPIRED', orderAmount: 100 });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.reason).toBe('Discount code has expired');
    });
  });
});
