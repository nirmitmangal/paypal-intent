import type {
  ApiResponse,
  SystemHealthStatus,
  IntentSession,
  ExecutionPlan,
  ShoppingCart,
  Product,
  TransactionRecord,
} from "@paypal-intent/shared";

const API_BASE = "/api";
const SESSION_STORAGE_KEY = "paypal_intent_session_token";

export function getStoredSessionToken(): string | null {
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

export function setStoredSessionToken(token: string): void {
  localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearStoredSessionToken(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredSessionToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["x-session-token"] = token;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Check for updated session token in response header
    const newToken = res.headers.get("x-session-token");
    if (newToken) {
      setStoredSessionToken(newToken);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Failed to connect to PayPal Intent server",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const api = {
  // System Health
  getHealth: () => request<SystemHealthStatus>("/health"),
  getAiHealth: () => request<{ status: string; model: string; responsive: boolean }>("/health/ai"),
  getDbHealth: () => request<{ status: string; tableCount: number; path: string }>("/health/db"),

  // Intent Management & Intelligence
  createIntent: (prompt: string, budgetCeiling?: number, currency?: string, urgency = "standard") =>
    request<{
      intentSession: IntentSession;
      requirements: any[];
      parsedIntent: any;
    }>("/intents", {
      method: "POST",
      body: JSON.stringify({ prompt, budgetCeiling, currency, urgency }),
    }),
  getIntent: (id: string) => request<IntentSession & { requirements?: any[] }>(`/intents/${id}`),
  refineIntent: (id: string, refinementText: string, updatedBudgetCeiling?: number) =>
    request<{
      intentSession: IntentSession;
      requirements: any[];
    }>(`/intents/${id}/refine`, {
      method: "POST",
      body: JSON.stringify({ refinementText, updatedBudgetCeiling }),
    }),

  // Planning, Multi-Tier Bundles & Rebalancing
  getPlansForIntent: (intentId: string) => request<ExecutionPlan[]>(`/plans/intent/${intentId}`),
  generatePlan: (intentSessionId: string, preferredTier = "balanced", requirements?: any[]) =>
    request<ExecutionPlan>("/plans", {
      method: "POST",
      body: JSON.stringify({ intentSessionId, preferredTier, requirements }),
    }),
  rebalancePlan: (
    planId: string,
    lockedRecommendationIds: string[] = [],
    swappedProducts: Array<{ recommendationId: string; newProductId: string }> = []
  ) =>
    request<ExecutionPlan>(`/plans/${planId}/rebalance`, {
      method: "POST",
      body: JSON.stringify({ lockedRecommendationIds, swappedProducts }),
    }),

  // Controlled Agent Tools
  executeAgentTool: (tool: string, parameters: Record<string, unknown> = {}) =>
    request<any>("/agent/tools/execute", {
      method: "POST",
      body: JSON.stringify({ tool, parameters }),
    }),

  // Product Catalog
  getProducts: (params?: { category?: string; query?: string; maxPrice?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.query) searchParams.append("query", params.query);
    if (params?.maxPrice !== undefined) searchParams.append("maxPrice", params.maxPrice.toString());
    const queryString = searchParams.toString();
    return request<Product[]>(`/products${queryString ? `?${queryString}` : ""}`);
  },
  getCategories: () =>
    request<Array<{ categoryId: string; name: string; count: number; minPrice: number; maxPrice: number }>>("/products/categories"),
  getProductById: (id: string) => request<Product>(`/products/${id}`),
  compareProducts: (productIds: string[]) =>
    request<{ products: Product[]; comparison: Record<string, unknown> }>("/products/compare", {
      method: "POST",
      body: JSON.stringify({ productIds }),
    }),

  // Cart
  getCart: (intentSessionId?: string) => {
    const q = intentSessionId ? `?intentSessionId=${intentSessionId}` : "";
    return request<ShoppingCart>(`/cart${q}`);
  },
  addToCart: (productId: string, quantity = 1, intentSessionId?: string) =>
    request<ShoppingCart>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, intentSessionId }),
    }),
  updateCartQuantity: (itemId: string, quantity: number) =>
    request<ShoppingCart>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (itemId: string) =>
    request<ShoppingCart>(`/cart/items/${itemId}`, {
      method: "DELETE",
    }),
  clearCart: () =>
    request<ShoppingCart>("/cart", {
      method: "DELETE",
    }),
  validateCart: () =>
    request<{
      isValid: boolean;
      errors: string[];
      warnings: string[];
      cart: ShoppingCart;
    }>("/cart/validate", {
      method: "POST",
    }),
  syncCart: async (items: Array<{ productId: string; quantity: number }>, intentSessionId?: string): Promise<ShoppingCart | null> => {
    try {
      const res = await request<ShoppingCart>("/cart/sync", {
        method: "POST",
        body: JSON.stringify({ items, intentSessionId }),
      });
      return res.success && res.data ? res.data : null;
    } catch {
      return null;
    }
  },

  // Payments (PayPal Sandbox)
  getPayPalConfig: () =>
    request<{
      clientId: string;
      environment: string;
      currency: string;
      isConfigured: boolean;
    }>("/payments/config"),
  createPayPalOrder: (cartId: string, forceNew = false) =>
    request<{
      paypalOrderId: string;
      orderId: string;
      orderNumber: string;
      totalAmount: number;
      currency: string;
      reused?: boolean;
    }>("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ cartId, forceNew }),
    }),
  capturePayPalOrder: (paypalOrderId: string, orderId: string) =>
    request<{
      captureId: string;
      status: string;
      transaction: TransactionRecord;
    }>("/payments/capture-order", {
      method: "POST",
      body: JSON.stringify({ paypalOrderId, orderId }),
    }),

  // Transaction Ledger & Receipts
  getTransactions: () => request<TransactionRecord[]>("/transactions"),
  getTransactionById: (id: string) => request<TransactionRecord>(`/transactions/${id}`),
  verifyTransactionHash: (id: string) =>
    request<{
      id: string;
      isValid: boolean;
      transactionHash: string;
      algorithm: string;
      canonicalPayload: string;
      verifiedAt: string;
    }>(`/transactions/${id}/verify`),
};
