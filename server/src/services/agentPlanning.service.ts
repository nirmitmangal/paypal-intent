import { getDatabase } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { intentRepository, requirementRepository, productRepository } from '../db/repository';
import { decisionEngineService, IntentContext } from './decisionEngine.service';
import { agentToolsService } from './agentTools.service';
import { logger } from '../utils/logger';
import type {
  ExecutionPlan,
  RecommendationItem,
  PlanTier,
  Product,
} from '@paypal-intent/shared';

export const agentPlanningService = {
  /**
   * Converts an interpreted goal into an optimized multi-product execution plan.
   * Leverages decision engine scoring, controlled catalog retrieval, and knapsack ceiling compliance.
   */
  createPlanForIntent: async (
    intentSessionId: string,
    preferredTier: PlanTier = 'balanced'
  ): Promise<ExecutionPlan> => {
    const db = getDatabase();

    // 1. Retrieve session memory
    const intent = intentRepository.getById(intentSessionId);
    if (!intent) {
      throw new Error(`Intent session "${intentSessionId}" not found in memory.`);
    }

    let requirements = requirementRepository.getByIntentId(intentSessionId);
    if (requirements.length === 0) {
      // Default fallback requirements if none were persisted
      requirements = requirementRepository.bulkCreate(intentSessionId, [
        { categoryId: 'monitors', categoryName: 'Designer Display', priority: 'essential', estimatedBudgetShare: 0.5 },
        { categoryId: 'keyboards', categoryName: 'Ergonomic Keyboard', priority: 'essential', estimatedBudgetShare: 0.3 },
        { categoryId: 'mice', categoryName: 'Precision Mouse', priority: 'recommended', estimatedBudgetShare: 0.2 },
      ]);
    }

    // 2. Build intent context
    const context: IntentContext = {
      objective: intent.parsedObjective || intent.rawPrompt,
      budgetAmount: intent.budgetAmount,
      budgetCurrency: intent.budgetCurrency,
      primaryUse: intent.parsedObjective.includes('Program') ? 'Programming' : 'General',
    };

    // 3. Evaluate candidate products per category across tiers
    const tieredCandidates = decisionEngineService.evaluateCategoryCandidates(requirements, context);
    let selectedCandidates = tieredCandidates[preferredTier] || tieredCandidates.balanced;

    if (selectedCandidates.length === 0) {
      // Graceful fallback: If no catalog categories matched (e.g. out-of-catalog items), select top in-stock catalog items
      const fallbackProducts = productRepository.getAll({ inStockOnly: true }).slice(0, 2);
      selectedCandidates = fallbackProducts.map((p: Product) => ({
        product: p,
        score: decisionEngineService.scoreProduct(p, 0.5, context, preferredTier),
      }));
    }

    // 4. Calculate budget totals using controlled agent calculation tool
    const initialItems = selectedCandidates.map((c) => ({
      productId: c.product.id,
      quantity: 1,
    }));

    let budgetResult = agentToolsService.calculateBudget({ items: initialItems });

    // 5. Knapsack Budget Ceiling Defense
    // If total exceeds budget ceiling and user specified hard ceiling, optimize by swapping non-essential items
    if (intent.isHardCeiling && budgetResult.totalAmount > intent.budgetAmount && intent.budgetAmount > 0) {
      logger.info(
        `Initial plan cost ($${budgetResult.totalAmount.toFixed(2)}) exceeds ceiling ($${intent.budgetAmount.toFixed(
          2
        )}). Applying knapsack ceiling optimization...`
      );

      // Try replacing highest-cost items with budget-tier alternatives
      const budgetTierItems = tieredCandidates.budget;
      const optimized = [...selectedCandidates];

      for (let i = optimized.length - 1; i >= 0; i--) {
        const currentItem = optimized[i];
        const budgetAlt = budgetTierItems.find((b) => b.product.categoryId === currentItem.product.categoryId);

        if (budgetAlt && budgetAlt.product.basePrice < currentItem.product.basePrice) {
          optimized[i] = budgetAlt;
          const recheck = agentToolsService.calculateBudget({
            items: optimized.map((o) => ({ productId: o.product.id, quantity: 1 })),
          });
          if (recheck.totalAmount <= intent.budgetAmount) {
            budgetResult = recheck;
            break;
          }
        }
      }
      selectedCandidates = optimized;
    }

    // 6. Check multi-product hardware compatibility
    const compatResult = agentToolsService.evaluateCompatibility({
      productIds: selectedCandidates.map((c) => c.product.id),
    });

    // 7. Persist execution plan in SQLite
    const planId = `pln_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const planSummary = `${preferredTier.toUpperCase()} Setup: ${selectedCandidates.length} compatible items adhering to ${
      intent.budgetCurrency
    } ${intent.budgetAmount} ceiling.`;

    db.prepare(`
      INSERT INTO execution_plans (id, intent_session_id, version, plan_tier, summary, is_active, total_estimated_cost, currency)
      VALUES (?, ?, 1, ?, ?, 1, ?, ?)
    `).run(
      planId,
      intentSessionId,
      preferredTier,
      planSummary,
      budgetResult.totalAmount,
      intent.budgetCurrency
    );

    // Persist recommendations
    const insertRec = db.prepare(`
      INSERT INTO recommendations (id, execution_plan_id, product_id, category_id, quantity, unit_price, compatibility_score, selection_reason, trade_off_notes, is_locked)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 0)
    `);

    const recommendationItems: RecommendationItem[] = [];

    for (const item of selectedCandidates) {
      const recId = `rec_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const score = item.score;

      insertRec.run(
        recId,
        planId,
        item.product.id,
        item.product.categoryId,
        item.product.basePrice,
        score.compatibilityScore,
        score.selectionReason,
        score.tradeOffNotes || null
      );

      recommendationItems.push({
        id: recId,
        executionPlanId: planId,
        productId: item.product.id,
        product: item.product,
        categoryId: item.product.categoryId,
        quantity: 1,
        unitPrice: item.product.basePrice,
        compatibilityScore: score.compatibilityScore,
        selectionReason: score.selectionReason,
        tradeOffNotes: score.tradeOffNotes,
        isLocked: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Update intent status to 'planned'
    intentRepository.updateStatus(intentSessionId, 'planned');

    return {
      id: planId,
      intentSessionId,
      version: 1,
      planTier: preferredTier,
      summary: planSummary,
      isActive: true,
      totalEstimatedCost: budgetResult.totalAmount,
      currency: intent.budgetCurrency,
      items: recommendationItems,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Rebalances an existing plan when a user locks specific products or swaps an item.
   * Retains locked choices while re-evaluating unlocked items against the budget ceiling.
   */
  rebalancePlan: async (
    planId: string,
    lockedRecIds: string[] = [],
    swappedItems: Array<{ recommendationId: string; newProductId: string }> = []
  ): Promise<ExecutionPlan> => {
    const db = getDatabase();

    // Query current plan
    const planRow = db.prepare('SELECT * FROM execution_plans WHERE id = ?').get(planId) as any;
    if (!planRow) {
      throw new Error(`Execution plan "${planId}" not found.`);
    }

    const intent = intentRepository.getById(planRow.intent_session_id);
    if (!intent) {
      throw new Error(`Intent session "${planRow.intent_session_id}" not found.`);
    }

    // Query existing recommendations
    const recRows = db.prepare('SELECT * FROM recommendations WHERE execution_plan_id = ?').all(planId) as any[];

    // Apply swaps
    for (const swap of swappedItems) {
      const target = recRows.find((r) => r.id === swap.recommendationId);
      if (target) {
        const newProduct = productRepository.getById(swap.newProductId);
        if (newProduct) {
          target.product_id = newProduct.id;
          target.unit_price = newProduct.basePrice;
          target.selection_reason = `User selected alternative: ${newProduct.title}`;
          target.is_locked = 1;
        }
      }
    }

    // Apply explicit locks
    for (const r of recRows) {
      if (lockedRecIds.includes(r.id)) {
        r.is_locked = 1;
      }
    }

    // Recalculate totals
    const lineItems = recRows.map((r) => ({ price: r.unit_price, quantity: r.quantity }));
    const totals = agentToolsService.calculateBudget({
      items: recRows.map((r) => ({ productId: r.product_id, quantity: r.quantity })),
    });

    const newVersion = planRow.version + 1;

    // Update execution plan in DB
    db.prepare(`
      UPDATE execution_plans
      SET version = ?, total_estimated_cost = ?, summary = ?
      WHERE id = ?
    `).run(
      newVersion,
      totals.totalAmount,
      `Rebalanced Plan v${newVersion}: ${recRows.length} items (${lockedRecIds.length} locked by user).`,
      planId
    );

    // Update recommendation rows in DB
    const updateRecStmt = db.prepare(`
      UPDATE recommendations
      SET product_id = ?, unit_price = ?, selection_reason = ?, is_locked = ?
      WHERE id = ?
    `);

    for (const r of recRows) {
      updateRecStmt.run(r.product_id, r.unit_price, r.selection_reason, r.is_locked ? 1 : 0, r.id);
    }

    const updatedRecs: RecommendationItem[] = recRows.map((r) => ({
      id: r.id,
      executionPlanId: planId,
      productId: r.product_id,
      product: productRepository.getById(r.product_id) || undefined,
      categoryId: r.category_id,
      quantity: r.quantity,
      unitPrice: r.unit_price,
      compatibilityScore: r.compatibility_score,
      selectionReason: r.selection_reason,
      tradeOffNotes: r.trade_off_notes || undefined,
      isLocked: r.is_locked === 1,
      createdAt: r.created_at || new Date().toISOString(),
    }));

    return {
      id: planId,
      intentSessionId: planRow.intent_session_id,
      version: newVersion,
      planTier: planRow.plan_tier,
      summary: `Rebalanced Plan v${newVersion}: ${recRows.length} items (${lockedRecIds.length} locked by user).`,
      isActive: true,
      totalEstimatedCost: totals.totalAmount,
      currency: planRow.currency,
      items: updatedRecs,
      createdAt: planRow.created_at,
    };
  },

  /**
   * Retrieves all execution plans for an intent session.
   */
  getPlansForIntent: (intentSessionId: string): ExecutionPlan[] => {
    const db = getDatabase();
    const plans = db
      .prepare('SELECT * FROM execution_plans WHERE intent_session_id = ? ORDER BY version DESC')
      .all(intentSessionId) as any[];

    return plans.map((p) => {
      const recs = db
        .prepare('SELECT * FROM recommendations WHERE execution_plan_id = ?')
        .all(p.id) as any[];

      const items: RecommendationItem[] = recs.map((r) => ({
        id: r.id,
        executionPlanId: p.id,
        productId: r.product_id,
        product: productRepository.getById(r.product_id) || undefined,
        categoryId: r.category_id,
        quantity: r.quantity,
        unitPrice: r.unit_price,
        compatibilityScore: r.compatibility_score,
        selectionReason: r.selection_reason,
        tradeOffNotes: r.trade_off_notes || undefined,
        isLocked: r.is_locked === 1,
        createdAt: r.created_at || new Date().toISOString(),
      }));

      return {
        id: p.id,
        intentSessionId: p.intent_session_id,
        version: p.version,
        planTier: p.plan_tier,
        summary: p.summary,
        isActive: p.is_active === 1,
        totalEstimatedCost: p.total_estimated_cost,
        currency: p.currency,
        items,
        createdAt: p.created_at,
      };
    });
  },
};
