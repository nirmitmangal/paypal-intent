import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from './ai.service';
import { intentRepository, requirementRepository } from '../db/repository';
import { logger } from '../utils/logger';
import type {
  ParsedIntent,
  ParsedCategoryRequirement,
  PlanTier,
  IntentSession,
  IntentRequirement,
} from '@paypal-intent/shared';

// ============================================================================
// Zod Validation Schema for Structured Intent Parsing
// ============================================================================

const parsedCategorySchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  priority: z.enum(['essential', 'recommended', 'optional']),
  estimatedBudgetShare: z.number().min(0.0).max(1.0),
  specConstraints: z.record(z.string(), z.unknown()).optional().default({}),
  rationale: z.string(),
});

const parsedIntentSchema = z.object({
  objective: z.string(),
  budget: z.object({
    amount: z.number().min(0),
    currency: z.string().default('USD'),
    isHardCeiling: z.boolean().default(true),
  }),
  categories: z.array(parsedCategorySchema).min(1),
  preferences: z.object({
    primaryUse: z.string().nullable().optional(),
    secondaryUse: z.string().nullable().optional(),
    ergonomics: z.boolean().nullable().optional(),
    aestheticStyle: z.string().nullable().optional(),
    brandPreference: z.string().nullable().optional(),
    portability: z.boolean().nullable().optional(),
    connectivity: z.enum(['wired', 'wireless', 'any']).nullable().optional(),
    other: z.array(z.string()).nullable().optional(),
  }),
  restrictions: z.array(z.string()).default([]),
  qualityTier: z.enum(['budget', 'balanced', 'performance']).default('balanced'),
  compatibilityRequirements: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  clarifyingQuestions: z.array(z.string()).default([]),
});

