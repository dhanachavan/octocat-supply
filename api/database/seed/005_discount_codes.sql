-- Seed data for discount_codes
-- Provides realistic discount codes for development and demo purposes

INSERT INTO discount_codes (discount_code_id, code, description, discount_type, discount_value, minimum_order_amount, is_active, usage_limit, usage_count, expires_at, created_at) VALUES
(1, 'WELCOME10', 'Welcome discount for new customers - 10% off', 'percentage', 10.0, 0.0, 1, NULL, 0, NULL, '2024-01-01T00:00:00.000Z'),
(2, 'SUMMER20', 'Summer sale - 20% off orders over $100', 'percentage', 20.0, 100.0, 1, 500, 42, '2025-09-01T00:00:00.000Z', '2024-06-01T00:00:00.000Z'),
(3, 'FLAT15', 'Flat $15 off any order', 'fixed', 15.0, 50.0, 1, 100, 17, NULL, '2024-03-15T00:00:00.000Z'),
(4, 'EXPIRED50', 'Expired 50% off promotional code', 'percentage', 50.0, 0.0, 0, 10, 10, '2024-01-31T23:59:59.000Z', '2024-01-01T00:00:00.000Z'),
(5, 'BULK25', 'Bulk order discount - 25% off orders over $500', 'percentage', 25.0, 500.0, 1, NULL, 8, NULL, '2024-04-01T00:00:00.000Z');
