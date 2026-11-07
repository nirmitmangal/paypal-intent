import { Request, Response } from 'express';
import { getDatabase } from '../db';
import { aiService } from '../services/ai.service';
import { env } from '../config/env';
import type { ApiResponse, SystemHealthStatus } from '@paypal-intent/shared';

const startTime = Date.now();

export const healthController = {
  getSystemHealth: async (_req: Request, res: Response): Promise<void> => {
    // 1. Check Database
    let dbStatus: 'connected' | 'disconnected' | 'error' = 'connected';
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      const db = getDatabase();
      db.prepare('SELECT 1').get();
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = 'disconnected';
    }

    // 2. Check Ollama AI
    const aiHealth = await aiService.checkHealth();

    // 3. Check PayPal Gateway Config
    const isPayPalConfigured =
      env.PAYPAL_CLIENT_ID !== 'sandbox_client_id_placeholder' &&
      env.PAYPAL_CLIENT_SECRET !== 'sandbox_client_secret_placeholder';

    const healthData: SystemHealthStatus = {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - startTime) / 1000,
      version: '1.0.0',
      services: {
        database: {
          status: dbStatus,
          path: env.DATABASE_PATH,
          latencyMs: dbLatencyMs,
        },
        aiEngine: {
          status: aiHealth.status,
          model: aiHealth.model,
          endpoint: aiHealth.endpoint,
          latencyMs: aiHealth.latencyMs,
        },
        paypalGateway: {
          status: isPayPalConfigured ? 'sandbox_ready' : 'configured',
          mode: env.PAYPAL_MODE,
          clientIdConfigured: isPayPalConfigured,
        },
      },
    };

    const response: ApiResponse<SystemHealthStatus> = {
      success: true,
      data: healthData,
      meta: { timestamp: new Date().toISOString() },
    };

    res.json(response);
  },

  getDbHealth: (_req: Request, res: Response): void => {
    try {
      const db = getDatabase();
      const tableCount = (
        db
          .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
          .get() as { count: number }
      ).count;

      res.json({
        success: true,
        data: {
          status: 'connected',
          tableCount,
          path: env.DATABASE_PATH,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: { code: 'DB_ERROR', message: (err as Error).message },
      });
    }
  },

  getAiHealth: async (_req: Request, res: Response): Promise<void> => {
    const aiHealth = await aiService.checkHealth();
    res.json({
      success: true,
      data: aiHealth,
    });
  },
};
