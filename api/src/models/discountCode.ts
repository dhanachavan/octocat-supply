/**
 * @swagger
 * components:
 *   schemas:
 *     DiscountCode:
 *       type: object
 *       required:
 *         - discountCodeId
 *         - code
 *         - discountType
 *         - discountValue
 *       properties:
 *         discountCodeId:
 *           type: integer
 *           description: The unique identifier for the discount code
 *         code:
 *           type: string
 *           description: The unique discount code string (e.g. SUMMER20)
 *         description:
 *           type: string
 *           description: Human-readable description of the discount
 *         discountType:
 *           type: string
 *           enum: [percentage, fixed]
 *           description: Whether the discount is a percentage or fixed amount
 *         discountValue:
 *           type: number
 *           format: float
 *           description: The discount amount (percentage 0-100 or fixed currency value)
 *         minimumOrderAmount:
 *           type: number
 *           format: float
 *           description: Minimum order total required to apply this discount
 *         isActive:
 *           type: boolean
 *           description: Whether the discount code is currently active
 *         usageLimit:
 *           type: integer
 *           nullable: true
 *           description: Maximum number of times the code can be used (null = unlimited)
 *         usageCount:
 *           type: integer
 *           description: Number of times the code has been used
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Expiry date/time for the code (null = no expiry)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the discount code was created
 */
export interface DiscountCode {
  discountCodeId: number;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount: number;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  expiresAt: string | null;
  createdAt: string;
}
