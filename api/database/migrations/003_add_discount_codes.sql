-- Migration 003: Add discount_codes table

CREATE TABLE IF NOT EXISTS discount_codes (
    discount_code_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value REAL NOT NULL,
    minimum_order_amount REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast lookups by code (common query path)
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);

-- Index for filtering active codes
CREATE INDEX IF NOT EXISTS idx_discount_codes_is_active ON discount_codes(is_active);
