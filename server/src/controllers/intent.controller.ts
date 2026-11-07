import { Request, Response } from 'express';
import { intentParserService } from '../services/intentParser.service';
import { intentRepository, requirementRepository } from '../db/repository';
import type { ApiResponse, IntentSession, IntentRequirement, ParsedIntent } from '@paypal-intent/shared';

export const intentController = {
  createIntent: async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const { prompt, budgetCeiling, currency } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "prompt" is required and must be a string.' },
        });
        return;
      }

      // 1. Analyze and interpret purchasing goal via AI with deterministic fallback
      const parsedIntent = await intentParserService.parseIntent(prompt);

      // Override budget or currency if explicitly supplied in the request body
      if (budgetCeiling !== undefined && budgetCeiling > 0) {
        parsedIntent.budget.amount = budgetCeiling;
      }
      if (currency) {
        parsedIntent.budget.currency = currency;
      }

      // 2. Persist intent session and decomposed requirements in memory
      const { intentSession, requirements } = intentParserService.persistIntentAnalysis(
        sessionId,
        prompt,
        parsedIntent
      );

      const response: ApiResponse<{
        intentSession: IntentSession;
        requirements: IntentRequirement[];
        parsedIntent: ParsedIntent;
      }> = {
        success: true,
        data: {
          intentSession,
          requirements,
          parsedIntent,
        },
        meta: {
          timestamp: new Date().toISOString(),
          isAiGenerated: parsedIntent.isAiGenerated,
          engine: parsedIntent.engine,
          model: parsedIntent.model,
        },
      };

      res.status(201).json(response);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'INTENT_CREATION_FAILED', message: err.message },
      });
    }
  },

  getIntent: (req: Request, res: Response): void => {
    const sessionId = (req as any).sessionId || 'ses_default';
    const id = String(req.params.id);
    const intent = intentRepository.getById(id);

    if (!intent) {
      res.status(404).json({
        success: false,
        error: { code: 'INTENT_NOT_FOUND', message: `Intent "${id}" not found.` },
      });
      return;
    }

    if (intent.sessionId && intent.sessionId !== sessionId) {
      res.status(403).json({
        success: false,
        error: { code: 'UNAUTHORIZED_ACCESS', message: 'Unauthorized: Intent belongs to a different session' },
      });
      return;
    }

    const requirements = requirementRepository.getByIntentId(id);

    res.json({
      success: true,
      data: {
        ...intent,
        requirements,
      },
    });
  },

  refineIntent: async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const id = String(req.params.id);
      const { refinementText, updatedBudgetCeiling } = req.body;

      if (!refinementText || typeof refinementText !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "refinementText" is required and must be a string.' },
        });
        return;
      }

      const existing = intentRepository.getById(id);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { code: 'INTENT_NOT_FOUND', message: `Intent "${id}" not found.` },
        });
        return;
      }

      if (existing.sessionId && existing.sessionId !== sessionId) {
        res.status(403).json({
          success: false,
          error: { code: 'UNAUTHORIZED_ACCESS', message: 'Unauthorized: Intent belongs to a different session' },
        });
        return;
      }

      const { intentSession, requirements } = intentParserService.refineIntent(
        id,
        refinementText,
        updatedBudgetCeiling
      );

      res.json({
        success: true,
        data: {
          intentSession,
          requirements,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: { code: 'INTENT_REFINEMENT_FAILED', message: err.message },
      });
    }
  },
};
