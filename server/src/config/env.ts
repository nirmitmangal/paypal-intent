import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Database
  DATABASE_PATH: process.env.DATABASE_PATH || './data/paypal_intent.db',

  // AI Engine (Ollama)
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'qwen2.5:3b',

  // PayPal Sandbox
  PAYPAL_MODE: (process.env.PAYPAL_MODE || 'sandbox') as 'sandbox' | 'live',
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || 'sandbox_client_id_placeholder',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || 'sandbox_client_secret_placeholder',
  PAYPAL_API_BASE:
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev_session_secret_paypal_intent_2026',
};
