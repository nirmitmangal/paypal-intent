import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from './ai.service';
import { intentRepository, requirementRepository } from '../db/repository';
import { normalizeCategoryId } from '../utils/categoryMapper';
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
  categoryId: z.string().transform((val) => normalizeCategoryId(val)),
  categoryName: z.string(),
  priority: z.enum(['essential', 'recommended', 'optional']).default('essential'),
  estimatedBudgetShare: z.number().min(0.0).max(1.0).default(0.25),
  specConstraints: z.record(z.string(), z.unknown()).optional().default({}),
  description: z.string().optional().default(''),
  rationale: z.string().optional().default(''),
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
  hasExplicitBudget: z.boolean().optional().default(false),
});

/**
 * Extracts specific attribute constraints from item text.
 */
function extractSpecConstraints(name: string, desc: string): Record<string, unknown> {
  const combined = `${name} ${desc}`.toLowerCase();
  const specs: Record<string, unknown> = {};

  if (combined.includes('wireless') || combined.includes('bluetooth')) {
    specs.wireless = true;
  }
  if (combined.includes('ergonomic')) {
    specs.ergonomic = true;
  }
  if (combined.includes('mechanical') || combined.includes('switch') || combined.includes('coding') || combined.includes('typing')) {
    specs.mechanical = true;
  }
  if (combined.includes('lamp') || combined.includes('light') || combined.includes('led')) {
    specs.lighting = true;
    specs.high_cri = true;
  }
  if (combined.includes('over-ear') || combined.includes('lecture') || combined.includes('music')) {
    specs.over_ear = true;
  }
  if (combined.includes('flat response') || combined.includes('monitoring')) {
    specs.flat_response = true;
  }

  return specs;
}

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
    let hasExplicitBudget = false;

    // Detect INR (₹, INR, rupees)
    const inrMatch = text.match(/(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d+)?)\s*(?:k)?/i) || text.match(/([\d,]+)\s*(?:INR|rupees)/i);
    const usdMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(?:k)?/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:USD|dollars)/i);
    const eurMatch = text.match(/€\s*([\d,]+(?:\.\d+)?)/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:EUR|euros)/i);
    const gbpMatch = text.match(/£\s*([\d,]+(?:\.\d+)?)/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:GBP|pounds)/i);

    if (inrMatch) {
      currency = 'INR';
      amount = parseFloat(inrMatch[1].replace(/,/g, ''));
      if (inrMatch[0].toLowerCase().includes('k')) amount *= 1000;
      hasExplicitBudget = true;
    } else if (eurMatch) {
      currency = 'EUR';
      amount = parseFloat(eurMatch[1].replace(/,/g, ''));
      hasExplicitBudget = true;
    } else if (gbpMatch) {
      currency = 'GBP';
      amount = parseFloat(gbpMatch[1].replace(/,/g, ''));
      hasExplicitBudget = true;
    } else if (usdMatch) {
      currency = 'USD';
      amount = parseFloat(usdMatch[1].replace(/,/g, ''));
      if (usdMatch[0].toLowerCase().includes('k')) amount *= 1000;
      hasExplicitBudget = true;
    } else {
      // Standalone number check (e.g. "under 500", "budget ceiling is $300")
      const numMatch = text.match(/(?:under|below|budget|max|around|ceiling(?: is)?)\s*([\d,]+)/i);
      if (numMatch) {
        amount = parseFloat(numMatch[1].replace(/,/g, ''));
        hasExplicitBudget = true;
      }
    }

    if (lower.includes('around') || lower.includes('approx') || lower.includes('flexible')) {
      isHardCeiling = false;
    }

    // 2. Primary & Secondary Use Extraction
    let primaryUse = 'General Productivity';
    let secondaryUse: string | undefined;

    if (lower.includes('study') || lower.includes('college') || lower.includes('student')) {
      primaryUse = 'College Study & Productivity';
    } else if (lower.includes('program') || lower.includes('coding') || lower.includes('developer') || lower.includes('software')) {
      primaryUse = 'Programming';
    } else if (lower.includes('podcast') || lower.includes('voiceover') || lower.includes('broadcast')) {
      primaryUse = 'Audio & Podcasting';
    } else if (lower.includes('design') || lower.includes('graphic')) {
      primaryUse = 'Graphic design';
    } else if (lower.includes('game') || lower.includes('gaming')) {
      primaryUse = 'Gaming';
    }

    if (lower.includes('coding') && primaryUse !== 'Programming') {
      secondaryUse = 'Coding & software development';
    } else if (lower.includes('design') && primaryUse !== 'Graphic design') {
      secondaryUse = 'Occasional graphic design';
    } else if (lower.includes('lecture') || lower.includes('music')) {
      secondaryUse = 'Online lectures and audio';
    }

    // 3. Ergonomics & Connectivity
    const ergonomics = lower.includes('ergo') || lower.includes('posture') || lower.includes('comfort') || lower.includes('wrist');
    let connectivity: 'wired' | 'wireless' | 'any' = 'any';
    if (lower.includes('wireless') || lower.includes('bluetooth') || lower.includes('clean desk')) {
      connectivity = 'wireless';
    } else if (lower.includes('wired') || lower.includes('low latency')) {
      connectivity = 'wired';
    }

    // 4. Primary Objective Title
    let objective = 'Workspace Setup';
    if (lower.includes('study desk') || lower.includes('college work') || lower.includes('student')) {
      objective = 'College Study Desk Setup';
    } else if (lower.includes('podcast') || lower.includes('voice recording') || lower.includes('broadcast')) {
      objective = 'Podcasting & Recording Studio Setup';
    } else if (lower.includes('workstation')) {
      objective = lower.includes('home') ? 'Home Workstation Setup' : 'Developer Workstation Setup';
    } else if (lower.includes('developer') || lower.includes('programming workstation')) {
      objective = 'Developer Programming Workstation';
    } else if (lower.includes('laptop') || lower.includes('ultrabook')) {
      objective = 'Mobile Developer Workstation';
    } else if (lower.includes('monitor') && !lower.includes('keyboard')) {
      objective = 'Display Upgrade Setup';
    }

    // 5. Dynamic Category Extraction
    const categories: ParsedCategoryRequirement[] = [];

    // Check for enumerated list in the prompt
    // e.g. "1. Keyboard — comfortable for long typing..."
    // or "- Wireless mouse: ergonomic..."
    const listRegex = /(?:^|\n)\s*(?:(?:\d+[\.\)])|[-*•])\s*([^—–:\n\r]+?)(?:[—–:\-]\s*([^\n\r]+))?(?=\n|$)/g;
    const extractedList: Array<{ name: string; desc: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = listRegex.exec(text)) !== null) {
      const rawName = match[1].trim();
      const rawDesc = (match[2] || '').trim();
      // Skip lines that are general meta instructions
      if (
        rawName.toLowerCase().includes('budget') ||
        rawName.toLowerCase().includes('prioritize') ||
        rawName.toLowerCase().includes('ceiling')
      ) {
        continue;
      }
      if (rawName.length > 0 && rawName.length < 50) {
        extractedList.push({ name: rawName, desc: rawDesc });
      }
    }

    if (extractedList.length >= 2) {
      // The user gave an explicit enumerated list of categories!
      const share = Math.round((1.0 / extractedList.length) * 100) / 100;
      for (const item of extractedList) {
        const canonicalId = normalizeCategoryId(item.name);
        const displayName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
        const itemDesc = item.desc || `High-quality ${displayName} meeting user criteria.`;

        categories.push({
          categoryId: canonicalId,
          categoryName: displayName,
          priority: 'essential',
          estimatedBudgetShare: share,
          description: itemDesc,
          rationale: itemDesc,
          specConstraints: extractSpecConstraints(item.name, item.desc),
        });
      }
    } else {
      // Fallback: Keyword scanning for specific category requests
      const requestedCategories: Array<{
        id: string;
        name: string;
        desc: string;
        priority: 'essential' | 'recommended';
      }> = [];

      if (lower.includes('keyboard') || lower.includes('typing')) {
        requestedCategories.push({
          id: 'keyboards',
          name: lower.includes('mechanical') ? 'Ergonomic Mechanical Keyboard' : 'Productivity Keyboard',
          desc: 'Comfortable typing unit for extended study and coding sessions.',
          priority: 'essential',
        });
      }
      if (lower.includes('mouse') || lower.includes('mice')) {
        requestedCategories.push({
          id: 'mice',
          name: lower.includes('wireless') ? 'Ergonomic Wireless Mouse' : 'Precision Optical Mouse',
          desc: 'Accurate, reliable ergonomic navigation device.',
          priority: 'essential',
        });
      }
      if (lower.includes('lamp') || lower.includes('light') || lower.includes('screenbar')) {
        requestedCategories.push({
          id: 'accessories',
          name: 'High-CRI LED Desk Task Lamp',
          desc: 'Glare-free adjustable study surface task lighting.',
          priority: 'essential',
        });
      }
      if (lower.includes('headphone') || lower.includes('headset') || lower.includes('earphone')) {
        requestedCategories.push({
          id: 'headphones',
          name: lower.includes('over-ear') ? 'Comfortable Over-Ear Headphones' : 'Acoustic Headphones',
          desc: 'Clear audio monitoring for lectures, communication, and music.',
          priority: 'essential',
        });
      }
      if (lower.includes('monitor') || lower.includes('display') || lower.includes('screen')) {
        requestedCategories.push({
          id: 'monitors',
          name: 'High-Resolution Display Monitor',
          desc: 'Screen workspace for multitasking, coding, and lectures.',
          priority: 'essential',
        });
      }
      if (lower.includes('laptop') || lower.includes('notebook') || lower.includes('macbook')) {
        requestedCategories.push({
          id: 'laptops',
          name: 'Developer Laptop Workstation',
          desc: 'High-efficiency portable processing machine.',
          priority: 'essential',
        });
      }
      if (
        (lower.includes('chair') || lower.includes('standing desk') || lower.includes('seating')) &&
        !lower.includes('study desk setup')
      ) {
        requestedCategories.push({
          id: 'furniture',
          name: 'Ergonomic Task Seating',
          desc: 'Posture alignment for long study sessions.',
          priority: 'recommended',
        });
      }
      if (lower.includes('mic') || lower.includes('microphone') || lower.includes('podcast')) {
        requestedCategories.push({
          id: 'accessories',
          name: 'Broadcast Dynamic Microphone',
          desc: 'Voice capture with background rejection for recording.',
          priority: 'essential',
        });
      }
      if (lower.includes('podcast') && !lower.includes('headphone') && !lower.includes('headset')) {
        requestedCategories.push({
          id: 'headphones',
          name: 'Studio Monitor Headphones',
          desc: 'Acoustic isolation for tracking and vocal editing.',
          priority: 'essential',
        });
      }

      if (requestedCategories.length > 0) {
        const share = Math.round((1.0 / requestedCategories.length) * 100) / 100;
        for (const req of requestedCategories) {
          categories.push({
            categoryId: req.id,
            categoryName: req.name,
            priority: req.priority,
            estimatedBudgetShare: share,
            description: req.desc,
            rationale: req.desc,
            specConstraints: extractSpecConstraints(req.name, req.desc),
          });
        }
      } else {
        // Default standard workstation setup when no specific items were mentioned
        categories.push({
          categoryId: 'monitors',
          categoryName: 'High-Resolution Display',
          priority: 'essential',
          estimatedBudgetShare: 0.45,
          description: 'Visual canvas providing screen real estate for development windows.',
          rationale: 'Screen real estate for multitasking and coding.',
          specConstraints: { resolution: 'High-Res' },
        });
        categories.push({
          categoryId: 'keyboards',
          categoryName: 'Ergonomic Keyboard',
          priority: 'essential',
          estimatedBudgetShare: 0.25,
          description: 'Comfortable typing unit for extended daily usage.',
          rationale: 'Tactile typing feedback and fatigue reduction.',
          specConstraints: { mechanical: true },
        });
        categories.push({
          categoryId: 'mice',
          categoryName: 'Precision Mouse',
          priority: 'essential',
          estimatedBudgetShare: 0.15,
          description: 'Accurate ergonomic navigation device.',
          rationale: 'Micro-precision navigation for productive workflows.',
          specConstraints: { ergonomic: true },
        });
        categories.push({
          categoryId: 'accessories',
          categoryName: 'Workspace Desk Accessories',
          priority: 'recommended',
          estimatedBudgetShare: 0.15,
          description: 'Cable management and mounting accessories for clean desk surface.',
          rationale: 'Organized desk ergonomics.',
          specConstraints: {},
        });
      }
    }

    // 6. Quality Tier
    let qualityTier: PlanTier = 'balanced';
    if (amount <= 200 || lower.includes('cheap') || lower.includes('budget') || lower.includes('value for money')) {
      qualityTier = 'budget';
    } else if (amount >= 1000 || lower.includes('pro') || lower.includes('best') || lower.includes('top-tier')) {
      qualityTier = 'performance';
    }

    // 7. Restrictions & Clarifying Questions
    const restrictions: string[] = [];
    if (connectivity === 'wireless') restrictions.push('All staging should prefer wireless/Bluetooth connectivity');
    if (isHardCeiling) restrictions.push(`Do not exceed budget ceiling of ${currency} ${amount}`);

    const hasSilent = lower.includes('silent') || lower.includes('quiet');
    const hasClicky = lower.includes('clicky') || lower.includes('blue switch');
    const hasWireless = lower.includes('wireless') || lower.includes('bluetooth');
    const hasWiredOnly = lower.includes('wired only') || (lower.includes('wired') && lower.includes('only'));

    if ((hasSilent && hasClicky) || (hasWireless && hasWiredOnly)) {
      restrictions.push('Flagged preference conflict: User specified contradictory hardware requirements (e.g. silent vs clicky or wireless vs wired-only).');
    }

    const clarifyingQuestions: string[] = [];
    if (!hasExplicitBudget) {
      clarifyingQuestions.push('What is your ideal budget ceiling for this setup?');
    }
    if (!lower.includes('mac') && !lower.includes('windows') && !lower.includes('pc')) {
      clarifyingQuestions.push('What operating system (Mac, Windows, or Linux) will this setup connect to?');
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
        'Peripheral connectivity matching standard ports',
        'Universal OS pairing support',
      ],
      missingInformation: clarifyingQuestions.length > 0 ? ['OS Specification'] : [],
      clarifyingQuestions,
      hasExplicitBudget,
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
      "categoryName": "Descriptive category name (e.g. Keyboard, Wireless Mouse, Desk Lamp, Headphones)",
      "priority": "essential" | "recommended" | "optional",
      "estimatedBudgetShare": number between 0.0 and 1.0,
      "description": "Natural human-readable description (NEVER raw JSON)",
      "rationale": "Clear reason why this category is required for their goal"
    }
  ],
  "preferences": {
    "primaryUse": "Primary use case (e.g. programming, study, design)",
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

MANDATORY RULES:
1. If the user specifies an exact list of items (e.g. 1. Keyboard, 2. Wireless mouse, 3. Desk lamp, 4. Headphones), you MUST generate EXACTLY those categories and NO OTHERS. Never introduce microphones, studio monitors, pop filters, or office chairs unless explicitly requested.
2. Every item MUST map to one of the 7 valid categoryId values: laptops, monitors, keyboards, mice, headphones, furniture, accessories.
   - "Desk Lamp" or "ScreenBar" MUST map to "accessories".
   - "Wireless Mouse" MUST map to "mice".
   - "Keyboard" MUST map to "keyboards".
   - "Headphones" MUST map to "headphones".
3. The budget amount MUST match the user's explicit budget (e.g. if the user says $300, budget.amount MUST be 300).
4. Category descriptions and rationales MUST be natural human-readable sentences, NEVER raw JSON objects.
Do not include markdown fences or explanatory text. Return ONLY raw JSON.`;

    const userPrompt = `Analyze this purchasing goal: "${prompt}"`;

    const inferenceResult = await aiService.generateWithFallback<ParsedIntent>(
      userPrompt,
      systemPrompt,
      () => intentParserService.deterministicParseIntent(prompt),
      15000 // 15 second timeout for local Ollama
    );

    // Validate structured output with Zod
    try {
      const validated = parsedIntentSchema.parse(inferenceResult.data);
      // Double check that categoryId is normalized
      const normalizedCategories = validated.categories.map((c) => ({
        ...c,
        categoryId: normalizeCategoryId(c.categoryId || c.categoryName),
        description: c.description || c.rationale || `${c.categoryName} component`,
      }));

      // Detect whether the prompt actually contains an explicit budget ceiling
      const detFallback = intentParserService.deterministicParseIntent(prompt);
      const hasExplicitBudget =
        validated.hasExplicitBudget ||
        detFallback.hasExplicitBudget ||
        Boolean(prompt.match(/(?:\$|USD|EUR|INR|rupees|ceiling|budget ceiling|budget of)\s*[\d,]+/i));

      return {
        ...validated,
        categories: normalizedCategories,
        hasExplicitBudget,
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
        description: c.description || c.rationale,
        specConstraints: {
          description: c.description || c.rationale,
          ...(c.specConstraints || {}),
        },
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

    const updatedPrompt = `${existing.rawPrompt}. Additional user requirement: ${refinementText}`;
    const parsedRefinement = intentParserService.deterministicParseIntent(updatedPrompt);
    const refinementParsed = intentParserService.deterministicParseIntent(refinementText);

    const newBudget =
      updatedBudget ??
      (refinementParsed.hasExplicitBudget
        ? refinementParsed.budget.amount
        : parsedRefinement.hasExplicitBudget
        ? parsedRefinement.budget.amount
        : existing.budgetAmount);

    const updatedSession = intentRepository.update(intentSessionId, {
      rawPrompt: updatedPrompt,
      parsedObjective: parsedRefinement.objective,
      budgetAmount: newBudget,
      status: 'analyzed',
    });

    if (!updatedSession) {
      throw new Error(`Failed to update intent session "${intentSessionId}"`);
    }

    // Preserve existing requirements and merge with new requirements
    const existingReqs = requirementRepository.getByIntentId(intentSessionId);
    const existingCategories = new Set(existingReqs.map((r) => r.categoryId));

    const mergedRequirements: Array<{
      categoryId: string;
      categoryName: string;
      priority: 'essential' | 'recommended' | 'optional';
      estimatedBudgetShare: number;
      description?: string;
      specConstraints: Record<string, unknown>;
    }> = existingReqs.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      priority: r.priority,
      estimatedBudgetShare: r.estimatedBudgetShare,
      description: r.description,
      specConstraints: r.specConstraints || {},
    }));

    // Add any newly identified categories from the refinement
    for (const cat of parsedRefinement.categories) {
      if (!existingCategories.has(cat.categoryId)) {
        mergedRequirements.push({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          priority: cat.priority,
          estimatedBudgetShare: cat.estimatedBudgetShare,
          description: cat.description || cat.rationale,
          specConstraints: {
            description: cat.description || cat.rationale,
            ...(cat.specConstraints || {}),
          },
        });
      }
    }

    // Re-normalize budget shares
    const totalShare = mergedRequirements.reduce((sum, r) => sum + r.estimatedBudgetShare, 0);
    mergedRequirements.forEach((r) => {
      r.estimatedBudgetShare = Math.round((r.estimatedBudgetShare / totalShare) * 100) / 100;
    });

    const savedReqs = requirementRepository.bulkCreate(intentSessionId, mergedRequirements);

    return {
      intentSession: updatedSession,
      requirements: savedReqs,
    };
  },
};
