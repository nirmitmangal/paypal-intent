import React, { createContext, useContext, useState, useEffect } from 'react';
import type { IntentSession, Product, TransactionRecord, ExecutionPlan } from '@paypal-intent/shared';
import { api, getStoredSessionToken } from '../lib/api';

export type ScreenId =
  | 'home'
  | 'workspace'
  | 'planning'
  | 'discovery'
  | 'decision'
  | 'cart'
  | 'payment'
  | 'history'
  | 'settings';

export interface CartLineItem {
  product: Product;
  quantity: number;
}

export interface RequirementItem {
  id: string;
  name: string;
  categoryId: string;
  priority: 'essential' | 'recommended' | 'optional';
  budgetShare: number; // percentage (0 - 100)
  description: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  activeScreen: ScreenId;
  navigateTo: (screen: ScreenId) => void;
  currentIntent: IntentSession | null;
  startIntent: (prompt: string, budget?: number, urgency?: string) => Promise<boolean>;
  refineIntent: (refinementText: string) => Promise<void>;
  requirements: RequirementItem[];
  updateRequirement: (id: string, updates: Partial<RequirementItem>) => void;
  addRequirement: (req: Omit<RequirementItem, 'id'>) => void;
  removeRequirement: (id: string) => void;
  executionPlan: ExecutionPlan | null;
  activeTier: 'budget' | 'balanced' | 'performance';
  setActiveTier: (tier: 'budget' | 'balanced' | 'performance') => void;
  generatePlan: (tier?: 'budget' | 'balanced' | 'performance') => Promise<void>;
  cartItems: CartLineItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  syncCartToServer: () => Promise<boolean>;
  comparedProducts: Product[];
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
  lockedProductIds: string[];
  toggleLock: (productId: string) => void;
  swapBundleItem: (oldProductId: string, newProduct: Product) => void;
  bundleItems: Product[];
  setBundleItems: React.Dispatch<React.SetStateAction<Product[]>>;
  transactions: TransactionRecord[];
  addTransaction: (tx: TransactionRecord) => void;
  catalogProducts: Product[];
  notifications: ToastNotification[];
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  dismissNotification: (id: string) => void;
  isLoading: boolean;
  currency: string;
  setCurrency: (c: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'paypal_intent_cart_v1';
const INTENT_STORAGE_KEY = 'paypal_intent_active_v1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [currentIntent, setCurrentIntent] = useState<IntentSession | null>(() => {
    try {
      const saved = localStorage.getItem(INTENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [requirements, setRequirements] = useState<RequirementItem[]>([
    {
      id: 'req_1',
      name: 'Primary Audio / Recording Unit',
      categoryId: 'microphone',
      priority: 'essential',
      budgetShare: 40,
      description: 'Dynamic broadcast cardioid capsule with background noise rejection.',
    },
    {
      id: 'req_2',
      name: 'Acoustic Isolation & Monitoring',
      categoryId: 'headphones',
      priority: 'essential',
      budgetShare: 25,
      description: 'Closed-back reference headphones to eliminate monitor bleed.',
    },
    {
      id: 'req_3',
      name: 'Desk Suspension Mounting',
      categoryId: 'boom_arm',
      priority: 'recommended',
      budgetShare: 20,
      description: 'Heavy-duty articulated arm with internal cable channels.',
    },
    {
      id: 'req_4',
      name: 'Plosive Diffusion & Pop Shield',
      categoryId: 'pop_filter',
      priority: 'recommended',
      budgetShare: 15,
      description: 'Dual-layer metallic curved mesh for clean vocal captures.',
    },
  ]);

  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [activeTier, setActiveTier] = useState<'budget' | 'balanced' | 'performance'>('balanced');
  const [bundleItems, setBundleItems] = useState<Product[]>([]);
  const [lockedProductIds, setLockedProductIds] = useState<string[]>([]);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState('USD');

  // Load Cart from localStorage
  const [cartItems, setCartItems] = useState<CartLineItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync intent to localStorage
  useEffect(() => {
    if (currentIntent) {
      localStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify(currentIntent));
    }
  }, [currentIntent]);

  // Load Initial Catalog & History
  useEffect(() => {
    async function loadData() {
      try {
        const prodRes = await api.getProducts();
        if (prodRes.success && prodRes.data) {
          setCatalogProducts(prodRes.data);
          if (bundleItems.length === 0) {
            setBundleItems(prodRes.data.slice(0, 4));
          }
        }
        const txRes = await api.getTransactions();
        if (txRes.success && txRes.data) {
          setTransactions(txRes.data);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    loadData();
  }, []);

  const showNotification = (message: string, type: ToastNotification['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissNotification(id);
    }, 3500);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const navigateTo = (screen: ScreenId) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startIntent = async (prompt: string, budget = 350, urgency = 'standard'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.createIntent(prompt, budget, currency, urgency);
      if (res.success && res.data) {
        const intentData = (res.data as any).intentSession || res.data;
        setCurrentIntent(intentData);

        // Update requirements from server intelligence decomposition
        if ((res.data as any).requirements && Array.isArray((res.data as any).requirements)) {
          const reqs = (res.data as any).requirements.map((r: any) => ({
            id: r.id,
            name: r.categoryName,
            categoryId: r.categoryId,
            priority: r.priority,
            budgetShare: Math.round(r.estimatedBudgetShare * 100),
            description: r.specConstraints ? JSON.stringify(r.specConstraints) : '',
          }));
          if (reqs.length > 0) {
            setRequirements(reqs);
          }
        }

        const engineLabel = (res.meta as any)?.isAiGenerated ? 'Local Ollama AI' : 'Deterministic Semantic Engine';
        showNotification(`Goal analyzed by ${engineLabel}!`, 'success');

        // Automatically synthesize initial plan & recommended bundle
        try {
          const planRes = await api.generatePlan(intentData.id, 'balanced');
          if (planRes.success && planRes.data) {
            setExecutionPlan(planRes.data);
            setActiveTier('balanced');
            const items = planRes.data.items.map((i: any) => i.product).filter(Boolean) as Product[];
            if (items.length > 0) {
              setBundleItems(items);
            }
          }
        } catch (planErr) {
          console.warn('Initial plan generation skipped:', planErr);
        }

        navigateTo('workspace');
        return true;
      } else {
        // Local fallback
        const fallback: IntentSession = {
          id: `int_${Date.now().toString(36)}`,
          sessionId: getStoredSessionToken() || 'ses_active',
          rawPrompt: prompt,
          parsedObjective: prompt.slice(0, 60),
          budgetAmount: budget,
          budgetCurrency: currency,
          isHardCeiling: true,
          urgency: urgency as any,
          status: 'analyzed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCurrentIntent(fallback);
        showNotification('Goal staged in local workspace', 'info');
        navigateTo('workspace');
        return true;
      }
    } catch (err) {
      showNotification('Failed to create intent session', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refineIntent = async (refinementText: string) => {
    if (!currentIntent) return;
    setIsLoading(true);
    try {
      const res = await api.refineIntent(currentIntent.id, refinementText);
      if (res.success && res.data) {
        const updated = (res.data as any).intentSession || res.data;
        setCurrentIntent(updated);

        if ((res.data as any).requirements && Array.isArray((res.data as any).requirements)) {
          const reqs = (res.data as any).requirements.map((r: any) => ({
            id: r.id,
            name: r.categoryName,
            categoryId: r.categoryId,
            priority: r.priority,
            budgetShare: Math.round(r.estimatedBudgetShare * 100),
            description: r.specConstraints ? JSON.stringify(r.specConstraints) : '',
          }));
          if (reqs.length > 0) {
            setRequirements(reqs);
          }
        }
        showNotification(`Refined goal: "${refinementText}"`, 'success');

        // Automatically regenerate plan with new constraints
        try {
          const planRes = await api.generatePlan(updated.id, activeTier);
          if (planRes.success && planRes.data) {
            setExecutionPlan(planRes.data);
            const items = planRes.data.items.map((i: any) => i.product).filter(Boolean) as Product[];
            if (items.length > 0) {
              setBundleItems(items);
            }
          }
        } catch {
          // Keep current bundle on plan generation error
        }
      } else {
        const updatedPrompt = `${currentIntent.rawPrompt}. Additional constraint: ${refinementText}`;
        let updatedBudget = currentIntent.budgetAmount;
        const budgetMatch = refinementText.match(/\$(\d+)/);
        if (budgetMatch) {
          updatedBudget = parseFloat(budgetMatch[1]);
        }

        const updatedIntent: IntentSession = {
          ...currentIntent,
          rawPrompt: updatedPrompt,
          budgetAmount: updatedBudget,
          updatedAt: new Date().toISOString(),
        };
        setCurrentIntent(updatedIntent);
        showNotification(`Added constraint: "${refinementText}"`, 'success');
      }
    } catch {
      showNotification('Refinement failed to sync with server', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequirement = (id: string, updates: Partial<RequirementItem>) => {
    setRequirements((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    showNotification('Requirement updated', 'info');
  };

  const addRequirement = (req: Omit<RequirementItem, 'id'>) => {
    const id = `req_${Date.now()}`;
    setRequirements((prev) => [...prev, { ...req, id }]);
    showNotification(`Added category: ${req.name}`, 'success');
  };

  const removeRequirement = (id: string) => {
    setRequirements((prev) => prev.filter((r) => r.id !== id));
    showNotification('Requirement category removed', 'info');
  };

  const handleSetActiveTier = (tier: 'budget' | 'balanced' | 'performance') => {
    setActiveTier(tier);
    if (currentIntent) {
      generatePlan(tier);
    }
  };

  const generatePlan = async (tier: 'budget' | 'balanced' | 'performance' = activeTier) => {
    if (!currentIntent) return;
    setIsLoading(true);
    try {
      const res = await api.generatePlan(currentIntent.id, tier);
      if (res.success && res.data) {
        setExecutionPlan(res.data);
        setActiveTier(tier);
        // Map recommendation products to bundle
        const items = res.data.items.map((i) => i.product).filter(Boolean) as Product[];
        if (items.length > 0) {
          setBundleItems(items);
        }
      }
    } catch (err) {
      console.error('Plan generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const syncCartToServer = async (): Promise<boolean> => {
    try {
      const items = cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      await api.syncCart(items, currentIntent?.id);
      return true;
    } catch {
      return false;
    }
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showNotification(`Added "${product.title}" to cart`, 'success');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showNotification('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Comparison operations
  const toggleCompare = (product: Product) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        showNotification('Maximum 3 items can be compared side-by-side', 'warning');
        return prev;
      }
      showNotification(`Added "${product.title}" to comparison`, 'info');
      return [...prev, product];
    });
  };

  const clearCompare = () => {
    setComparedProducts([]);
  };

  // Lock and Swap
  const toggleLock = (productId: string) => {
    setLockedProductIds((prev) => {
      const isLocked = prev.includes(productId);
      if (isLocked) {
        showNotification('Item unlocked for rebalancing', 'info');
        return prev.filter((id) => id !== productId);
      }
      showNotification('Item locked into plan', 'success');
      return [...prev, productId];
    });
  };

  const swapBundleItem = (oldProductId: string, newProduct: Product) => {
    setBundleItems((prev) =>
      prev.map((item) => (item.id === oldProductId ? newProduct : item))
    );
    showNotification(`Swapped with ${newProduct.title}`, 'success');
  };

  const addTransaction = (tx: TransactionRecord) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        activeScreen,
        navigateTo,
        currentIntent,
        startIntent,
        refineIntent,
        requirements,
        updateRequirement,
        addRequirement,
        removeRequirement,
        executionPlan,
        activeTier,
        setActiveTier: handleSetActiveTier,
        generatePlan,
        cartItems,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        syncCartToServer,
        comparedProducts,
        toggleCompare,
        clearCompare,
        lockedProductIds,
        toggleLock,
        swapBundleItem,
        bundleItems,
        setBundleItems,
        transactions,
        addTransaction,
        catalogProducts,
        notifications,
        showNotification,
        dismissNotification,
        isLoading,
        currency,
        setCurrency,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
