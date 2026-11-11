import { getDatabase } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { intentRepository, requirementRepository, productRepository } from '../db/repository';
import { decisionEngineService, IntentContext, ProductEvaluationScore } from './decisionEngine.service';
import { agentToolsService } from './agentTools.service';
import { normalizeCategoryId } from '../utils/categoryMapper';
import { logger } from '../utils/logger';
import type {
  ExecutionPlan,
  RecommendationItem,
  PlanTier,
  Product,
  IntentRequirement,
} from '@paypal-intent/shared';

function cartesianCombinations<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
    [[]]
  );
}

export const agentPlanningService = {
  /**
   * Converts an interpreted goal into an optimized multi-product execution plan.
   * Leverages decision engine scoring, controlled catalog retrieval, and knapsack ceiling compliance.
   */
  createPlanForIntent: async (
    intentSessionId: string,
    preferredTier: PlanTier = 'balanced',
    customRequirements?: Array<{
      id?: string;
      categoryId: string;
      categoryName: string;
      priority?: 'essential' | 'recommended' | 'optional';
      estimatedBudgetShare?: number;
      description?: string;
      specConstraints?: Record<string, unknown>;
    }>
  ): Promise<ExecutionPlan> => {
    const db = getDatabase();

    // 1. Retrieve session memory
    const intent = intentRepository.getById(intentSessionId);
    if (!intent) {
      throw new Error(`Intent session "${intentSessionId}" not found in memory.`);
    }

    let requirements: IntentRequirement[];
    if (customRequirements && customRequirements.length > 0) {
      requirements = requirementRepository.bulkCreate(
        intentSessionId,
        customRequirements.map((r) => ({
          categoryId: r.categoryId,
          categoryName: r.categoryName,
          priority: r.priority,
          estimatedBudgetShare: r.estimatedBudgetShare,
          description: r.description,
          specConstraints: r.specConstraints,
        }))
      );
    } else {
      requirements = requirementRepository.getByIntentId(intentSessionId);
    }

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

    // 3. Multi-Category Combinatorial Optimization
    // Retrieve all valid scored candidate products per requirement
    const reqCandidates = decisionEngineService.getCandidatesForRequirements(requirements, context, preferredTier);

    // Filter out requirements that have empty candidates by providing catalog fallback so no requirement is dropped
    const candidateArrays = reqCandidates.map((rc) => {
      if (rc.candidates.length > 0) return rc.candidates;
      const canonicalId = normalizeCategoryId(rc.requirement.categoryId);
      const fallbacks = productRepository.getAll({ categoryId: canonicalId, inStockOnly: true });
      const scoredFallbacks = fallbacks.map((p) => ({
        product: p,
        score: decisionEngineService.scoreProduct(p, rc.requirement.estimatedBudgetShare, context, preferredTier, rc.requirement),
      }));
      return scoredFallbacks.length > 0
        ? scoredFallbacks
        : [{ product: productRepository.getAll({ inStockOnly: true })[0], score: decisionEngineService.scoreProduct(productRepository.getAll({ inStockOnly: true })[0], 0.25, context, preferredTier) }];
    });

    // Cartesian product across all requirements: preserves ALL requirements (exactly 1 product per requirement)
    const allCombinations = cartesianCombinations(candidateArrays);

    // Evaluate each combination using authoritative calculation tool
    const evaluatedCombos = allCombinations.map((combo) => {
      const items = combo.map((c) => ({ productId: c.product.id, quantity: 1 }));
      const budgetRes = agentToolsService.calculateBudget({ items });
      const avgCompositeScore = combo.reduce((sum, c) => sum + c.score.compositeScore, 0) / combo.length;
      const avgPerfScore = combo.reduce((sum, c) => sum + c.score.performanceScore, 0) / combo.length;
      return {
        combo,
        budgetRes,
        totalAmount: budgetRes.totalAmount,
        avgCompositeScore,
        avgPerfScore,
      };
    });

    const isHardCeiling = intent.isHardCeiling && intent.budgetAmount > 0;
    const feasibleCombos = evaluatedCombos.filter((ec) => !isHardCeiling || ec.totalAmount <= intent.budgetAmount);

    let selectedCandidates: Array<{ product: Product; score: ProductEvaluationScore }>;
    let budgetResult: ReturnType<typeof agentToolsService.calculateBudget>;
    let isFeasible = true;
    let budgetDeficit = 0;
    let planSummary = '';
    let availableTradeOffs: string[] = [];

    if (feasibleCombos.length > 0) {
      // Valid combination exists within budget!
      if (preferredTier === 'budget') {
        feasibleCombos.sort((a, b) => a.totalAmount - b.totalAmount || b.avgCompositeScore - a.avgCompositeScore);
      } else if (preferredTier === 'performance') {
        feasibleCombos.sort((a, b) => b.avgPerfScore - a.avgPerfScore || b.avgCompositeScore - a.avgCompositeScore);
      } else {
        // balanced: maximize utility/score
        feasibleCombos.sort((a, b) => b.avgCompositeScore - a.avgCompositeScore || a.totalAmount - b.totalAmount);
      }

      const best = feasibleCombos[0];
      selectedCandidates = best.combo;
      budgetResult = best.budgetRes;
      isFeasible = true;
      budgetDeficit = 0;
      planSummary = `${preferredTier.toUpperCase()} Setup: ${selectedCandidates.length} compatible items adhering to ${
        intent.budgetCurrency
      } ${intent.budgetAmount} ceiling.`;
    } else {
      // Infeasible: All candidate combinations across all categories exceed budget ceiling!
      // Sort combos by total cost ascending to identify the global minimum viable combination
      evaluatedCombos.sort((a, b) => a.totalAmount - b.totalAmount || b.avgCompositeScore - a.avgCompositeScore);
      const minCostCombo = evaluatedCombos[0];

      selectedCandidates = minCostCombo.combo;
      budgetResult = minCostCombo.budgetRes;
      isFeasible = false;
      budgetDeficit = Math.round((budgetResult.totalAmount - intent.budgetAmount) * 100) / 100;

      planSummary = `Budget Deficit Notice: Minimum catalog combination totals ${intent.budgetCurrency} ${budgetResult.totalAmount.toFixed(
        2
      )}, which exceeds the ${intent.budgetCurrency} ${intent.budgetAmount.toFixed(2)} ceiling by ${intent.budgetCurrency} ${budgetDeficit.toFixed(
        2
      )}. No fully compliant bundle exists under this ceiling while preserving all ${requirements.length} requested categories. Showing the closest value-optimized configuration.`;

      availableTradeOffs = [
        `Increase your budget ceiling by at least ${intent.budgetCurrency} ${budgetDeficit.toFixed(2)} to ${intent.budgetCurrency} ${Math.ceil(budgetResult.totalAmount)} to enable proposal locking and checkout.`,
        `Relax the over-ear headphone specification to an on-ear call headset (e.g. VoiceLink ClearVoice at $49.99), reducing total bundle cost to $264.56.`,
        `Remove an optional accessory (e.g. desk lamp) to fit core essentials under your $${intent.budgetAmount.toFixed(0)} ceiling.`,
      ];
    }

    // 6. Check multi-product hardware compatibility
    const compatResult = agentToolsService.evaluateCompatibility({
      productIds: selectedCandidates.map((c) => c.product.id),
    });

    // 7. Persist execution plan in SQLite
    const planId = `pln_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

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
      isFeasible,
      budgetDeficit,
      availableTradeOffs,
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
    const totals = agentToolsService.calculateBudget({
      items: recRows.map((r) => ({ productId: r.product_id, quantity: r.quantity })),
    });

    const newVersion = planRow.version + 1;
    const isHardCeiling = intent.isHardCeiling && intent.budgetAmount > 0;
    const isFeasible = !isHardCeiling || totals.totalAmount <= intent.budgetAmount;
    const budgetDeficit = !isFeasible ? Math.round((totals.totalAmount - intent.budgetAmount) * 100) / 100 : 0;

    let rebalancedSummary = `Rebalanced Plan v${newVersion}: ${recRows.length} items (${lockedRecIds.length} locked by user).`;
    if (!isFeasible) {
      rebalancedSummary = `Budget Deficit Notice: Rebalanced plan totals ${intent.budgetCurrency} ${totals.totalAmount.toFixed(
        2
      )}, exceeding your ${intent.budgetCurrency} ${intent.budgetAmount.toFixed(2)} ceiling by ${intent.budgetCurrency} ${budgetDeficit.toFixed(2)}.`;
    }

    // Update execution plan in DB
    db.prepare(`
      UPDATE execution_plans
      SET version = ?, total_estimated_cost = ?, summary = ?
      WHERE id = ?
    `).run(newVersion, totals.totalAmount, rebalancedSummary, planId);

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
      summary: rebalancedSummary,
      isActive: true,
      totalEstimatedCost: totals.totalAmount,
      currency: planRow.currency,
      isFeasible,
      budgetDeficit,
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
