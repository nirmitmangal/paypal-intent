/**
 * Shared Type Definitions for PayPal Intent
 * Used across Frontend, Backend, AI Orchestrator, and Payment Gateway.
 */

// ============================================================================
// Session & User Preferences
// ============================================================================

export interface Session {
  id: string;
  sessionToken: string;
  ipHash?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface UserPreferences {
  id: string;
  sessionId: string;
  preferredCurrency: string;
  qualityPreference: 'budget' | 'balanced' | 'premium';
  brandFlexibility: 'strict' | 'flexible' | 'open';
  defaultConstraints?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Intent & Goal Decomposition
// ============================================================================

export type IntentStatus = 'pending' | 'analyzed' | 'planned' | 'cart_prepared' | 'completed' | 'abandoned';

export interface IntentBudget {
  amount: number;
  currency: string;
  isHardCeiling: boolean;
}

export interface IntentSession {
  id: string;
  sessionId: string;
  rawPrompt: string;
  parsedObjective: string;
  budgetAmount: number;
  budgetCurrency: string;
  isHardCeiling: boolean;
  urgency: 'low' | 'standard' | 'high';
  status: IntentStatus;
  createdAt: string;
  updatedAt: string;
}

export type RequirementPriority = 'essential' | 'recommended' | 'optional';

export interface IntentRequirement {
  id: string;
  intentSessionId: string;
  categoryId: string;
  categoryName: string;
  priority: RequirementPriority;
  estimatedBudgetShare: number; // 0.0 to 1.0
  description?: string;
  specConstraints?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// Products & Catalog
// ============================================================================

export interface ProductAttribute {
  id: string;
  productId: string;
  attributeKey: string;
  attributeValue: string;
  attributeType: 'string' | 'number' | 'boolean';
  isFilterable: boolean;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  categoryId: string;
  brand: string;
  basePrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  imageUrl: string;
  description: string;
  attributes?: ProductAttribute[];
  compatibilityTags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Execution Plans & Recommendations
// ============================================================================

export type PlanTier = 'budget' | 'balanced' | 'performance';

export interface RecommendationItem {
  id: string;
  executionPlanId: string;
  productId: string;
  product?: Product;
  categoryId: string;
  quantity: number;
  unitPrice: number;
  compatibilityScore: number; // 0.0 to 1.0
  selectionReason: string;
  tradeOffNotes?: string;
  isLocked: boolean;
  createdAt: string;
}

export interface ExecutionPlan {
  id: string;
  intentSessionId: string;
  version: number;
  planTier: PlanTier;
  summary: string;
  isActive: boolean;
  totalEstimatedCost: number;
  currency: string;
  items: RecommendationItem[];
  createdAt: string;
  isFeasible?: boolean;
  budgetDeficit?: number;
  availableTradeOffs?: string[];
}

// ============================================================================
// Shopping Cart
// ============================================================================

export type CartStatus = 'active' | 'locked' | 'converted' | 'abandoned';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  isCustomSelection: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingCart {
  id: string;
  sessionId: string;
  intentSessionId: string;
  status: CartStatus;
  subtotal: number;
  estimatedTax: number;
  shippingFee: number;
  totalAmount: number;
  currency: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Orders, Payments & Transactions
// ============================================================================

export type OrderStatus = 'pending' | 'approved' | 'captured' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  cartId: string;
  sessionId: string;
  intentSessionId: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'created' | 'approved' | 'completed' | 'failed';

export interface Payment {
  id: string;
  orderId: string;
  provider: 'paypal';
  paypalOrderId: string;
  paypalCaptureId?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  payerEmail?: string;
  payerId?: string;
  paymentSource?: string;
  rawResponse?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  paymentId: string;
  orderId: string;
  sessionId: string;
  transactionHash: string;
  status: 'SUCCESS' | 'FAILED';
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  intentSummary: string;
  auditSnapshot: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// API Contracts & Payloads
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    count?: number;
    [key: string]: unknown;
  };
}

export interface CreateIntentRequest {
  prompt: string;
  budgetCeiling?: number;
  currency?: string;
  preferences?: Partial<UserPreferences>;
}

export interface CreatePlanRequest {
  intentSessionId: string;
  preferredTier?: PlanTier;
}

export interface UpdatePlanItemRequest {
  recommendationId: string;
  newProductId?: string;
  isLocked?: boolean;
}

export interface CreatePayPalOrderRequest {
  cartId: string;
}

export interface CapturePayPalOrderRequest {
  paypalOrderId: string;
  orderId: string;
}

// ============================================================================
// AI Agent, Intent Intelligence & Decision Engine
// ============================================================================

export interface ParsedCategoryRequirement {
  categoryId: string;
  categoryName: string;
  priority: RequirementPriority;
  estimatedBudgetShare: number; // 0.0 to 1.0
  description?: string;
  specConstraints?: Record<string, unknown>;
  rationale: string;
}

export interface ParsedIntentPreferences {
  primaryUse?: string | null;
  secondaryUse?: string | null;
  ergonomics?: boolean | null;
  aestheticStyle?: string | null;
  brandPreference?: string | null;
  portability?: boolean | null;
  connectivity?: 'wired' | 'wireless' | 'any' | null;
  other?: string[] | null;
}

export interface ParsedIntent {
  objective: string;
  budget: {
    amount: number;
    currency: string;
    isHardCeiling: boolean;
  };
  categories: ParsedCategoryRequirement[];
  preferences: ParsedIntentPreferences;
  restrictions: string[];
  qualityTier: PlanTier;
  compatibilityRequirements: string[];
  missingInformation: string[];
  clarifyingQuestions: string[];
  hasExplicitBudget?: boolean;
  isAiGenerated: boolean;
  engine: 'ollama' | 'deterministic-fallback';
  model: string;
}

export type AgentToolName =
  | 'search_products'
  | 'get_product_details'
  | 'compare_products'
  | 'calculate_budget'
  | 'evaluate_compatibility'
  | 'create_or_get_cart'
  | 'modify_cart';

export interface AgentToolCall<T = Record<string, unknown>> {
  id: string;
  tool: AgentToolName;
  parameters: T;
  timestamp: string;
}

export interface AgentToolResult<T = unknown> {
  toolCallId: string;
  tool: AgentToolName;
  success: boolean;
  result?: T;
  error?: string;
  timestamp: string;
}

export interface ProductEvaluationScore {
  productId: string;
  categoryId: string;
  budgetFitScore: number;       // 0.0 - 1.0 (closeness to target budget share)
  performanceScore: number;     // 0.0 - 1.0 (specs matching intended use)
  compatibilityScore: number;   // 0.0 - 1.0 (interface/standard compatibility)
  valueScore: number;           // 0.0 - 1.0 (rating / price ratio)
  preferenceScore: number;      // 0.0 - 1.0 (adherence to ergonomic/wireless/brand preference)
  compositeScore: number;       // 0.0 - 1.0 (weighted aggregate)
  selectionReason: string;
  tradeOffNotes?: string;
}

export interface RefineIntentRequest {
  refinementText: string;
  updatedBudgetCeiling?: number;
  addedRestrictions?: string[];
}

export interface PlanRebalanceRequest {
  planId: string;
  lockedRecommendationIds?: string[];
  swappedProducts?: Array<{ recommendationId: string; newProductId: string }>;
}

// ============================================================================
// System Health
// ============================================================================

export interface SystemHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      path: string;
      latencyMs?: number;
    };
    aiEngine: {
      status: 'ready' | 'offline' | 'degraded';
      model: string;
      endpoint: string;
      latencyMs?: number;
    };
    paypalGateway: {
      status: 'configured' | 'unconfigured' | 'sandbox_ready';
      mode: 'sandbox' | 'live';
      clientIdConfigured: boolean;
    };
  };
}
