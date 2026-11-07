import { Request, Response } from 'express';
import { agentToolsService } from '../services/agentTools.service';
import { aiService } from '../services/ai.service';
import type { AgentToolName } from '@paypal-intent/shared';

export const agentController = {
  executeTool: (req: Request, res: Response): void => {
    try {
      const { tool, parameters } = req.body;

      if (!tool || typeof tool !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Field "tool" is required and must be a string.' },
        });
        return;
      }

      const result = agentToolsService.executeTool(tool as AgentToolName, parameters || {});

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'TOOL_EXECUTION_FAILED', message: err.message },
      });
    }
  },

  getHealth: async (_req: Request, res: Response): Promise<void> => {
    try {
      const health = await aiService.checkHealth();
      res.json({
        success: true,
        data: health,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'AI_HEALTH_CHECK_FAILED', message: err.message },
      });
    }
  },
};