export const intentParserService = {
  /**
   * Deterministic semantic parser with multi-currency parsing and category decomposition.
   * Acts as high-accuracy fallback when Ollama is offline or times out.
   */
  deterministicParseIntent: (prompt: string): ParsedIntent => {
    const text = prompt.trim();
    const lower = text.toLowerCase();

    // 1. Multi-Currency & Budget Extraction
    let amount = 350.0;
    let currency = 'USD';
    let isHardCeiling = true;

    // Detect INR (₹, INR, rupees)
    const inrMatch = text.match(/(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(?:k)?/i) || text.match(/([\d,]+)\s*(?:INR|rupees)/i);
    const usdMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(?:k)?/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:USD|dollars)/i);
    const eurMatch = text.match(/€\s*([\d,]+(?:\.\d+)?)/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:EUR|euros)/i);
    const gbpMatch = text.match(/£\s*([\d,]+(?:\.\d+)?)/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:GBP|pounds)/i);

    if (inrMatch) {
      currency = 'INR';
      amount = parseFloat(inrMatch[1].replace(/,/g, ''));
      if (inrMatch[0].toLowerCase().includes('k')) amount *= 1000;
    } else if (eurMatch) {
      currency = 'EUR';
      amount = parseFloat(eurMatch[1].replace(/,/g, ''));
    } else if (gbpMatch) {
      currency = 'GBP';
      amount = parseFloat(gbpMatch[1].replace(/,/g, ''));
    } else if (usdMatch) {
      currency = 'USD';
      amount = parseFloat(usdMatch[1].replace(/,/g, ''));
      if (usdMatch[0].toLowerCase().includes('k')) amount *= 1000;
    } else {
      // Standalone number check (e.g. "under 500")
      const numMatch = text.match(/(?:under|below|budget|max|around)\s*([\d,]+)/i);
      if (numMatch) {
        amount = parseFloat(numMatch[1].replace(/,/g, ''));
      }
    }

    if (lower.includes('around') || lower.includes('approx') || lower.includes('flexible')) {
      isHardCeiling = false;
    }

    // 2. Primary & Secondary Use Extraction
    let primaryUse = 'General Productivity';
    let secondaryUse: string | undefined;

    if (lower.includes('program') || lower.includes('coding') || lower.includes('developer') || lower.includes('software')) {
      primaryUse = 'Programming';
    } else if (lower.includes('podcast') || lower.includes('audio') || lower.includes('stream') || lower.includes('record')) {
      primaryUse = 'Audio & Podcasting';
    } else if (lower.includes('design') || lower.includes('graphic')) {
      primaryUse = 'Graphic design';
    } else if (lower.includes('game') || lower.includes('gaming')) {
      primaryUse = 'Gaming';
    }

    if (lower.includes('design') || lower.includes('graphic')) {
      if (primaryUse !== 'Graphic design') {
        secondaryUse = 'Occasional graphic design';
      }
    }
    if (lower.includes('gaming') && primaryUse !== 'Gaming') {
      secondaryUse = 'Casual gaming';
    }

    // 3. Ergonomics & Connectivity
    const ergonomics = lower.includes('ergo') || lower.includes('posture') || lower.includes('back') || lower.includes('wrist');
    let connectivity: 'wired' | 'wireless' | 'any' = 'any';
    if (lower.includes('wireless') || lower.includes('bluetooth') || lower.includes('clean desk')) {
      connectivity = 'wireless';
    } else if (lower.includes('wired') || lower.includes('low latency')) {
      connectivity = 'wired';
    }

    // 4. Primary Objective
    let objective = 'Home workstation';
    if (lower.includes('podcast') || lower.includes('audio') || lower.includes('record')) {
      objective = 'Podcasting & recording studio setup';
    } else if (lower.includes('laptop') || lower.includes('ultrabook')) {
      objective = 'Mobile developer workstation';
    } else if (lower.includes('monitor') && !lower.includes('keyboard')) {
      objective = 'Display upgrade setup';
    } else if (lower.includes('keyboard') && !lower.includes('monitor')) {
      objective = 'Mechanical typing setup';
    }

    // 5. Category Decomposition
    const categories: ParsedCategoryRequirement[] = [];

    if (objective.includes('recording') || objective.includes('podcast')) {
      categories.push({
        categoryId: 'headphones',
        categoryName: 'Studio Monitor Headphones',
        priority: 'essential',
        estimatedBudgetShare: 0.45,
        specConstraints: { flat_response: true },
        rationale: 'Acoustic isolation and accurate monitoring for voice recording.',
      });
      categories.push({
        categoryId: 'accessories',
        categoryName: 'Broadcast Dynamic Microphone',
        priority: 'essential',
        estimatedBudgetShare: 0.35,
        specConstraints: { cardioid_pattern: true },
        rationale: 'Cardioid speech capture with background noise rejection.',
      });
      categories.push({
        categoryId: 'keyboards',
        categoryName: 'Quiet Low-Profile Keyboard',
        priority: 'recommended',
        estimatedBudgetShare: 0.20,
        specConstraints: { silent_switches: true },
        rationale: 'Prevents mechanical keystroke clatter from bleeding into active microphone.',
      });
    } else {
      // Workstation default decomposition
      categories.push({
        categoryId: 'monitors',
        categoryName: 'Designer Display Panel',
        priority: 'essential',
        estimatedBudgetShare: 0.45,
        specConstraints: {
          resolution: primaryUse === 'Programming' || secondaryUse?.includes('design') ? '4K/IPS' : 'High-Res',
        },
        rationale: 'Visual canvas providing screen real estate for development windows and color accuracy.',
      });
      categories.push({
        categoryId: 'keyboards',
        categoryName: 'Ergonomic Mechanical Keyboard',
        priority: 'essential',
        estimatedBudgetShare: 0.25,
        specConstraints: { mechanical: true },
        rationale: 'Tactile typing feedback and long-session fatigue reduction for coding.',
      });
      categories.push({
        categoryId: 'mice',
        categoryName: 'Precision Ergonomic Mouse',
        priority: 'essential',
        estimatedBudgetShare: 0.15,
        specConstraints: { high_dpi: true },
        rationale: 'Micro-precision navigation for both code inspection and vector/graphic canvas work.',
      });
      categories.push({
        categoryId: 'accessories',
        categoryName: 'Workspace Connectivity & Mounts',
        priority: 'recommended',
        estimatedBudgetShare: 0.15,
        specConstraints: {},
        rationale: 'Cable organization and ergonomics to maintain an uncluttered desk layout.',
      });
    }

    // If furniture is mentioned, replace accessories with furniture
    if (lower.includes('chair') || lower.includes('desk') || lower.includes('sit-stand')) {
      categories.push({
        categoryId: 'furniture',
        categoryName: 'Ergonomic Task Seating',
        priority: 'recommended',
        estimatedBudgetShare: 0.25,
        specConstraints: { lumbar_support: true },
        rationale: 'Lumbar support and posture alignment for sustained work sessions.',
      });
      // Normalize shares
      const total = categories.reduce((sum, c) => sum + c.estimatedBudgetShare, 0);
      categories.forEach((c) => (c.estimatedBudgetShare = Math.round((c.estimatedBudgetShare / total) * 100) / 100));
    }

    // 6. Quality Tier
    let qualityTier: PlanTier = 'balanced';
    if (amount <= 200 || lower.includes('cheap') || lower.includes('budget')) {
      qualityTier = 'budget';
    } else if (amount >= 1000 || lower.includes('pro') || lower.includes('best') || lower.includes('top-tier')) {
      qualityTier = 'performance';
    }

    // 7. Restrictions & Clarifying Questions
    const restrictions: string[] = [];
    if (connectivity === 'wireless') restrictions.push('All staging should prefer wireless/Bluetooth connectivity');
    if (isHardCeiling) restrictions.push(`Do not exceed budget ceiling of ${currency} ${amount}`);

    const clarifyingQuestions: string[] = [];
    if (!text.match(/\d+/)) {
      clarifyingQuestions.push('What is your ideal budget ceiling for this setup?');
    }
    if (!lower.includes('mac') && !lower.includes('windows') && !lower.includes('pc')) {
      clarifyingQuestions.push('What operating system (Mac, Windows, or Linux) will this setup connect to?');
    }

    // Contradictory Preferences Detection
    if (lower.includes('wireless') && lower.includes('wired')) {
      restrictions.push('Preference conflict: Both wired and wireless connectivity requested. Preferring hybrid tri-mode devices.');
      clarifyingQuestions.push('Do you prefer strictly wireless peripherals or hybrid wired/wireless devices?');
    }
    if (lower.includes('silent') && (lower.includes('clicky') || lower.includes('blue switch'))) {
      restrictions.push('Acoustic conflict: Both silent and clicky switches requested. Prioritizing silent tactile switches.');
    }
    if (amount > 0 && amount < 200 && (lower.includes('laptop') || lower.includes('ultrabook'))) {
      restrictions.push(`Budget alert: Budget of ${currency} ${amount} is below developer laptop minimum. Highlighting cost trade-offs.`);
    }

    return {
      objective,
      budget: {
        amount,
        currency,
        isHardCeiling,
      },
      categories,
      preferences: {
        primaryUse,
        secondaryUse,
        ergonomics,
        connectivity,
      },
      restrictions,
      qualityTier,
      compatibilityRequirements: [
        'Single-cable USB-C or multi-port peripheral hub compatibility',
        'Universal OS pairing support',
      ],
      missingInformation: clarifyingQuestions.length > 0 ? ['OS Specification'] : [],
      clarifyingQuestions,
      isAiGenerated: false,
      engine: 'deterministic-fallback',
      model: 'deterministic-semantic-engine',
    };
  },

  /**
   * Interprets natural language purchasing intention.
   * Leverages Ollama when online, with fallback to deterministic semantic parsing.
   * NEVER misrepresents deterministic fallback as AI-generated.
   */
  parseIntent: async (prompt: string): Promise<ParsedIntent> => {
    const systemPrompt = `You are the lead AI commerce agent for PayPal Intent.
Analyze the user's purchasing goal and return a strictly valid JSON object matching this schema:
{
  "objective": "Concise primary goal title",
  "budget": {
    "amount": number,
    "currency": "USD" | "INR" | "EUR" | "GBP",
    "isHardCeiling": boolean
  },
  "categories": [
    {
      "categoryId": "laptops" | "monitors" | "keyboards" | "mice" | "headphones" | "furniture" | "accessories",
      "categoryName": "Descriptive category name",
      "priority": "essential" | "recommended" | "optional",
      "estimatedBudgetShare": number between 0.0 and 1.0,
      "rationale": "Clear reason why this category is required for their goal"
    }
  ],
  "preferences": {
    "primaryUse": "Primary use case (e.g. programming, gaming, design)",
    "secondaryUse": "Secondary use case if any",
    "ergonomics": boolean,
    "connectivity": "wired" | "wireless" | "any"
  },
  "restrictions": ["Specific restriction strings"],
  "qualityTier": "budget" | "balanced" | "performance",
  "compatibilityRequirements": ["Hardware compatibility considerations"],
  "missingInformation": ["Any missing requirements"],
  "clarifyingQuestions": ["Clarifying questions to ask the buyer"]
}
Do not include markdown fences or explanatory text. Return ONLY raw JSON.`;

    const userPrompt = `Analyze this purchasing goal: "${prompt}"`;

    const inferenceResult = await aiService.generateWithFallback<ParsedIntent>(
      userPrompt,
      systemPrompt,
      () => intentParserService.deterministicParseIntent(prompt),
      12000 // 12 second timeout for local Ollama
    );

    // Validate structured output with Zod
    try {
      const validated = parsedIntentSchema.parse(inferenceResult.data);
      return {
        ...validated,
        isAiGenerated: inferenceResult.isAiGenerated,
        engine: inferenceResult.engine,
        model: inferenceResult.model,
      };
    } catch (validationErr: any) {
      logger.warn(`AI output validation failed, using deterministic parser: ${validationErr.message}`);
      const fallback = intentParserService.deterministicParseIntent(prompt);
      return {
        ...fallback,
        isAiGenerated: false,
        engine: 'deterministic-fallback',
        model: 'deterministic-semantic-engine',
      };
    }
  },

  /**
   * Persists the parsed intent and its decomposed requirements into session memory in SQLite.
   */
  persistIntentAnalysis: (
    sessionId: string,
    rawPrompt: string,
    parsed: ParsedIntent
  ): { intentSession: IntentSession; requirements: IntentRequirement[] } => {
    const intentSession = intentRepository.create({
      sessionId,
      rawPrompt,
      parsedObjective: parsed.objective,
      budgetAmount: parsed.budget.amount,
      budgetCurrency: parsed.budget.currency,
      isHardCeiling: parsed.budget.isHardCeiling,
      urgency: 'standard',
    });

    // Bulk save decomposed requirements
    const requirements = requirementRepository.bulkCreate(
      intentSession.id,
      parsed.categories.map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        priority: c.priority,
        estimatedBudgetShare: c.estimatedBudgetShare,
        specConstraints: c.specConstraints || {},
      }))
    );

    // Update session status to 'analyzed'
    intentRepository.updateStatus(intentSession.id, 'analyzed', parsed.objective);

    return { intentSession, requirements };
  },

  /**
   * Refines an existing intent session with user adjustments without restarting the session.
   */
  refineIntent: (
    intentSessionId: string,
    refinementText: string,
    updatedBudget?: number
  ): { intentSession: IntentSession; requirements: IntentRequirement[] } => {
    const existing = intentRepository.getById(intentSessionId);
    if (!existing) {
      throw new Error(`Intent session "${intentSessionId}" not found`);
    }

    const updatedPrompt = `${existing.rawPrompt}. Additional constraint: ${refinementText}`;
    let newBudget = updatedBudget ?? existing.budgetAmount;

    // Check if refinementText has a budget adjustment
    const budgetMatch = refinementText.match(/\$?(\d+)/);
    if (budgetMatch && !updatedBudget) {
      newBudget = parseFloat(budgetMatch[1]);
    }

    const updatedSession = intentRepository.update(intentSessionId, {
      rawPrompt: updatedPrompt,
      budgetAmount: newBudget,
      parsedObjective: `${existing.parsedObjective} (+ ${refinementText.slice(0, 30)})`,
    });

    if (!updatedSession) {
      throw new Error('Failed to update intent session');
    }

    // Re-evaluate requirements with refinement
    const currentRequirements = requirementRepository.getByIntentId(intentSessionId);

    // If refinement mentions specific category, adjust priorities or constraints
    const lower = refinementText.toLowerCase();
    let requirementsModified = false;

    if (lower.includes('wireless')) {
      currentRequirements.forEach((r) => {
        if (r.categoryId === 'keyboards' || r.categoryId === 'mice') {
          r.specConstraints = { ...r.specConstraints, connectivity: 'wireless' };
          requirementsModified = true;
        }
      });
    }

    if (lower.includes('headphone') || lower.includes('audio')) {
      if (!currentRequirements.some((r) => r.categoryId === 'headphones')) {
        currentRequirements.push({
          id: `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
          intentSessionId,
          categoryId: 'headphones',
          categoryName: 'Noise-Cancelling Studio Headphones',
          priority: 'recommended',
          estimatedBudgetShare: 0.2,
          specConstraints: {},
          createdAt: new Date().toISOString(),
        });
        requirementsModified = true;
      }
    }

    if (lower.includes('chair') || lower.includes('desk') || lower.includes('furniture')) {
      if (!currentRequirements.some((r) => r.categoryId === 'furniture')) {
        currentRequirements.push({
          id: `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
          intentSessionId,
          categoryId: 'furniture',
          categoryName: 'Ergonomic Task Seating & Desk',
          priority: 'recommended',
          estimatedBudgetShare: 0.25,
          specConstraints: {},
          createdAt: new Date().toISOString(),
        });
        requirementsModified = true;
      }
    }

    if (requirementsModified) {
      requirementRepository.bulkCreate(intentSessionId, currentRequirements);
    }

    return {
      intentSession: updatedSession,
      requirements: requirementRepository.getByIntentId(intentSessionId),
    };
  },
};
