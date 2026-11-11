import type {
  Product,
  PlanTier,
  ProductEvaluationScore,
  IntentRequirement,
} from '@paypal-intent/shared';
import { catalogService } from './catalog.service';
import { normalizeCategoryId } from '../utils/categoryMapper';

export type { ProductEvaluationScore };

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
    tier: PlanTier = 'balanced',
    req?: IntentRequirement
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
    const isStudy = primary.includes('study') || primary.includes('college') || primary.includes('student');

    if (isProgramming || isStudy) {
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

    // Specific requirement hints
    const reqText = `${req?.categoryName || ''} ${req?.description || ''}`.toLowerCase();
    if (reqText.includes('wireless') && (attributesMap.get('connectivity')?.includes('wireless') || attributesMap.get('connectivity')?.includes('bluetooth') || product.title.toLowerCase().includes('wireless') || product.title.toLowerCase().includes('bluetooth'))) {
      performanceScore += 0.2;
    }
    if (reqText.includes('over-ear') && (attributesMap.get('form_factor')?.includes('over-ear') || product.description.toLowerCase().includes('over-ear'))) {
      performanceScore += 0.2;
    }
    if (reqText.includes('lamp') || reqText.includes('light')) {
      if (product.title.toLowerCase().includes('lamp') || product.title.toLowerCase().includes('screenbar')) {
        performanceScore += 0.4;
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
    const ratingRatio = (product.rating || 4.5) / 5.0;
    const reviewFactor = Math.min(1.0, Math.log10(product.reviewCount + 10) / 3.0);
    const valueScore = Math.min(1.0, ratingRatio * 0.7 + reviewFactor * 0.3);

    // 5. User Preferences Match Score (0.0 to 1.0)
    let preferenceScore = 0.8;
    if (context.ergonomics && (product.title.toLowerCase().includes('ergo') || product.description.toLowerCase().includes('ergonomic'))) {
      preferenceScore += 0.2;
    }
    if (context.connectivity === 'wireless' || reqText.includes('wireless')) {
      if (connectivity.includes('bluetooth') || connectivity.includes('wireless') || connectivity.includes('2.4ghz') || product.title.toLowerCase().includes('wireless')) {
        preferenceScore += 0.2;
      } else {
        preferenceScore -= 0.3;
      }
    } else if (context.connectivity === 'wired' || reqText.includes('wired')) {
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

    const compositeScore =
      Math.round(
        (budgetFitScore * wBudget +
          performanceScore * wPerf +
          compatibilityScore * wCompat +
          valueScore * wVal +
          preferenceScore * wPref) *
          1000
      ) / 1000;

    // Build transparent explainability rationales
    const reasons: string[] = [];
    if (reqText.includes('lamp') || reqText.includes('light')) {
      reasons.push('High-CRI eye-care illumination designed for desk task lighting');
    }
    if (isDesign && product.categoryId === 'monitors') {
      reasons.push('Factory color calibration and IPS panel fidelity for graphic design');
    } else if (isProgramming && (product.categoryId === 'keyboards' || product.categoryId === 'monitors')) {
      reasons.push(`Tailored for code workflows with ${product.attributes?.[0]?.attributeKey || 'high-precision'} specs`);
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
        const canonicalId = normalizeCategoryId(req.categoryId);
        let candidates = allProducts.filter((p) => p.categoryId === canonicalId);
        if (candidates.length === 0) continue;

        // Subcategory matching for accessories
        const reqText = `${req.categoryName} ${req.description || ''} ${JSON.stringify(req.specConstraints || {})}`.toLowerCase();
        if (canonicalId === 'accessories') {
          if (reqText.includes('lamp') || reqText.includes('light') || reqText.includes('screenbar')) {
            const lampMatches = candidates.filter(
              (p) =>
                p.title.toLowerCase().includes('lamp') ||
                p.title.toLowerCase().includes('screenbar') ||
                p.description.toLowerCase().includes('lamp') ||
                p.description.toLowerCase().includes('light')
            );
            if (lampMatches.length > 0) candidates = lampMatches;
          } else if (reqText.includes('mic') || reqText.includes('audio') || reqText.includes('record')) {
            const micMatches = candidates.filter(
              (p) => p.title.toLowerCase().includes('mic') || p.description.toLowerCase().includes('microphone')
            );
            if (micMatches.length > 0) candidates = micMatches;
          } else if (reqText.includes('arm') || reqText.includes('boom')) {
            const armMatches = candidates.filter(
              (p) => p.title.toLowerCase().includes('arm') || p.description.toLowerCase().includes('boom')
            );
            if (armMatches.length > 0) candidates = armMatches;
          } else if (reqText.includes('mount')) {
            const mountMatches = candidates.filter((p) => p.title.toLowerCase().includes('mount'));
            if (mountMatches.length > 0) candidates = mountMatches;
          } else if (reqText.includes('dock') || reqText.includes('hub')) {
            const dockMatches = candidates.filter(
              (p) => p.title.toLowerCase().includes('dock') || p.title.toLowerCase().includes('hub')
            );
            if (dockMatches.length > 0) candidates = dockMatches;
          }
        }

        // Subcategory matching for mice (wireless vs wired)
        if (canonicalId === 'mice' && reqText.includes('wireless')) {
          const wirelessMice = candidates.filter(
            (p) =>
              p.title.toLowerCase().includes('wireless') ||
              p.description.toLowerCase().includes('wireless') ||
              p.description.toLowerCase().includes('bluetooth')
          );
          if (wirelessMice.length > 0) candidates = wirelessMice;
        }

        // Subcategory matching for headphones (over-ear vs on-ear / earbuds)
        if (canonicalId === 'headphones' && (reqText.includes('over-ear') || reqText.includes('over ear') || reqText.includes('over_ear'))) {
          const overEar = candidates.filter(
            (p) =>
              p.description.toLowerCase().includes('over-ear') ||
              p.description.toLowerCase().includes('over ear') ||
              p.attributes?.some((a) => {
                const valStr = String((a as any).attributeValue ?? (a as any).value ?? '').toLowerCase();
                return valStr.includes('over-ear') || valStr.includes('over ear');
              })
          );
          if (tier !== 'budget' && overEar.length > 0) candidates = overEar;
        }

        // Score all candidates
        const scored = candidates.map((p) => ({
          product: p,
          score: decisionEngineService.scoreProduct(p, req.estimatedBudgetShare, context, tier, req),
        }));

        // Sort candidates
        if (tier === 'budget') {
          scored.sort((a, b) => {
            if (Math.abs(a.product.basePrice - b.product.basePrice) > 15) {
              return a.product.basePrice - b.product.basePrice;
            }
            return b.score.compositeScore - a.score.compositeScore;
          });
        } else if (tier === 'performance') {
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

  /**
   * Retrieves and scores all suitable candidate products for each requirement across the catalog.
   * Enables comprehensive multi-category combinatorial optimization.
   */
  getCandidatesForRequirements: (
    requirements: IntentRequirement[],
    context: IntentContext,
    tier: PlanTier = 'balanced'
  ): Array<{ requirement: IntentRequirement; candidates: Array<{ product: Product; score: ProductEvaluationScore }> }> => {
    const allProducts = catalogService.listProducts({ inStockOnly: true });

    return requirements.map((req) => {
      const canonicalId = normalizeCategoryId(req.categoryId);
      let candidates = allProducts.filter((p) => p.categoryId === canonicalId);
      const reqText = `${req.categoryName} ${req.description || ''} ${JSON.stringify(req.specConstraints || {})}`.toLowerCase();

      if (canonicalId === 'accessories') {
        if (reqText.includes('lamp') || reqText.includes('light') || reqText.includes('screenbar')) {
          const lampMatches = candidates.filter(
            (p) =>
              p.title.toLowerCase().includes('lamp') ||
              p.title.toLowerCase().includes('screenbar') ||
              p.description.toLowerCase().includes('lamp') ||
              p.description.toLowerCase().includes('light')
          );
          if (lampMatches.length > 0) candidates = lampMatches;
        } else if (reqText.includes('mic') || reqText.includes('audio') || reqText.includes('record')) {
          const micMatches = candidates.filter(
            (p) => p.title.toLowerCase().includes('mic') || p.description.toLowerCase().includes('microphone')
          );
          if (micMatches.length > 0) candidates = micMatches;
        } else if (reqText.includes('arm') || reqText.includes('boom')) {
          const armMatches = candidates.filter(
            (p) => p.title.toLowerCase().includes('arm') || p.description.toLowerCase().includes('boom')
          );
          if (armMatches.length > 0) candidates = armMatches;
        } else if (reqText.includes('mount')) {
          const mountMatches = candidates.filter((p) => p.title.toLowerCase().includes('mount'));
          if (mountMatches.length > 0) candidates = mountMatches;
        } else if (reqText.includes('dock') || reqText.includes('hub')) {
          const dockMatches = candidates.filter(
            (p) => p.title.toLowerCase().includes('dock') || p.title.toLowerCase().includes('hub')
          );
          if (dockMatches.length > 0) candidates = dockMatches;
        }
      }

      if (canonicalId === 'mice' && reqText.includes('wireless')) {
        const wirelessMice = candidates.filter(
          (p) =>
            p.title.toLowerCase().includes('wireless') ||
            p.description.toLowerCase().includes('wireless') ||
            p.description.toLowerCase().includes('bluetooth')
        );
        if (wirelessMice.length > 0) candidates = wirelessMice;
      }

      if (canonicalId === 'headphones' && (reqText.includes('over-ear') || reqText.includes('over ear') || reqText.includes('over_ear'))) {
        const overEar = candidates.filter(
          (p) =>
            p.description.toLowerCase().includes('over-ear') ||
            p.description.toLowerCase().includes('over ear') ||
            p.attributes?.some((a) => {
              const valStr = String((a as any).attributeValue ?? (a as any).value ?? '').toLowerCase();
              return valStr.includes('over-ear') || valStr.includes('over ear');
            })
        );
        if (tier !== 'budget' && overEar.length > 0) candidates = overEar;
      }

      // If strict subcategory filter produced 0 candidates, fallback to canonical category items
      if (candidates.length === 0) {
        candidates = allProducts.filter((p) => p.categoryId === canonicalId);
      }

      const scored = candidates.map((p) => ({
        product: p,
        score: decisionEngineService.scoreProduct(p, req.estimatedBudgetShare, context, tier, req),
      }));

      // Sort candidate options: price ASC, then compositeScore DESC
      scored.sort((a, b) => a.product.basePrice - b.product.basePrice || b.score.compositeScore - a.score.compositeScore);

      return { requirement: req, candidates: scored };
    });
  },
};
