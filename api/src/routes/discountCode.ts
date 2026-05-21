/**
 * @swagger
 * tags:
 *   name: DiscountCodes
 *   description: API endpoints for managing discount codes
 */

/**
 * @swagger
 * /api/discount-codes:
 *   get:
 *     summary: Returns all discount codes
 *     tags: [DiscountCodes]
 *     responses:
 *       200:
 *         description: List of all discount codes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DiscountCode'
 *   post:
 *     summary: Create a new discount code
 *     tags: [DiscountCodes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiscountCode'
 *     responses:
 *       201:
 *         description: Discount code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscountCode'
 *       409:
 *         description: Discount code already exists
 *
 * /api/discount-codes/active:
 *   get:
 *     summary: Returns all active discount codes
 *     tags: [DiscountCodes]
 *     responses:
 *       200:
 *         description: List of active discount codes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DiscountCode'
 *
 * /api/discount-codes/validate:
 *   post:
 *     summary: Validate a discount code against an order amount
 *     tags: [DiscountCodes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - orderAmount
 *             properties:
 *               code:
 *                 type: string
 *                 description: The discount code to validate
 *               orderAmount:
 *                 type: number
 *                 format: float
 *                 description: The order total to validate against
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 discountCode:
 *                   $ref: '#/components/schemas/DiscountCode'
 *                 discountAmount:
 *                   type: number
 *                   format: float
 *                 reason:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *
 * /api/discount-codes/{id}:
 *   get:
 *     summary: Get a discount code by ID
 *     tags: [DiscountCodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Discount code ID
 *     responses:
 *       200:
 *         description: Discount code found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscountCode'
 *       404:
 *         description: Discount code not found
 *   put:
 *     summary: Update a discount code by ID
 *     tags: [DiscountCodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Discount code ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DiscountCode'
 *     responses:
 *       200:
 *         description: Discount code updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DiscountCode'
 *       404:
 *         description: Discount code not found
 *   delete:
 *     summary: Delete a discount code by ID
 *     tags: [DiscountCodes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Discount code ID
 *     responses:
 *       204:
 *         description: Discount code deleted successfully
 *       404:
 *         description: Discount code not found
 */

import express from 'express';
import { DiscountCode } from '../models/discountCode';
import { getDiscountCodesRepository } from '../repositories/discountCodesRepo';
import { NotFoundError } from '../utils/errors';

const router = express.Router();

// Get all active discount codes (must come before /:id to avoid route conflict)
router.get('/active', async (req, res, next) => {
  try {
    const repo = await getDiscountCodesRepository();
    const codes = await repo.findActive();
    res.json(codes);
  } catch (error) {
    next(error);
  }
});

// Validate a discount code against an order amount
router.post('/validate', async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body as { code: string; orderAmount: number };

    if (!code || orderAmount === undefined || orderAmount === null) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'code and orderAmount are required' } });
      return;
    }

    const repo = await getDiscountCodesRepository();
    const discountCode = await repo.findByCode(code);

    if (!discountCode) {
      res.json({ valid: false, reason: 'Discount code not found' });
      return;
    }

    if (!discountCode.isActive) {
      res.json({ valid: false, discountCode, reason: 'Discount code is not active' });
      return;
    }

    if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
      res.json({ valid: false, discountCode, reason: 'Discount code has expired' });
      return;
    }

    if (discountCode.usageLimit !== null && discountCode.usageCount >= discountCode.usageLimit) {
      res.json({ valid: false, discountCode, reason: 'Discount code usage limit reached' });
      return;
    }

    if (orderAmount < discountCode.minimumOrderAmount) {
      res.json({
        valid: false,
        discountCode,
        reason: `Minimum order amount of ${discountCode.minimumOrderAmount} required`,
      });
      return;
    }

    const discountAmount =
      discountCode.discountType === 'percentage'
        ? (orderAmount * discountCode.discountValue) / 100
        : discountCode.discountValue;

    res.json({ valid: true, discountCode, discountAmount });
  } catch (error) {
    next(error);
  }
});

// Create a new discount code
router.post('/', async (req, res, next) => {
  try {
    const repo = await getDiscountCodesRepository();
    const newCode = await repo.create(req.body as Omit<DiscountCode, 'discountCodeId'>);
    res.status(201).json(newCode);
  } catch (error) {
    next(error);
  }
});

// Get all discount codes
router.get('/', async (req, res, next) => {
  try {
    const repo = await getDiscountCodesRepository();
    const codes = await repo.findAll();
    res.json(codes);
  } catch (error) {
    next(error);
  }
});

// Get a discount code by ID
router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getDiscountCodesRepository();
    const code = await repo.findById(parseInt(req.params.id));
    if (code) {
      res.json(code);
    } else {
      res.status(404).send('Discount code not found');
    }
  } catch (error) {
    next(error);
  }
});

// Update a discount code by ID
router.put('/:id', async (req, res, next) => {
  try {
    const repo = await getDiscountCodesRepository();
    const updated = await repo.update(parseInt(req.params.id), req.body);
    res.json(updated);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Discount code not found');
    } else {
      next(error);
    }
  }
});

// Delete a discount code by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const repo = await getDiscountCodesRepository();
    await repo.delete(parseInt(req.params.id));
    res.status(204).send();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).send('Discount code not found');
    } else {
      next(error);
    }
  }
});

export default router;
