import type {
  Product,
  PlanTier,
  ProductEvaluationScore,
  IntentRequirement,
} from '@paypal-intent/shared';
import { catalogService } from './catalog.service';

export interface IntentContext {
  objective: string;
  budgetAmount: number;
  budgetCurrency: string;
  primaryUse?: string;
  secondaryUse?: string;
  ergonomics?: boolean;
  connectivity?: 'wired' | 'wireless' | 'any';
  brandPreference?: string;
  restrictions?: string[];
}

export const decisionEngineService = {
  /**
   * Evaluates and scores an individual catalog product against user intention constraints.
   * All evaluations reference real catalog attributes. Never invents specifications.
   */
  scoreProduct: (
    product: Product,
    categoryShare: number,
    context: IntentContext,
    tier: PlanTier = 'balanced'
  ): ProductEvaluationScore => {
    const targetBudget = Math.max(30, context.budgetAmount * (categoryShare || 0.25));

    // 1. Budget Fit Score (0.0 to 1.0)
    let budgetFitScore = 1.0;
    if (product.basePrice <= targetBudget) {
      // Reward staying nicely within share without being excessively under-spec'd
      const savingsRatio = (targetBudget - product.basePrice) / targetBudget;
      budgetFitScore = Math.max(0.7, 1.0 - savingsRatio * 0.3);
    } else {
      // Penalize exceeding target share
      const overrunRatio = (product.basePrice - targetBudget) / targetBudget;
      budgetFitScore = Math.max(0.05, 1.0 - overrunRatio * 1.5);
    }

    // 2. Performance & Suitability Score (0.0 to 1.0)
    let performanceScore = 0.7; // baseline
    const attributesMap = new Map<string, string>();
    product.attributes?.forEach((a) => attributesMap.set(a.attributeKey.toLowerCase(), a.attributeValue.toLowerCase()));

    const primary = (context.primaryUse || '').toLowerCase();
    const secondary = (context.secondaryUse || '').toLowerCase();
    const isProgramming = primary.includes('prog') || primary.includes('code') || primary.includes('dev') || secondary.includes('prog');
    const isDesign = primary.includes('design') || primary.includes('graphic') || secondary.includes('design') || secondary.includes('graphic');
    const isAudio = primary.includes('audio') || primary.includes('podcast') || primary.includes('stream') || secondary.includes('audio');

    if (isProgramming) {
      if (product.categoryId === 'monitors') {
        const res = attributesMap.get('resolution') || '';
        if (res.includes('4k') || res.includes('3840') || res.includes('3440')) performanceScore += 0.25;
      }
      if (product.categoryId === 'keyboards') {
        const switches = attributesMap.get('switch_type') || '';
        if (switches.includes('mechanical') || switches.includes('tactile')) performanceScore += 0.25;
      }
      if (product.categoryId === 'laptops') {
        const ram = attributesMap.get('ram') || '';
        if (ram.includes('16gb') || ram.includes('32gb')) performanceScore += 0.25;
      }
    }

    if (isDesign) {
      if (product.categoryId === 'monitors') {
        const panel = attributesMap.get('panel_type') || '';
        if (panel.includes('ips') || panel.includes('factory-calibrated')) performanceScore += 0.25;
      }
      if (product.categoryId === 'mice') {
        const sensor = attributesMap.get('sensor_dpi') || '';
        if (sensor.includes('8000') || sensor.includes('precision') || sensor.includes('darkfield')) performanceScore += 0.2;
      }
    }

    if (isAudio) {
      if (product.categoryId === 'headphones') {
        const type = attributesMap.get('type') || '';
        if (type.includes('studio') || type.includes('monitor') || type.includes('planar')) performanceScore += 0.25;
      }
      if (product.categoryId === 'accessories' && product.title.toLowerCase().includes('mic')) {
        performanceScore += 0.3;
      }
    }

    performanceScore = Math.min(1.0, performanceScore);

    // 3. Feature Compatibility Score (0.0 to 1.0)
    let compatibilityScore = 0.85;
    const connectivity = attributesMap.get('connectivity') || '';
    if (connectivity.includes('usb-c') || connectivity.includes('90w')) compatibilityScore += 0.15;
    if (attributesMap.get('vesa_compatible') === 'true') compatibilityScore += 0.1;
    compatibilityScore = Math.min(1.0, compatibilityScore);

    // 4. Value for Money Score (0.0 to 1.0)
    // Balance rating and reviews against price
    const ratingRatio = (product.rating || 4.5) / 5.0;
    const reviewFactor = Math.min(1.0, Math.log10(product.reviewCount + 10) / 3.0);
    const valueScore = Math.min(1.0, (ratingRatio * 0.7 + reviewFactor * 0.3));

    // 5. User Preferences Match Score (0.0 to 1.0)
    let preferenceScore = 0.8;
    if (context.ergonomics && (product.title.toLowerCase().includes('ergo') || product.description.toLowerCase().includes('ergonomic'))) {
      preferenceScore += 0.2;
    }
    if (context.connectivity === 'wireless') {
      if (connectivity.includes('bluetooth') || connectivity.includes('wireless') || connectivity.includes('2.4ghz')) {
        preferenceScore += 0.2;
      } else {
        preferenceScore -= 0.3;
      }
    } else if (context.connectivity === 'wired') {
      if (connectivity.includes('wired') || connectivity.includes('usb-c')) {
        preferenceScore += 0.1;
      }
    }

    if (context.brandPreference && product.brand.toLowerCase() === context.brandPreference.toLowerCase()) {
      preferenceScore += 0.2;
    }
    preferenceScore = Math.min(1.0, Math.max(0.1, preferenceScore));

    // Weights per tier
    let wBudget = 0.25;
    let wPerf = 0.25;
    let wCompat = 0.20;
    let wVal = 0.15;
    let wPref = 0.15;

    if (tier === 'budget') {
      wBudget = 0.45;
      wVal = 0.25;
      wPerf = 0.15;
      wCompat = 0.08;
      wPref = 0.07;
    } else if (tier === 'performance') {
      wPerf = 0.40;
      wCompat = 0.20;
      wPref = 0.20;
      wVal = 0.10;
      wBudget = 0.10;
    }

    const compositeScore = Math.round(
      (budgetFitScore * wBudget +
        performanceScore * wPerf +
        compatibilityScore * wCompat +
        valueScore * wVal +
        preferenceScore * wPref) *
        1000
    ) / 1000;

    // Build transparent explainability rationales
    const reasons: string[] = [];
    if (isProgramming && (product.categoryId === 'keyboards' || product.categoryId === 'monitors')) {
      reasons.push(`Tailored for code workflows with ${product.attributes?.[0]?.attributeKey || 'high-precision'} specs`);
    }
    if (isDesign && product.categoryId === 'monitors') {
      reasons.push('Factory color calibration and IPS panel fidelity for graphic design');
    }
    if (budgetFitScore > 0.85) {
      reasons.push(`Direct fit within category allocation (~$${targetBudget.toFixed(0)})`);
    }
    if (reasons.length === 0) {
      reasons.push(`Highest scoring ${tier} candidate in ${product.categoryId} category with ${product.rating}★ rating`);
    }

    const selectionReason = reasons.join('. ') + '.';

    let tradeOffNotes: string | undefined;
    if (tier === 'budget') {
      tradeOffNotes = `Cost-optimized selection. Prioritizes durability and core functionality under $${targetBudget.toFixed(0)} limit.`;
    } else if (tier === 'performance' && product.basePrice > targetBudget) {
      tradeOffNotes = `Allocated a larger share of the overall budget to maximize performance specifications.`;
    }

    return {
      productId: product.id,
      categoryId: product.categoryId,
      budgetFitScore: Math.round(budgetFitScore * 100) / 100,
      performanceScore: Math.round(performanceScore * 100) / 100,
      compatibilityScore: Math.round(compatibilityScore * 100) / 100,
      valueScore: Math.round(valueScore * 100) / 100,
      preferenceScore: Math.round(preferenceScore * 100) / 100,
      compositeScore,
      selectionReason,
      tradeOffNotes,
    };
  },

  /**
   * Evaluates all candidates across required categories to assemble 3 distinct tiered combinations.
   */
  evaluateCategoryCandidates: (
    requirements: IntentRequirement[],
    context: IntentContext
  ): Record<PlanTier, Array<{ product: Product; score: ProductEvaluationScore }>> => {
    const allProducts = catalogService.listProducts({ inStockOnly: true });

    const tiers: PlanTier[] = ['budget', 'balanced', 'performance'];
    const result: Record<PlanTier, Array<{ product: Product; score: ProductEvaluationScore }>> = {
      budget: [],
      balanced: [],
      performance: [],
    };

    for (const tier of tiers) {
      for (const req of requirements) {
        const candidates = allProducts.filter((p) => p.categoryId === req.categoryId);
        if (candidates.length === 0) continue;

        // Score all candidates
        const scored = candidates.map((p) => ({
          product: p,
          score: decisionEngineService.scoreProduct(p, req.estimatedBudgetShare, context, tier),
        }));

        // Sort candidates
        if (tier === 'budget') {
          // Prioritize lowest price among reasonable scorers
          scored.sort((a, b) => {
            if (Math.abs(a.product.basePrice - b.product.basePrice) > 20) {
              return a.product.basePrice - b.product.basePrice;
            }
            return b.score.compositeScore - a.score.compositeScore;
          });
        } else if (tier === 'performance') {
          // Prioritize performance specifications
          scored.sort((a, b) => {
            if (b.score.performanceScore !== a.score.performanceScore) {
              return b.score.performanceScore - a.score.performanceScore;
            }
            return b.product.basePrice - a.product.basePrice;
          });
        } else {
          // Balanced: Best composite score
          scored.sort((a, b) => b.score.compositeScore - a.score.compositeScore);
        }

        const chosen = scored[0];
        if (chosen) {
          result[tier].push(chosen);
        }
      }
    }

    return result;
  },
};
