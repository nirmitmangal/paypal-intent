-- ============================================================================
-- PayPal Intent — Relational Database Schema (SQLite)
-- Version: 1.0.0
-- 13 Relational Entities with Foreign Keys and Query Indexes
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Anonymous Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- 2. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    preferred_currency TEXT NOT NULL DEFAULT 'USD',
    quality_preference TEXT NOT NULL DEFAULT 'balanced' CHECK(quality_preference IN ('budget', 'balanced', 'premium')),
    brand_flexibility TEXT NOT NULL DEFAULT 'flexible' CHECK(brand_flexibility IN ('strict', 'flexible', 'open')),
    default_constraints TEXT, -- JSON string
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_preferences_session ON user_preferences(session_id);

-- 3. Intent Sessions
CREATE TABLE IF NOT EXISTS intent_sessions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    raw_prompt TEXT NOT NULL,
    parsed_objective TEXT,
    budget_amount REAL,
    budget_currency TEXT NOT NULL DEFAULT 'USD',
    is_hard_ceiling INTEGER NOT NULL DEFAULT 1,
    urgency TEXT NOT NULL DEFAULT 'standard' CHECK(urgency IN ('low', 'standard', 'high')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'analyzed', 'planned', 'cart_prepared', 'completed', 'abandoned')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_intent_sessions_session ON intent_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_intent_sessions_status ON intent_sessions(status);

-- 4. Intent Requirements (Decomposed Categories)
CREATE TABLE IF NOT EXISTS intent_requirements (
    id TEXT PRIMARY KEY,
    intent_session_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'essential' CHECK(priority IN ('essential', 'recommended', 'optional')),
    estimated_budget_share REAL NOT NULL DEFAULT 0.0,
    spec_constraints TEXT, -- JSON string
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(intent_session_id) REFERENCES intent_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_intent_reqs_intent ON intent_requirements(intent_session_id);

-- 5. Execution Plans
CREATE TABLE IF NOT EXISTS execution_plans (
    id TEXT PRIMARY KEY,
    intent_session_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    plan_tier TEXT NOT NULL DEFAULT 'balanced' CHECK(plan_tier IN ('budget', 'balanced', 'performance')),
    summary TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    total_estimated_cost REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(intent_session_id) REFERENCES intent_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_execution_plans_intent ON execution_plans(intent_session_id);

-- 6. Products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category_id TEXT NOT NULL,
    brand TEXT NOT NULL,
    base_price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    rating REAL NOT NULL DEFAULT 4.5,
    review_count INTEGER NOT NULL DEFAULT 0,
    in_stock INTEGER NOT NULL DEFAULT 1,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(base_price);

-- 7. Product Attributes
CREATE TABLE IF NOT EXISTS product_attributes (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    attribute_key TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    attribute_type TEXT NOT NULL DEFAULT 'string' CHECK(attribute_type IN ('string', 'number', 'boolean')),
    is_filterable INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_attrs_prod ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attrs_key ON product_attributes(attribute_key);

-- 8. Recommendations (Items in an Execution Plan)
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    execution_plan_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    compatibility_score REAL NOT NULL DEFAULT 1.0,
    selection_reason TEXT NOT NULL,
    trade_off_notes TEXT,
    is_locked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(execution_plan_id) REFERENCES execution_plans(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_recommendations_plan ON recommendations(execution_plan_id);

-- 9. Shopping Carts
CREATE TABLE IF NOT EXISTS shopping_carts (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    intent_session_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'locked', 'converted', 'abandoned')),
    subtotal REAL NOT NULL DEFAULT 0.0,
    estimated_tax REAL NOT NULL DEFAULT 0.0,
    shipping_fee REAL NOT NULL DEFAULT 0.0,
    total_amount REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(intent_session_id) REFERENCES intent_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session ON shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_intent ON shopping_carts(intent_session_id);

-- 10. Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    is_custom_selection INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);

-- 11. Orders
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    intent_session_id TEXT NOT NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'captured', 'cancelled', 'refunded')),
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal REAL NOT NULL DEFAULT 0.0,
    tax_amount REAL NOT NULL DEFAULT 0.0,
    shipping_amount REAL NOT NULL DEFAULT 0.0,
    total_amount REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(intent_session_id) REFERENCES intent_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);

-- 12. Payments
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'paypal',
    paypal_order_id TEXT UNIQUE NOT NULL,
    paypal_capture_id TEXT,
    status TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created', 'approved', 'completed', 'failed')),
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    payer_email TEXT,
    payer_id TEXT,
    payment_source TEXT,
    raw_response TEXT, -- JSON string
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order ON payments(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- 13. Transaction Records (Permanent Immutable Audit)
CREATE TABLE IF NOT EXISTS transaction_records (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    transaction_hash TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED')),
    gross_amount REAL NOT NULL,
    fee_amount REAL NOT NULL DEFAULT 0.0,
    net_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    intent_summary TEXT NOT NULL,
    audit_snapshot TEXT NOT NULL, -- JSON string snapshot
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transaction_records(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_session ON transaction_records(session_id);
