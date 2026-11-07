import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface OllamaHealth {
  status: 'ready' | 'offline' | 'degraded';
  model: string;
  endpoint: string;
  latencyMs?: number;
  availableModels?: string[];
}

export interface AIInferenceResult<T> {
  data: T;
  isAiGenerated: boolean;
  engine: 'ollama' | 'deterministic-fallback';
  model: string;
  latencyMs: number;
}

export const aiService = {
  /**
   * Checks the health and connection status of the local Ollama instance.
   */
  checkHealth: async (): Promise<OllamaHealth> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        return {
          status: 'degraded',
          model: env.OLLAMA_MODEL,
          endpoint: env.OLLAMA_BASE_URL,
          latencyMs: Date.now() - startTime,
        };
      }

      const data = (await response.json()) as { models?: Array<{ name: string }> };
      const modelNames = data.models?.map((m) => m.name) || [];
      const hasTargetModel = modelNames.some((n) => n.startsWith(env.OLLAMA_MODEL));

      return {
        status: hasTargetModel ? 'ready' : 'degraded',
        model: env.OLLAMA_MODEL,
        endpoint: env.OLLAMA_BASE_URL,
        latencyMs: Date.now() - startTime,
        availableModels: modelNames,
      };
    } catch (err) {
      logger.warn(`Ollama health check unreachable at ${env.OLLAMA_BASE_URL}: ${(err as Error).message}`);
      return {
        status: 'offline',
        model: env.OLLAMA_MODEL,
        endpoint: env.OLLAMA_BASE_URL,
      };
    }
  },

  /**
   * Generates a structured JSON response from Ollama.
   * Returns null if Ollama is unreachable, times out, or fails JSON parsing.
   */
  generateStructured: async <T>(
    prompt: string,
    systemPrompt?: string,
    timeoutMs = 15000
  ): Promise<{ data: T; latencyMs: number } | null> => {
    const startTime = Date.now();
    try {
      const res = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: env.OLLAMA_MODEL,
          prompt,
          system: systemPrompt,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.2, // Low temperature for consistent structured reasoning
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.warn(`Ollama generate failed (${res.status}): ${errorText}`);
        return null;
      }

      const data = (await res.json()) as { response: string };
      const parsed = JSON.parse(data.response) as T;
      return {
        data: parsed,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      logger.warn(`Ollama inference unavailable or timed out (${timeoutMs}ms): ${(err as Error).message}`);
      return null;
    }
  },

  /**
   * Executes inference with graceful, transparent deterministic fallback.
   * NEVER labels deterministic fallback output as AI-generated.
   */
  generateWithFallback: async <T>(
    prompt: string,
    systemPrompt: string,
    fallbackFn: () => T,
    timeoutMs = 15000
  ): Promise<AIInferenceResult<T>> => {
    const startTime = Date.now();
    const aiResult = await aiService.generateStructured<T>(prompt, systemPrompt, timeoutMs);

    if (aiResult && aiResult.data) {
      return {
        data: aiResult.data,
        isAiGenerated: true,
        engine: 'ollama',
        model: env.OLLAMA_MODEL,
        latencyMs: aiResult.latencyMs,
      };
    }

    // Deterministic fallback execution
    const fallbackData = fallbackFn();
    return {
      data: fallbackData,
      isAiGenerated: false,
      engine: 'deterministic-fallback',
      model: 'deterministic-semantic-engine',
      latencyMs: Date.now() - startTime,
    };
  },
};
