import { agentPlanningService } from './agentPlanning.service';
import type { ExecutionPlan, PlanTier } from '@paypal-intent/shared';

export const recommendationService = {
  createPlanForIntent: async (
    intentSessionId: string,
    tier: PlanTier = 'balanced'
  ): Promise<ExecutionPlan> => {
    return agentPlanningService.createPlanForIntent(intentSessionId, tier);
  },

  rebalancePlan: async (
    planId: string,
    lockedRecIds: string[] = [],
    swappedItems: Array<{ recommendationId: string; newProductId: string }> = []
  ): Promise<ExecutionPlan> => {
    return agentPlanningService.rebalancePlan(planId, lockedRecIds, swappedItems);
  },

  getPlansForIntent: (intentSessionId: string): ExecutionPlan[] => {
    return agentPlanningService.getPlansForIntent(intentSessionId);
  },
};
