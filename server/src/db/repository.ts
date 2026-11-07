import { getDatabase } from './index';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { Money } from '../utils/money';
import type {
  Session,
  IntentSession,
  IntentRequirement,
  RequirementPriority,
  Product,
  ProductAttribute,
  ExecutionPlan,
  ShoppingCart,
  CartItem,
  Order,
  TransactionRecord,
} from '@paypal-intent/shared';

// ============================================================================
// Session Repository
// ============================================================================
export const sessionRepository = {
  getOrCreate: (token?: string, ipHash?: string, userAgent?: string): Session => {
    const db = getDatabase();
    if (token) {
      const existing = db.prepare('SELECT * FROM sessions WHERE session_token = ?').get(token) as
        | {
            id: string;
            session_token: string;
            ip_hash?: string;
            user_agent?: string;
            created_at: string;
            updated_at: string;
            expires_at: string;
          }
        | undefined;

      if (existing) {
        return {
          id: existing.id,
          sessionToken: existing.session_token,
          ipHash: existing.ip_hash,
          userAgent: existing.user_agent,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
          expiresAt: existing.expires_at,
        };
      }
    }

    const id = `ses_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const sessionToken = `tok_${uuidv4().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    db.prepare(`
      INSERT INTO sessions (id, session_token, ip_hash, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, sessionToken, ipHash || null, userAgent || null, expiresAt);

    return {
      id,
      sessionToken,
      ipHash,
      userAgent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt,
    };
  },
};

// ============================================================================
// Intent Repository
// ============================================================================
export const intentRepository = {
  create: (params: {
    sessionId: string;
    rawPrompt: string;
    parsedObjective?: string;
    budgetAmount?: number;
    budgetCurrency?: string;
    isHardCeiling?: boolean;
    urgency?: 'low' | 'standard' | 'high';
  }): IntentSession => {
    const db = getDatabase();
    const id = `int_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const budgetCurrency = params.budgetCurrency || 'USD';
    const isHardCeiling = params.isHardCeiling ?? true;
    const urgency = params.urgency || 'standard';

    db.prepare(`
      INSERT INTO intent_sessions (id, session_id, raw_prompt, parsed_objective, budget_amount, budget_currency, is_hard_ceiling, urgency, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      id,
      params.sessionId,
      params.rawPrompt,
      params.parsedObjective || null,
      params.budgetAmount || null,
      budgetCurrency,
      isHardCeiling ? 1 : 0,
      urgency
    );

    return {
      id,
      sessionId: params.sessionId,
      rawPrompt: params.rawPrompt,
      parsedObjective: params.parsedObjective || '',
      budgetAmount: params.budgetAmount || 0,
      budgetCurrency,
      isHardCeiling,
      urgency,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  getById: (id: string): IntentSession | null => {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM intent_sessions WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      sessionId: row.session_id,
      rawPrompt: row.raw_prompt,
      parsedObjective: row.parsed_objective || '',
      budgetAmount: row.budget_amount || 0,
      budgetCurrency: row.budget_currency,
      isHardCeiling: row.is_hard_ceiling === 1,
      urgency: row.urgency,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  getBySessionId: (sessionId: string): IntentSession[] => {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM intent_sessions WHERE session_id = ? ORDER BY created_at DESC')
      .all(sessionId) as any[];

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      rawPrompt: row.raw_prompt,
      parsedObjective: row.parsed_objective || '',
      budgetAmount: row.budget_amount || 0,
      budgetCurrency: row.budget_currency,
      isHardCeiling: row.is_hard_ceiling === 1,
      urgency: row.urgency,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  updateStatus: (id: string, status: IntentSession['status'], parsedObjective?: string): void => {
    const db = getDatabase();
    if (parsedObjective) {
      db.prepare(`
        UPDATE intent_sessions
        SET status = ?, parsed_objective = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(status, parsedObjective, id);
    } else {
      db.prepare(`
        UPDATE intent_sessions
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(status, id);
    }
  },

  update: (
    id: string,
    updates: Partial<{
      rawPrompt: string;
      parsedObjective: string;
      budgetAmount: number;
      budgetCurrency: string;
      isHardCeiling: boolean;
      urgency: 'low' | 'standard' | 'high';
      status: IntentSession['status'];
    }>
  ): IntentSession | null => {
    const db = getDatabase();
    const current = intentRepository.getById(id);
    if (!current) return null;

    const rawPrompt = updates.rawPrompt ?? current.rawPrompt;
    const parsedObjective = updates.parsedObjective ?? current.parsedObjective;
    const budgetAmount = updates.budgetAmount ?? current.budgetAmount;
    const budgetCurrency = updates.budgetCurrency ?? current.budgetCurrency;
    const isHardCeiling = updates.isHardCeiling !== undefined ? (updates.isHardCeiling ? 1 : 0) : (current.isHardCeiling ? 1 : 0);
    const urgency = updates.urgency ?? current.urgency;
    const status = updates.status ?? current.status;

    db.prepare(`
      UPDATE intent_sessions
      SET raw_prompt = ?, parsed_objective = ?, budget_amount = ?, budget_currency = ?, is_hard_ceiling = ?, urgency = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(rawPrompt, parsedObjective, budgetAmount, budgetCurrency, isHardCeiling, urgency, status, id);

    return intentRepository.getById(id);
  },
};

// ============================================================================
// Intent Requirement Repository (Decomposed Categories & Constraints)
// ============================================================================
export const requirementRepository = {
  create: (params: {
    intentSessionId: string;
    categoryId: string;
    categoryName: string;
    priority?: RequirementPriority;
    estimatedBudgetShare?: number;
    specConstraints?: Record<string, unknown>;
  }): IntentRequirement => {
    const db = getDatabase();
    const id = `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const priority = params.priority || 'essential';
    const estimatedBudgetShare = params.estimatedBudgetShare ?? 0.0;
    const specConstraints = params.specConstraints ? JSON.stringify(params.specConstraints) : null;

    db.prepare(`
      INSERT INTO intent_requirements (id, intent_session_id, category_id, category_name, priority, estimated_budget_share, spec_constraints)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.intentSessionId,
      params.categoryId,
      params.categoryName,
      priority,
      estimatedBudgetShare,
      specConstraints
    );

    return {
      id,
      intentSessionId: params.intentSessionId,
      categoryId: params.categoryId,
      categoryName: params.categoryName,
      priority,
      estimatedBudgetShare,
      specConstraints: params.specConstraints || {},
      createdAt: new Date().toISOString(),
    };
  },

  bulkCreate: (
    intentSessionId: string,
    requirements: Array<{
      categoryId: string;
      categoryName: string;
      priority?: RequirementPriority;
      estimatedBudgetShare?: number;
      specConstraints?: Record<string, unknown>;
    }>
  ): IntentRequirement[] => {
    const db = getDatabase();
    requirementRepository.deleteByIntentId(intentSessionId);

    const results: IntentRequirement[] = [];
    const insertStmt = db.prepare(`
      INSERT INTO intent_requirements (id, intent_session_id, category_id, category_name, priority, estimated_budget_share, spec_constraints)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const req of requirements) {
      const id = `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const priority = req.priority || 'essential';
      const estimatedBudgetShare = req.estimatedBudgetShare ?? 0.0;
      const specConstraints = req.specConstraints ? JSON.stringify(req.specConstraints) : null;

      insertStmt.run(
        id,
        intentSessionId,
        req.categoryId,
        req.categoryName,
        priority,
        estimatedBudgetShare,
        specConstraints
      );

      results.push({
        id,
        intentSessionId,
        categoryId: req.categoryId,
        categoryName: req.categoryName,
        priority,
        estimatedBudgetShare,
        specConstraints: req.specConstraints || {},
        createdAt: new Date().toISOString(),
      });
    }

    return results;
  },

  getByIntentId: (intentSessionId: string): IntentRequirement[] => {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM intent_requirements WHERE intent_session_id = ? ORDER BY estimated_budget_share DESC')
      .all(intentSessionId) as any[];

    return rows.map((r) => ({
      id: r.id,
      intentSessionId: r.intent_session_id,
      categoryId: r.category_id,
      categoryName: r.category_name,
      priority: r.priority,
      estimatedBudgetShare: r.estimated_budget_share,
      specConstraints: r.spec_constraints ? JSON.parse(r.spec_constraints) : {},
      createdAt: r.created_at,
    }));
  },

  deleteByIntentId: (intentSessionId: string): void => {
    const db = getDatabase();
    db.prepare('DELETE FROM intent_requirements WHERE intent_session_id = ?').run(intentSessionId);
  },
};

// ============================================================================
// Execution Plan Repository
// ============================================================================
export const planRepository = {
  create: (params: {
    intentSessionId: string;
    planTier: 'budget' | 'balanced' | 'performance';
    summary: string;
    totalEstimatedCost: number;
    currency?: string;
    items: Array<{
      productId: string;
      categoryId: string;
      quantity: number;
      unitPrice: number;
      compatibilityScore?: number;
      selectionReason: string;
      tradeOffNotes?: string;
      isLocked?: boolean;
    }>;
  }): ExecutionPlan => {
    const db = getDatabase();
    const id = `pln_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const currency = params.currency || 'USD';

    // Set other plans for this intent as inactive
    db.prepare('UPDATE execution_plans SET is_active = 0 WHERE intent_session_id = ?').run(
      params.intentSessionId
    );

    db.prepare(`
      INSERT INTO execution_plans (id, intent_session_id, plan_tier, summary, is_active, total_estimated_cost, currency)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `).run(id, params.intentSessionId, params.planTier, params.summary, params.totalEstimatedCost, currency);

    const insertItem = db.prepare(`
      INSERT INTO recommendations (id, execution_plan_id, product_id, category_id, quantity, unit_price, compatibility_score, selection_reason, trade_off_notes, is_locked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const savedItems: ExecutionPlan['items'] = [];
    for (const item of params.items) {
      const recId = `rec_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      insertItem.run(
        recId,
        id,
        item.productId,
        item.categoryId,
        item.quantity,
        item.unitPrice,
        item.compatibilityScore ?? 1.0,
        item.selectionReason,
        item.tradeOffNotes || null,
        item.isLocked ? 1 : 0
      );
      savedItems.push({
        id: recId,
        executionPlanId: id,
        productId: item.productId,
        categoryId: item.categoryId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        compatibilityScore: item.compatibilityScore ?? 1.0,
        selectionReason: item.selectionReason,
        tradeOffNotes: item.tradeOffNotes,
        isLocked: !!item.isLocked,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      id,
      intentSessionId: params.intentSessionId,
      version: 1,
      planTier: params.planTier,
      summary: params.summary,
      isActive: true,
      totalEstimatedCost: params.totalEstimatedCost,
      currency,
      items: savedItems,
      createdAt: new Date().toISOString(),
    };
  },

  getActiveByIntentId: (intentId: string): ExecutionPlan | null => {
    const db = getDatabase();
    const planRow = db
      .prepare('SELECT * FROM execution_plans WHERE intent_session_id = ? AND is_active = 1')
      .get(intentId) as any;

    if (!planRow) return null;

    const itemRows = db
      .prepare('SELECT * FROM recommendations WHERE execution_plan_id = ?')
      .all(planRow.id) as any[];

    return {
      id: planRow.id,
      intentSessionId: planRow.intent_session_id,
      version: planRow.version,
      planTier: planRow.plan_tier,
      summary: planRow.summary,
      isActive: planRow.is_active === 1,
      totalEstimatedCost: planRow.total_estimated_cost,
      currency: planRow.currency,
      items: itemRows.map((r) => ({
        id: r.id,
        executionPlanId: r.execution_plan_id,
        productId: r.product_id,
        categoryId: r.category_id,
        quantity: r.quantity,
        unitPrice: r.unit_price,
        compatibilityScore: r.compatibility_score,
        selectionReason: r.selection_reason,
        tradeOffNotes: r.trade_off_notes,
        isLocked: r.is_locked === 1,
        createdAt: r.created_at,
      })),
      createdAt: planRow.created_at,
    };
  },
};

// ============================================================================
// Product Repository
// ============================================================================
export const productRepository = {
  getAll: (filter?: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    query?: string;
    attributeKey?: string;
    attributeValue?: string;
    inStockOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Product[] => {
    const db = getDatabase();
    let sql = 'SELECT DISTINCT p.* FROM products p';
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Optional JOIN on attributes for key/value filtering
    if (filter?.attributeKey) {
      sql += ' JOIN product_attributes pa ON p.id = pa.product_id';
      conditions.push('pa.attribute_key = ?');
      params.push(filter.attributeKey);

      if (filter.attributeValue) {
        conditions.push('pa.attribute_value LIKE ?');
        params.push(`%${filter.attributeValue}%`);
      }
    }

    if (filter?.inStockOnly ?? true) {
      conditions.push('p.in_stock = 1');
    }

    if (filter?.categoryId) {
      conditions.push('LOWER(p.category_id) = LOWER(?)');
      params.push(filter.categoryId);
    }

    if (filter?.minPrice !== undefined) {
      conditions.push('p.base_price >= ?');
      params.push(filter.minPrice);
    }

    if (filter?.maxPrice !== undefined) {
      conditions.push('p.base_price <= ?');
      params.push(filter.maxPrice);
    }

    if (filter?.query) {
      conditions.push(
        '(p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ? OR p.sku LIKE ?)'
      );
      const term = `%${filter.query}%`;
      params.push(term, term, term, term);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY p.rating DESC, p.review_count DESC';

    if (filter?.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
      if (filter?.offset) {
        sql += ' OFFSET ?';
        params.push(filter.offset);
      }
    }

    const rows = db.prepare(sql).all(...params) as any[];

    // Fetch all attributes for retrieved products
    if (rows.length === 0) return [];
    const productIds = rows.map((r) => r.id);
    const attrPlaceholders = productIds.map(() => '?').join(',');
    const attrRows = db
      .prepare(`SELECT * FROM product_attributes WHERE product_id IN (${attrPlaceholders})`)
      .all(...productIds) as any[];

    const attrMap = new Map<string, ProductAttribute[]>();
    for (const a of attrRows) {
      const list = attrMap.get(a.product_id) || [];
      list.push({
        id: a.id,
        productId: a.product_id,
        attributeKey: a.attribute_key,
        attributeValue: a.attribute_value,
        attributeType: a.attribute_type,
        isFilterable: a.is_filterable === 1,
      });
      attrMap.set(a.product_id, list);
    }

    return rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      title: r.title,
      categoryId: r.category_id,
      brand: r.brand,
      basePrice: r.base_price,
      currency: r.currency,
      rating: r.rating,
      reviewCount: r.review_count,
      inStock: r.in_stock === 1,
      imageUrl: r.image_url,
      description: r.description,
      attributes: attrMap.get(r.id) || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  getById: (id: string): Product | null => {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!r) return null;

    const attrRows = db
      .prepare('SELECT * FROM product_attributes WHERE product_id = ?')
      .all(id) as any[];

    const attributes: ProductAttribute[] = attrRows.map((a) => ({
      id: a.id,
      productId: a.product_id,
      attributeKey: a.attribute_key,
      attributeValue: a.attribute_value,
      attributeType: a.attribute_type,
      isFilterable: a.is_filterable === 1,
    }));

    return {
      id: r.id,
      sku: r.sku,
      title: r.title,
      categoryId: r.category_id,
      brand: r.brand,
      basePrice: r.base_price,
      currency: r.currency,
      rating: r.rating,
      reviewCount: r.review_count,
      inStock: r.in_stock === 1,
      imageUrl: r.image_url,
      description: r.description,
      attributes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  getByIds: (ids: string[]): Product[] => {
    if (ids.length === 0) return [];
    const db = getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`SELECT * FROM products WHERE id IN (${placeholders})`).all(...ids) as any[];

    const attrRows = db
      .prepare(`SELECT * FROM product_attributes WHERE product_id IN (${placeholders})`)
      .all(...ids) as any[];

    const attrMap = new Map<string, ProductAttribute[]>();
    for (const a of attrRows) {
      const list = attrMap.get(a.product_id) || [];
      list.push({
        id: a.id,
        productId: a.product_id,
        attributeKey: a.attribute_key,
        attributeValue: a.attribute_value,
        attributeType: a.attribute_type,
        isFilterable: a.is_filterable === 1,
      });
      attrMap.set(a.product_id, list);
    }

    return rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      title: r.title,
      categoryId: r.category_id,
      brand: r.brand,
      basePrice: r.base_price,
      currency: r.currency,
      rating: r.rating,
      reviewCount: r.review_count,
      inStock: r.in_stock === 1,
      imageUrl: r.image_url,
      description: r.description,
      attributes: attrMap.get(r.id) || [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  getCategories: (): Array<{ categoryId: string; count: number; minPrice: number; maxPrice: number }> => {
    const db = getDatabase();
    const rows = db
      .prepare(`
        SELECT category_id as categoryId, COUNT(*) as count, MIN(base_price) as minPrice, MAX(base_price) as maxPrice
        FROM products
        WHERE in_stock = 1
        GROUP BY category_id
        ORDER BY category_id ASC
      `)
      .all() as any[];

    return rows.map((r) => ({
      categoryId: r.categoryId,
      count: Number(r.count),
      minPrice: Number(r.minPrice),
      maxPrice: Number(r.maxPrice),
    }));
  },
};

// ============================================================================
// Shopping Cart Repository
// ============================================================================
export const cartRepository = {
  getActiveCartBySessionId: (sessionId: string): ShoppingCart | null => {
    const db = getDatabase();
    const existing = db
      .prepare("SELECT * FROM shopping_carts WHERE session_id = ? AND status = 'active'")
      .get(sessionId) as any;

    if (existing) {
      return cartRepository.getWithItems(existing.id);
    }
    return null;
  },

  getOrCreate: (sessionId: string, intentSessionId: string): ShoppingCart => {
    const db = getDatabase();
    const existing = db
      .prepare("SELECT * FROM shopping_carts WHERE session_id = ? AND status = 'active'")
      .get(sessionId) as any;

    if (existing) {
      return cartRepository.getWithItems(existing.id);
    }

    const id = `crt_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    db.prepare(`
      INSERT INTO shopping_carts (id, session_id, intent_session_id, status, subtotal, estimated_tax, shipping_fee, total_amount, currency)
      VALUES (?, ?, ?, 'active', 0.0, 0.0, 0.0, 0.0, 'USD')
    `).run(id, sessionId, intentSessionId);

    return {
      id,
      sessionId,
      intentSessionId,
      status: 'active',
      subtotal: 0,
      estimatedTax: 0,
      shippingFee: 0,
      totalAmount: 0,
      currency: 'USD',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  getWithItems: (cartId: string): ShoppingCart => {
    const db = getDatabase();
    const cart = db.prepare('SELECT * FROM shopping_carts WHERE id = ?').get(cartId) as any;
    if (!cart) throw new Error(`Cart ${cartId} not found`);

    const itemRows = db
      .prepare(`
        SELECT ci.*, p.title as prod_title, p.sku as prod_sku, p.brand as prod_brand,
               p.base_price as prod_base_price, p.image_url as prod_image_url,
               p.category_id as prod_category_id, p.rating as prod_rating,
               p.review_count as prod_review_count, p.in_stock as prod_in_stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
      `)
      .all(cartId) as any[];

    const items: CartItem[] = itemRows.map((r) => ({
      id: r.id,
      cartId: r.cart_id,
      productId: r.product_id,
      quantity: r.quantity,
      unitPrice: r.unit_price,
      isCustomSelection: r.is_custom_selection === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      product: {
        id: r.product_id,
        sku: r.prod_sku,
        title: r.prod_title,
        categoryId: r.prod_category_id,
        brand: r.prod_brand,
        basePrice: r.prod_base_price,
        currency: cart.currency,
        rating: r.prod_rating,
        reviewCount: r.prod_review_count,
        inStock: r.prod_in_stock === 1,
        imageUrl: r.prod_image_url,
        description: '',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    }));

    return {
      id: cart.id,
      sessionId: cart.session_id,
      intentSessionId: cart.intent_session_id,
      status: cart.status,
      subtotal: cart.subtotal,
      estimatedTax: cart.estimated_tax,
      shippingFee: cart.shipping_fee,
      totalAmount: cart.total_amount,
      currency: cart.currency,
      items,
      createdAt: cart.created_at,
      updatedAt: cart.updated_at,
    };
  },

  addItem: (cartId: string, productId: string, quantity = 1): ShoppingCart => {
    const db = getDatabase();
    const product = productRepository.getById(productId);
    if (!product) throw new Error(`Product ${productId} not found`);
    if (!product.inStock) throw new Error(`Product ${productId} is currently out of stock`);

    const validQuantity = Math.max(1, Math.min(10, Math.floor(quantity)));

    const existingItem = db
      .prepare('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?')
      .get(cartId, productId) as { id: string; quantity: number } | undefined;

    if (existingItem) {
      const newQty = Math.min(10, existingItem.quantity + validQuantity);
      db.prepare(`
        UPDATE cart_items
        SET quantity = ?, unit_price = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newQty, product.basePrice, existingItem.id);
    } else {
      const itemId = `cit_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      db.prepare(`
        INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price, is_custom_selection)
        VALUES (?, ?, ?, ?, ?, 0)
      `).run(itemId, cartId, productId, validQuantity, product.basePrice);
    }

    cartRepository.recalculateTotals(cartId);
    return cartRepository.getWithItems(cartId);
  },

  updateItemQuantity: (cartId: string, itemId: string, quantity: number): ShoppingCart => {
    const db = getDatabase();
    if (quantity <= 0) {
      return cartRepository.removeItem(cartId, itemId);
    }

    const clampedQty = Math.max(1, Math.min(10, Math.floor(quantity)));
    db.prepare(`
      UPDATE cart_items
      SET quantity = ?, updated_at = datetime('now')
      WHERE id = ? AND cart_id = ?
    `).run(clampedQty, itemId, cartId);

    cartRepository.recalculateTotals(cartId);
    return cartRepository.getWithItems(cartId);
  },

  removeItem: (cartId: string, itemId: string): ShoppingCart => {
    const db = getDatabase();
    db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(itemId, cartId);
    cartRepository.recalculateTotals(cartId);
    return cartRepository.getWithItems(cartId);
  },

  clearCart: (cartId: string): ShoppingCart => {
    const db = getDatabase();
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cartId);
    db.prepare(`
      UPDATE shopping_carts
      SET subtotal = 0.0, estimated_tax = 0.0, shipping_fee = 0.0, total_amount = 0.0, updated_at = datetime('now')
      WHERE id = ?
    `).run(cartId);
    return cartRepository.getWithItems(cartId);
  },

  syncItems: (cartId: string, items: Array<{ productId: string; quantity: number }>): ShoppingCart => {
    const db = getDatabase();
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cartId);

    const insertStmt = db.prepare(`
      INSERT INTO cart_items (id, cart_id, product_id, quantity, unit_price, is_custom_selection)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    for (const item of items) {
      const product = productRepository.getById(item.productId);
      if (!product) continue;
      const itemId = `cit_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const qty = Math.max(1, Math.floor(item.quantity || 1));
      insertStmt.run(itemId, cartId, product.id, qty, product.basePrice);
    }

    cartRepository.recalculateTotals(cartId);
    return cartRepository.getWithItems(cartId);
  },

  /**
   * Recalculate cart totals using safe integer minor units (cents)
   * eliminating IEEE 754 precision errors.
   */
  recalculateTotals: (cartId: string): void => {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT quantity, unit_price FROM cart_items WHERE cart_id = ?')
      .all(cartId) as { quantity: number; unit_price: number }[];

    const lineItems = rows.map((r) => ({ price: r.unit_price, quantity: r.quantity }));
    const totals = Money.calculateTotals(lineItems, 0.08, 0.0);

    db.prepare(`
      UPDATE shopping_carts
      SET subtotal = ?, estimated_tax = ?, shipping_fee = ?, total_amount = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(totals.subtotal, totals.tax, totals.shipping, totals.total, cartId);
  },

  /**
   * Validates cart items against current database inventory & authoritative prices.
   * Auto-corrects outdated cached prices.
   */
  validateCart: (
    cartId: string
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    cart: ShoppingCart;
  } => {
    const cart = cartRepository.getWithItems(cartId);
    const errors: string[] = [];
    const warnings: string[] = [];
    const db = getDatabase();

    if (cart.items.length === 0) {
      errors.push('Cart is empty.');
      return { isValid: false, errors, warnings, cart };
    }

    let needsRecalculation = false;

    for (const item of cart.items) {
      const currentProduct = productRepository.getById(item.productId);
      if (!currentProduct) {
        errors.push(`Product with ID "${item.productId}" is no longer available in the catalog.`);
        continue;
      }

      if (!currentProduct.inStock) {
        errors.push(`Item "${currentProduct.title}" is currently out of stock.`);
      }

      if (item.quantity > 10) {
        warnings.push(`Quantity for "${currentProduct.title}" was capped at maximum allowed (10).`);
        db.prepare('UPDATE cart_items SET quantity = 10 WHERE id = ?').run(item.id);
        needsRecalculation = true;
      }

      // Check for price tampering or outdated cache
      if (item.unitPrice !== currentProduct.basePrice) {
        warnings.push(
          `Price for "${currentProduct.title}" was updated from $${item.unitPrice.toFixed(
            2
          )} to authoritative catalog price $${currentProduct.basePrice.toFixed(2)}.`
        );
        db.prepare('UPDATE cart_items SET unit_price = ? WHERE id = ?').run(
          currentProduct.basePrice,
          item.id
        );
        needsRecalculation = true;
      }
    }

    if (needsRecalculation) {
      cartRepository.recalculateTotals(cartId);
    }

    const updatedCart = cartRepository.getWithItems(cartId);
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cart: updatedCart,
    };
  },
};

// ============================================================================
// Order & Payment Repository
// ============================================================================
export const orderRepository = {
  createFromCart: (cart: ShoppingCart): Order => {
    const db = getDatabase();

    // Security check: Cart must be active
    const currentCart = db.prepare('SELECT status FROM shopping_carts WHERE id = ?').get(cart.id) as any;
    if (currentCart && currentCart.status === 'converted') {
      throw new Error('Duplicate order: Cart has already been converted into an order.');
    }

    // Authoritative server-side price recalculation directly from DB
    const validation = cartRepository.validateCart(cart.id);
    if (!validation.isValid) {
      throw new Error(`Cannot checkout: ${validation.errors.join('; ')}`);
    }

    const id = `ord_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const orderNumber = `PI-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 900 + 100
    )}`;

    const freshCart = validation.cart;

    db.prepare(`
      INSERT INTO orders (id, cart_id, session_id, intent_session_id, order_number, status, currency, subtotal, tax_amount, shipping_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).run(
      id,
      freshCart.id,
      freshCart.sessionId,
      freshCart.intentSessionId,
      orderNumber,
      freshCart.currency,
      freshCart.subtotal,
      freshCart.estimatedTax,
      freshCart.shippingFee,
      freshCart.totalAmount
    );

    // Lock cart to prevent tampering or duplicate order generation
    db.prepare("UPDATE shopping_carts SET status = 'converted', updated_at = datetime('now') WHERE id = ?").run(
      freshCart.id
    );

    return {
      id,
      cartId: freshCart.id,
      sessionId: freshCart.sessionId,
      intentSessionId: freshCart.intentSessionId,
      orderNumber,
      status: 'pending',
      currency: freshCart.currency,
      subtotal: freshCart.subtotal,
      taxAmount: freshCart.estimatedTax,
      shippingAmount: freshCart.shippingFee,
      totalAmount: freshCart.totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  getById: (id: string): Order | null => {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      cartId: r.cart_id,
      sessionId: r.session_id,
      intentSessionId: r.intent_session_id,
      orderNumber: r.order_number,
      status: r.status,
      currency: r.currency,
      subtotal: r.subtotal,
      taxAmount: r.tax_amount,
      shippingAmount: r.shipping_amount,
      totalAmount: r.total_amount,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  getBySessionId: (sessionId: string): Order[] => {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC')
      .all(sessionId) as any[];

    return rows.map((r) => ({
      id: r.id,
      cartId: r.cart_id,
      sessionId: r.session_id,
      intentSessionId: r.intent_session_id,
      orderNumber: r.order_number,
      status: r.status,
      currency: r.currency,
      subtotal: r.subtotal,
      taxAmount: r.tax_amount,
      shippingAmount: r.shipping_amount,
      totalAmount: r.total_amount,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  updateStatus: (id: string, status: Order['status']): void => {
    const db = getDatabase();
    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  },
};

// ============================================================================
// Transaction & Audit Repository
// ============================================================================
export const transactionRepository = {
  create: (params: {
    paymentId: string;
    orderId: string;
    sessionId: string;
    status: 'SUCCESS' | 'FAILED';
    grossAmount: number;
    feeAmount?: number;
    netAmount?: number;
    currency: string;
    intentSummary: string;
    auditSnapshot: Record<string, unknown>;
  }): TransactionRecord => {
    const db = getDatabase();
    const id = `tx_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const feeAmount = params.feeAmount ?? Money.fromCents(Math.round(Money.toCents(params.grossAmount) * 0.0349 + 49));
    const netAmount = params.netAmount ?? Money.fromCents(Money.toCents(params.grossAmount) - Money.toCents(feeAmount));

    // Generate cryptographic SHA-256 digital receipt seal
    const timestamp = new Date().toISOString();
    const hashData = `${params.orderId}:${params.paymentId}:${params.grossAmount}:${params.sessionId}:${timestamp}`;
    const transactionHash = crypto.createHash('sha256').update(hashData).digest('hex');

    db.prepare(`
      INSERT INTO transaction_records (id, payment_id, order_id, session_id, transaction_hash, status, gross_amount, fee_amount, net_amount, currency, intent_summary, audit_snapshot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.paymentId,
      params.orderId,
      params.sessionId,
      transactionHash,
      params.status,
      params.grossAmount,
      feeAmount,
      netAmount,
      params.currency,
      params.intentSummary,
      JSON.stringify(params.auditSnapshot)
    );

    return {
      id,
      paymentId: params.paymentId,
      orderId: params.orderId,
      sessionId: params.sessionId,
      transactionHash,
      status: params.status,
      grossAmount: params.grossAmount,
      feeAmount,
      netAmount,
      currency: params.currency,
      intentSummary: params.intentSummary,
      auditSnapshot: params.auditSnapshot,
      createdAt: timestamp,
    };
  },

  getById: (id: string): TransactionRecord | null => {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM transaction_records WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      paymentId: r.payment_id,
      orderId: r.order_id,
      sessionId: r.session_id,
      transactionHash: r.transaction_hash,
      status: r.status,
      grossAmount: r.gross_amount,
      feeAmount: r.fee_amount,
      netAmount: r.net_amount,
      currency: r.currency,
      intentSummary: r.intent_summary,
      auditSnapshot: JSON.parse(r.audit_snapshot),
      createdAt: r.created_at,
    };
  },

  getAllBySession: (sessionId: string): TransactionRecord[] => {
    const db = getDatabase();
    const rows = db
      .prepare('SELECT * FROM transaction_records WHERE session_id = ? ORDER BY created_at DESC')
      .all(sessionId) as any[];

    return rows.map((r) => ({
      id: r.id,
      paymentId: r.payment_id,
      orderId: r.order_id,
      sessionId: r.session_id,
      transactionHash: r.transaction_hash,
      status: r.status,
      grossAmount: r.gross_amount,
      feeAmount: r.fee_amount,
      netAmount: r.net_amount,
      currency: r.currency,
      intentSummary: r.intent_summary,
      auditSnapshot: JSON.parse(r.audit_snapshot),
      createdAt: r.created_at,
    }));
  },
};
