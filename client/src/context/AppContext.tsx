import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { IntentSession, Product, TransactionRecord, ExecutionPlan, ShoppingCart } from '@paypal-intent/shared';
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
  refineIntent: (refinementText: string, updatedBudgetCeiling?: number) => Promise<void>;
  updateIntentBudget: (newBudget: number) => Promise<boolean>;
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
  syncCartToServer: () => Promise<ShoppingCart | null>;
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
  refreshCatalog: () => Promise<void>;
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

const VALID_SCREENS: ScreenId[] = [
  'home',
  'workspace',
  'planning',
  'discovery',
  'decision',
  'cart',
  'payment',
  'history',
  'settings',
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<ScreenId>(() => {
    try {
      const hash = window.location.hash.replace(/^#\/?/, '') as ScreenId;
      if (VALID_SCREENS.includes(hash)) return hash;
      const params = new URLSearchParams(window.location.search);
      const screenParam = params.get('screen') as ScreenId;
      if (VALID_SCREENS.includes(screenParam)) return screenParam;
      // Handle direct pathnames (e.g. /payment, /history)
      const pathSegment = window.location.pathname.replace(/^\//, '').split('/')[0] as ScreenId;
      if (VALID_SCREENS.includes(pathSegment)) return pathSegment;
      // If returning from PayPal Sandbox with order token or approval callback
      if (params.has('token') || params.has('PayerID') || params.get('status') === 'approved') {
        return 'payment';
      }
    } catch {
      // ignore
    }
    return 'home';
  });
  const [currentIntent, setCurrentIntent] = useState<IntentSession | null>(() => {
    try {
      const saved = localStorage.getItem(INTENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [requirements, setRequirements] = useState<RequirementItem[]>([]);

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
        // Verify currentIntent still exists on server if present
        if (currentIntent?.id) {
          const intentCheck = await api.getIntent(currentIntent.id);
          if (!intentCheck.success) {
            setCurrentIntent(null);
            localStorage.removeItem(INTENT_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    loadData();
  }, []);

  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);

  const showNotification = (message: string, type: ToastNotification['type'] = 'info') => {
    const now = Date.now();
    // Deduplicate identical notifications within 2.5 seconds to prevent spam
    if (
      lastToastRef.current &&
      lastToastRef.current.message === message &&
      now - lastToastRef.current.timestamp < 2500
    ) {
      return;
    }
    lastToastRef.current = { message, timestamp: now };

    const id = `toast_${now}_${Math.random().toString(36).substring(2, 6)}`;
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
    try {
      if (window.location.hash.replace(/^#\/?/, '') !== screen) {
        window.location.hash = screen === 'home' ? '' : screen;
      }
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '') as ScreenId;
      if (VALID_SCREENS.includes(hash)) {
        setActiveScreen(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const startIntent = async (prompt: string, budget?: number, urgency = 'standard'): Promise<boolean> => {
    setIsLoading(true);
    setBundleItems([]);
    setExecutionPlan(null);
    setRequirements([]);
    try {
      const res = await api.createIntent(prompt, budget, currency, urgency);
      if (res.success && res.data) {
        const intentData = (res.data as any).intentSession || res.data;
        setCurrentIntent(intentData);

        // Update requirements from server intelligence decomposition
        if ((res.data as any).requirements && Array.isArray((res.data as any).requirements)) {
          const reqs = (res.data as any).requirements.map((r: any) => {
            let desc = r.description;
            if (!desc && r.specConstraints) {
              if (typeof r.specConstraints.description === 'string' && r.specConstraints.description.trim()) {
                desc = r.specConstraints.description;
              } else {
                const keys = Object.keys(r.specConstraints).filter((k) => !k.startsWith('_') && k !== 'description');
                desc = keys.length > 0 ? `${keys.map((k) => k.replace(/_/g, ' ')).join(', ')} optimized` : `${r.categoryName} component`;
              }
            }
            return {
              id: r.id,
              name: r.categoryName,
              categoryId: r.categoryId,
              priority: r.priority,
              budgetShare: Math.round(r.estimatedBudgetShare * 100),
              description: desc || `${r.categoryName} component`,
            };
          });
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
          budgetAmount: budget ?? 300,
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

  const refineIntent = async (refinementText: string, updatedBudgetCeiling?: number) => {
    if (!currentIntent) return;
    setIsLoading(true);
    try {
      const res = await api.refineIntent(currentIntent.id, refinementText, updatedBudgetCeiling);
      if (res.success && res.data) {
        const updated = (res.data as any).intentSession || res.data;
        setCurrentIntent(updated);

        if ((res.data as any).requirements && Array.isArray((res.data as any).requirements)) {
          const reqs = (res.data as any).requirements.map((r: any) => {
            let desc = r.description;
            if (!desc && r.specConstraints) {
              if (typeof r.specConstraints.description === 'string' && r.specConstraints.description.trim()) {
                desc = r.specConstraints.description;
              } else {
                const keys = Object.keys(r.specConstraints).filter((k) => !k.startsWith('_') && k !== 'description');
                desc = keys.length > 0 ? `${keys.map((k) => k.replace(/_/g, ' ')).join(', ')} optimized` : `${r.categoryName} component`;
              }
            }
            return {
              id: r.id,
              name: r.categoryName,
              categoryId: r.categoryId,
              priority: r.priority,
              budgetShare: Math.round(r.estimatedBudgetShare * 100),
              description: desc || `${r.categoryName} component`,
            };
          });
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

  const updateIntentBudget = async (newBudget: number): Promise<boolean> => {
    if (!currentIntent) return false;
    setIsLoading(true);
    try {
      await refineIntent(`Adjust budget ceiling to $${newBudget}`, newBudget);
      showNotification(`Budget ceiling adjusted to $${newBudget}. Proposal recalculating...`, 'success');
      return true;
    } catch (err) {
      console.error('Failed to update budget:', err);
      showNotification('Failed to update budget ceiling', 'error');
      return false;
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

  const handleSetActiveTier = async (tier: 'budget' | 'balanced' | 'performance') => {
    setActiveTier(tier);

    // 1. Immediately update bundle items and cart from catalog for instant reactive UI
    if (catalogProducts.length > 0) {
      const kb =
        catalogProducts.find((p) => p.id === (tier === 'performance' ? 'prod_kb_02' : 'prod_kb_03')) ||
        catalogProducts.find((p) => p.categoryId?.toLowerCase().includes('keyboard'));
      const mou =
        catalogProducts.find((p) => p.id === (tier === 'performance' ? 'prod_mou_02' : 'prod_mou_01')) ||
        catalogProducts.find((p) => p.categoryId?.toLowerCase().includes('mou'));
      const lamp =
        catalogProducts.find((p) => p.id === 'prod_acc_02') ||
        catalogProducts.find((p) => p.title?.toLowerCase().includes('lamp') || p.categoryId?.toLowerCase().includes('accessories'));
      const audio =
        catalogProducts.find((p) => p.id === (tier === 'budget' ? 'prod_hp_03' : 'prod_hp_01')) ||
        catalogProducts.find((p) => p.categoryId?.toLowerCase().includes('headphone'));

      const immediateItems = [kb, mou, lamp, audio].filter(Boolean) as Product[];
      if (immediateItems.length === 4) {
        setBundleItems(immediateItems);
        const newCartItems = immediateItems.map((p) => ({ product: p, quantity: 1 }));
        setCartItems(newCartItems);
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCartItems));
      }
    }

    // 2. Authoritative server-side plan generation & cart synchronization
    if (currentIntent) {
      await generatePlan(tier);
    } else {
      try {
        setIsLoading(true);
        const res = await api.createIntent(
          'I need a keyboard, wireless mouse, desk lamp, and headphones under $300',
          300,
          'USD',
          'standard'
        );
        if (res.success && res.data) {
          const intentData = (res.data as any).intentSession || res.data;
          setCurrentIntent(intentData);
          if ((res.data as any).requirements && Array.isArray((res.data as any).requirements)) {
            const reqs = (res.data as any).requirements.map((r: any) => ({
              id: r.id,
              name: r.categoryName,
              categoryId: r.categoryId,
              priority: r.priority,
              budgetShare: Math.round(r.estimatedBudgetShare * 100),
              description: r.description || `${r.categoryName} component`,
            }));
            setRequirements(reqs);
          }
          const planRes = await api.generatePlan(intentData.id, tier);
          if (planRes.success && planRes.data) {
            setExecutionPlan(planRes.data);
            const items = planRes.data.items.map((i: any) => i.product).filter(Boolean) as Product[];
            if (items.length > 0) {
              setBundleItems(items);
              const newCartItems = items.map((product) => ({ product, quantity: 1 }));
              setCartItems(newCartItems);
              localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCartItems));
              await api.syncCart(
                items.map((p) => ({ productId: p.id, quantity: 1 })),
                intentData.id
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to auto-stage intent for tier selection:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const generatePlan = async (tier: 'budget' | 'balanced' | 'performance' = activeTier) => {
    if (!currentIntent) return;
    setIsLoading(true);
    try {
      const mappedReqs = requirements.map((r) => ({
        id: r.id,
        categoryId: r.categoryId,
        categoryName: r.name,
        priority: r.priority,
        estimatedBudgetShare: r.budgetShare / 100,
        description: r.description,
      }));
      let res = await api.generatePlan(currentIntent.id, tier, mappedReqs);
      if (!res.success && (res.error?.code === 'INTENT_NOT_FOUND' || res.error?.code === 'UNAUTHORIZED_ACCESS')) {
        // Auto-recreate intent on server if stale from previous session
        const createRes = await api.createIntent(
          currentIntent.rawPrompt || 'I need a keyboard, wireless mouse, desk lamp, and headphones under $300',
          currentIntent.budgetAmount || 300,
          currentIntent.budgetCurrency || 'USD',
          currentIntent.urgency || 'standard'
        );
        if (createRes.success && createRes.data) {
          const newIntent = (createRes.data as any).intentSession || createRes.data;
          setCurrentIntent(newIntent);
          res = await api.generatePlan(newIntent.id, tier, mappedReqs);
        }
      }

      if (res.success && res.data) {
        setExecutionPlan(res.data);
        setActiveTier(tier);
        // Map recommendation products to bundle
        const items = res.data.items.map((i) => i.product).filter(Boolean) as Product[];
        if (items.length > 0) {
          setBundleItems(items);
          const newCartItems = items.map((product) => ({ product, quantity: 1 }));
          setCartItems(newCartItems);
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCartItems));
          try {
            await api.syncCart(
              items.map((p) => ({ productId: p.id, quantity: 1 })),
              currentIntent.id
            );
          } catch (syncErr) {
            console.warn('Failed to sync tier bundle to server cart:', syncErr);
          }
        }
      }
    } catch (err) {
      console.error('Plan generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCatalog = async (): Promise<void> => {
    try {
      const prodRes = await api.getProducts();
      if (prodRes.success && prodRes.data) {
        setCatalogProducts(prodRes.data);
        if (bundleItems.length === 0) {
          setBundleItems(prodRes.data.slice(0, 4));
        }
      }
    } catch (err) {
      console.error('Failed to refresh catalog:', err);
    }
  };

  const syncCartToServer = async (): Promise<ShoppingCart | null> => {
    try {
      const items = cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      const cart = await api.syncCart(items, currentIntent?.id);
      return cart;
    } catch {
      return null;
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
        updateIntentBudget,
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
        refreshCatalog,
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
