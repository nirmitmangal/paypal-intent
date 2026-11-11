import { Request, Response } from 'express';
import { agentPlanningService } from '../services/agentPlanning.service';
import { intentRepository } from '../db/repository';
import type { ApiResponse, ExecutionPlan } from '@paypal-intent/shared';

export const planController = {
  createPlan: async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const { intentSessionId, preferredTier, requirements } = req.body;
      if (!intentSessionId) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "intentSessionId" is required.' },
        });
        return;
      }

      let intent = intentRepository.getById(intentSessionId);
      if (!intent) {
        const sessionIntents = intentRepository.getBySessionId(sessionId);
        if (sessionIntents.length > 0) {
          intent = sessionIntents[0];
        }
      }

      if (!intent) {
        res.status(404).json({
          success: false,
          error: { code: 'INTENT_NOT_FOUND', message: `Intent "${intentSessionId}" not found.` },
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

      const plan = await agentPlanningService.createPlanForIntent(
        intent.id,
        preferredTier || 'balanced',
        requirements
      );

      const response: ApiResponse<ExecutionPlan> = {
        success: true,
        data: plan,
        meta: { timestamp: new Date().toISOString() },
      };

      res.status(201).json(response);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'PLAN_GENERATION_FAILED', message: err.message },
      });
    }
  },

  getPlansForIntent: (req: Request, res: Response): void => {
    try {
      const sessionId = (req as any).sessionId || 'ses_default';
      const intentId = String(req.params.intentId);
      const intent = intentRepository.getById(intentId);

      if (!intent) {
        res.status(404).json({
          success: false,
          error: { code: 'INTENT_NOT_FOUND', message: `Intent "${intentId}" not found` },
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

      const plans = agentPlanningService.getPlansForIntent(intentId);

      res.json({
        success: true,
        data: plans,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'PLANS_FETCH_FAILED', message: err.message },
      });
    }
  },

  rebalancePlan: async (req: Request, res: Response): Promise<void> => {
    try {
      const planId = String(req.params.planId);
      const { lockedRecommendationIds, swappedProducts } = req.body;

      const updatedPlan = await agentPlanningService.rebalancePlan(
        planId,
        lockedRecommendationIds || [],
        swappedProducts || []
      );

      res.json({
        success: true,
        data: updatedPlan,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      const status = err.message?.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: { code: 'PLAN_REBALANCE_FAILED', message: err.message },
      });
    }
  },
};
