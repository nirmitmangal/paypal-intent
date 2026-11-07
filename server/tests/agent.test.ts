import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { aiService } from '../src/services/ai.service';
import { intentParserService } from '../src/services/intentParser.service';
import { agentToolsService } from '../src/services/agentTools.service';
import { decisionEngineService } from '../src/services/decisionEngine.service';
import { agentPlanningService } from '../src/services/agentPlanning.service';
import { sessionRepository, intentRepository, requirementRepository } from '../src/db/repository';

describe('AI Agent & Intelligence Engine Tests', () => {
  const app = createApp();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. Local AI Infrastructure & Health
  // ==========================================================================
  describe('Ollama AI Infrastructure', () => {
    it('checks Ollama health and reports connection status and configured model', async () => {
      const health = await aiService.checkHealth();
      expect(health).toBeDefined();
      expect(['ready', 'degraded', 'offline']).toContain(health.status);
      expect(health.model).toBeDefined();
      expect(health.endpoint).toContain('11434');

      // Check HTTP endpoint
      const res = await request(app).get('/api/agent/health').expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.model).toBeDefined();
    });

    it('enforces truth in labeling: fallback is never falsely marked as AI generated', () => {
      const parsed = intentParserService.deterministicParseIntent('Ergonomic desk setup under $400');
      expect(parsed.isAiGenerated).toBe(false);
      expect(parsed.engine).toBe('deterministic-fallback');
      expect(parsed.model).toBe('deterministic-semantic-engine');
    });

    it('executes genuine local Ollama inference if Ollama is running', async () => {
      const health = await aiService.checkHealth();
      if (health.status === 'ready') {
        const parsed = await intentParserService.parseIntent('Dual monitor workstation under $600');
        expect(parsed.objective).toBeDefined();
        expect(parsed.budget.amount).toBe(600);
        expect(parsed.categories.length).toBeGreaterThan(0);
      }
    }, 35000);
  });

  // ==========================================================================
  // 2. Intent Understanding & Multi-Currency Interpretation
  // ==========================================================================
  describe('Intent Understanding', () => {
    it('interprets workstation prompt with INR currency, programming & design objectives', () => {
      const prompt =
        'I want a complete home workstation under ₹50,000. I need it mainly for programming and occasional graphic design.';
      const parsed = intentParserService.deterministicParseIntent(prompt);

      expect(parsed.objective.toLowerCase()).toContain('workstation');
      expect(parsed.budget.amount).toBe(50000);
      expect(parsed.budget.currency).toBe('INR');
      expect(parsed.budget.isHardCeiling).toBe(true);

      expect(parsed.preferences.primaryUse).toBe('Programming');
      expect(parsed.preferences.secondaryUse).toBe('Occasional graphic design');

      const categoryIds = parsed.categories.map((c) => c.categoryId);
      expect(categoryIds).toContain('monitors');
      expect(categoryIds).toContain('keyboards');
      expect(categoryIds).toContain('mice');

      // Verify category budget shares sum close to 1.0
      const totalShare = parsed.categories.reduce((acc, c) => acc + c.estimatedBudgetShare, 0);
      expect(totalShare).toBeGreaterThanOrEqual(0.9);
      expect(totalShare).toBeLessThanOrEqual(1.1);
    });

    it('interprets podcast studio setup with USD and k notation', () => {
      const prompt = 'Build a professional podcast recording setup under $1.5k';
      const parsed = intentParserService.deterministicParseIntent(prompt);

      expect(parsed.budget.amount).toBe(1500);
      expect(parsed.budget.currency).toBe('USD');
      expect(parsed.objective.toLowerCase()).toContain('recording');

      const categoryIds = parsed.categories.map((c) => c.categoryId);
      expect(categoryIds).toContain('headphones');
      expect(categoryIds).toContain('accessories'); // mic
    });

    it('interprets Euro currency and detects wireless constraint', () => {
      const prompt = 'Clean minimal setup under €450, wireless only';
      const parsed = intentParserService.deterministicParseIntent(prompt);

      expect(parsed.budget.amount).toBe(450);
      expect(parsed.budget.currency).toBe('EUR');
      expect(parsed.preferences.connectivity).toBe('wireless');
      expect(parsed.restrictions.some((r) => r.toLowerCase().includes('wireless'))).toBe(true);
    });

    it('identifies missing information and generates clarifying questions', () => {
      const prompt = 'I need some tech gadgets for work';
      const parsed = intentParserService.deterministicParseIntent(prompt);

      expect(parsed.clarifyingQuestions.length).toBeGreaterThan(0);
      expect(parsed.clarifyingQuestions.some((q) => q.toLowerCase().includes('budget'))).toBe(true);
    });
  });

  // ==========================================================================
  // 3. Agent Session Memory & Refinements
  // ==========================================================================
  describe('Agent Session Memory & Goal Refinement', () => {
    it('persists parsed intent and decomposed requirements into database memory', async () => {
      vi.spyOn(aiService, 'generateStructured').mockResolvedValueOnce(null);

      const session = sessionRepository.getOrCreate();
      const res = await request(app)
        .post('/api/intents')
        .set('x-session-token', session.sessionToken)
        .send({
          prompt: 'Ergonomic software development desk under $600',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      const { intentSession, requirements, parsedIntent } = res.body.data;

      expect(intentSession.id).toBeDefined();
      expect(intentSession.budgetAmount).toBe(600);
      expect(requirements.length).toBeGreaterThan(0);
      expect(parsedIntent.preferences.primaryUse).toBe('Programming');

      // Verify persisted in SQLite
      const checkReqs = requirementRepository.getByIntentId(intentSession.id);
      expect(checkReqs.length).toBe(requirements.length);
    });

    it('refines existing intent session without resetting memory', async () => {
      vi.spyOn(aiService, 'generateStructured').mockResolvedValueOnce(null);

      const session = sessionRepository.getOrCreate();
      const createRes = await request(app)
        .post('/api/intents')
        .set('x-session-token', session.sessionToken)
        .send({ prompt: 'Workstation under $500' });

      const intentId = createRes.body.data.intentSession.id;

      // Refine intent
      const refineRes = await request(app)
        .post(`/api/intents/${intentId}/refine`)
        .set('x-session-token', session.sessionToken)
        .send({
          refinementText: 'Make keyboard wireless and reduce budget to $420',
        })
        .expect(200);

      expect(refineRes.body.success).toBe(true);
      expect(refineRes.body.data.intentSession.budgetAmount).toBe(420);
      expect(refineRes.body.data.intentSession.id).toBe(intentId); // Preserves ID
    });
  });

  // ==========================================================================
  // 4. Controlled Agent Tools
  // ==========================================================================
  describe('Controlled Agent Tools', () => {
    it('executes search_products tool with category and price filters', () => {
      const result = agentToolsService.executeTool('search_products', {
        categoryId: 'keyboards',
        maxPrice: 150,
      });

      expect(result.success).toBe(true);
      expect(result.result.count).toBeGreaterThan(0);
      expect(result.result.products.every((p: any) => p.categoryId === 'keyboards')).toBe(true);
      expect(result.result.products.every((p: any) => p.basePrice <= 150)).toBe(true);
    });

    it('executes get_product_details tool for specific catalog item', () => {
      const result = agentToolsService.executeTool('get_product_details', {
        productId: 'prod_mon_01',
      });

      expect(result.success).toBe(true);
      expect(result.result.sku).toBe('MON-VC-27-4K');
      expect(result.result.title).toContain('ViewCraft');
      expect(result.result.attributes.length).toBeGreaterThan(0);
    });

    it('executes compare_products tool for multiple products', () => {
      const result = agentToolsService.executeTool('compare_products', {
        productIds: ['prod_mon_01', 'prod_mon_02'],
      });

      expect(result.success).toBe(true);
      expect(result.result.products.length).toBe(2);
      expect(result.result.metrics.lowestPrice).toBeLessThanOrEqual(result.result.metrics.highestPrice);
    });

    it('executes calculate_budget tool with authoritative database prices and safe minor units', () => {
      const result = agentToolsService.executeTool('calculate_budget', {
        items: [
          { productId: 'prod_mon_01', quantity: 1 }, // 379.99
          { productId: 'prod_kb_01', quantity: 1 },  // 139.99
        ],
        taxRate: 0.08,
      });

      expect(result.success).toBe(true);
      expect(result.result.subtotal).toBe(519.98); // 379.99 + 139.99
      expect(result.result.taxAmount).toBe(41.60);
      expect(result.result.totalAmount).toBe(561.58);
    });

    it('executes evaluate_compatibility tool detecting USB-C and VESA synergies', () => {
      const result = agentToolsService.executeTool('evaluate_compatibility', {
        productIds: ['prod_mon_01', 'prod_lap_01', 'prod_acc_03'],
      });

      expect(result.success).toBe(true);
      expect(result.result.isCompatible).toBe(true);
      expect(result.result.verifiedMatches.some((m: string) => m.includes('USB-C'))).toBe(true);
      expect(result.result.verifiedMatches.some((m: string) => m.includes('VESA'))).toBe(true);
    });

    it('rejects unauthorized tools and invalid parameters safely via Zod', () => {
      // Unregistered tool
      const badTool = agentToolsService.executeTool('unauthorized_payment_tool' as any, {});
      expect(badTool.success).toBe(false);
      expect(badTool.error).toContain('not authorized');

      // Invalid parameter schema
      const badParams = agentToolsService.executeTool('calculate_budget', { items: [] });
      expect(badParams.success).toBe(false);
      expect(badParams.error).toContain('At least one item');
    });
  });

  // ==========================================================================
  // 5. Decision Engine & Multi-Tier Optimization
  // ==========================================================================
  describe('Decision Engine & Multi-Tier Optimization', () => {
    it('scores catalog items across budget, performance, compatibility and value criteria', () => {
      const product = agentToolsService.getProductDetails({ productId: 'prod_mon_01' });
      const context = {
        objective: 'Developer Setup',
        budgetAmount: 600,
        budgetCurrency: 'USD',
        primaryUse: 'Programming',
        secondaryUse: 'Graphic design',
      };

      const score = decisionEngineService.scoreProduct(product as any, 0.5, context, 'balanced');

      expect(score.compositeScore).toBeGreaterThan(0);
      expect(score.compositeScore).toBeLessThanOrEqual(1.0);
      expect(score.performanceScore).toBeGreaterThanOrEqual(0.8);
      expect(score.selectionReason).toContain('IPS panel');
    });

    it('generates 3 distinct tier bundles (budget, balanced, performance)', () => {
      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'Programmer desk setup under $700',
        budgetAmount: 700,
      });

      const reqs = requirementRepository.bulkCreate(intent.id, [
        { categoryId: 'monitors', categoryName: 'Display', priority: 'essential', estimatedBudgetShare: 0.5 },
        { categoryId: 'keyboards', categoryName: 'Keyboard', priority: 'essential', estimatedBudgetShare: 0.3 },
        { categoryId: 'mice', categoryName: 'Mouse', priority: 'recommended', estimatedBudgetShare: 0.2 },
      ]);

      const tiered = decisionEngineService.evaluateCategoryCandidates(reqs, {
        objective: 'Programmer desk setup',
        budgetAmount: 700,
        budgetCurrency: 'USD',
        primaryUse: 'Programming',
      });

      expect(tiered.budget.length).toBe(3);
      expect(tiered.balanced.length).toBe(3);
      expect(tiered.performance.length).toBe(3);

      const budgetCost = tiered.budget.reduce((acc, i) => acc + i.product.basePrice, 0);
      const perfCost = tiered.performance.reduce((acc, i) => acc + i.product.basePrice, 0);

      // Budget tier must cost less than or equal to performance tier
      expect(budgetCost).toBeLessThanOrEqual(perfCost);
    });
  });

  // ==========================================================================
  // 6. Agent Planning Engine & Rebalancing
  // ==========================================================================
  describe('Agent Planning & Knapsack Ceiling Enforcement', () => {
    it('creates an execution plan that respects the hard budget ceiling', async () => {
      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'Developer setup under $550',
        budgetAmount: 550,
        isHardCeiling: true,
      });

      requirementRepository.bulkCreate(intent.id, [
        { categoryId: 'monitors', categoryName: 'Display', priority: 'essential', estimatedBudgetShare: 0.5 },
        { categoryId: 'keyboards', categoryName: 'Keyboard', priority: 'essential', estimatedBudgetShare: 0.3 },
        { categoryId: 'mice', categoryName: 'Mouse', priority: 'recommended', estimatedBudgetShare: 0.2 },
      ]);

      const plan = await agentPlanningService.createPlanForIntent(intent.id, 'balanced');

      expect(plan.id).toBeDefined();
      expect(plan.items.length).toBe(3);
      expect(plan.totalEstimatedCost).toBeLessThanOrEqual(550); // Hard ceiling obeyed

      // Every recommendation item must have explainability rationales
      for (const item of plan.items) {
        expect(item.selectionReason).toBeDefined();
        expect(item.selectionReason.length).toBeGreaterThan(10);
      }
    });

    it('rebalances an execution plan while preserving locked items', async () => {
      const session = sessionRepository.getOrCreate();
      const intent = intentRepository.create({
        sessionId: session.id,
        rawPrompt: 'Workstation under $600',
        budgetAmount: 600,
      });

      requirementRepository.bulkCreate(intent.id, [
        { categoryId: 'monitors', categoryName: 'Display', priority: 'essential', estimatedBudgetShare: 0.5 },
        { categoryId: 'keyboards', categoryName: 'Keyboard', priority: 'essential', estimatedBudgetShare: 0.3 },
      ]);

      const plan = await agentPlanningService.createPlanForIntent(intent.id, 'balanced');
      const monitorRec = plan.items.find((i) => i.categoryId === 'monitors')!;

      // Lock the monitor and swap keyboard
      const rebalanced = await agentPlanningService.rebalancePlan(
        plan.id,
        [monitorRec.id],
        [{ recommendationId: plan.items.find((i) => i.categoryId === 'keyboards')!.id, newProductId: 'prod_kb_03' }]
      );

      expect(rebalanced.version).toBe(2);
      const rebalancedMonitor = rebalanced.items.find((i) => i.id === monitorRec.id);
      expect(rebalancedMonitor?.isLocked).toBe(true);
      expect(rebalancedMonitor?.productId).toBe(monitorRec.productId);

      const rebalancedKeyboard = rebalanced.items.find((i) => i.categoryId === 'keyboards');
      expect(rebalancedKeyboard?.productId).toBe('prod_kb_03');
    });
  });

  // ==========================================================================
  // 7. Safety Boundaries
  // ==========================================================================
  describe('Safety Boundaries', () => {
    it('agent tools cannot trigger payment execution or access credentials', () => {
      const forbiddenTools = [
        'capture_payment',
        'authorize_payment',
        'paypal_execute',
        'get_paypal_secret',
      ];

      for (const tool of forbiddenTools) {
        const res = agentToolsService.executeTool(tool as any, {});
        expect(res.success).toBe(false);
        expect(res.error).toContain('not authorized');
      }
    });
  });
});
