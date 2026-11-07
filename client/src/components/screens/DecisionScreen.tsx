import { useState } from 'react';
import type { Product } from '@paypal-intent/shared';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BudgetMeter } from '../ui/BudgetMeter';
import { ProductCard } from '../ui/ProductCard';
import { Drawer } from '../ui/Drawer';
import { formatCurrency } from '../../lib/utils';
import { Sparkles, ArrowRight } from 'lucide-react';

export function DecisionScreen() {
  const {
    currentIntent,
    activeTier,
    setActiveTier,
    executionPlan,
    bundleItems,
    swapBundleItem,
    lockedProductIds,
    toggleLock,
    catalogProducts,
    addToCart,
    clearCart,
    syncCartToServer,
    isLoading,
    navigateTo,
    showNotification,
  } = useApp();

  const [swapTargetProduct, setSwapTargetProduct] = useState<Product | null>(null);

  const budgetCeiling = currentIntent?.budgetAmount || 350;
  const subtotal = bundleItems.reduce((acc, item) => acc + item.basePrice, 0);
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
  const grandTotal = Math.round((subtotal + estimatedTax) * 100) / 100;

  const handleApplySwap = (newProduct: Product) => {
    if (!swapTargetProduct) return;
    swapBundleItem(swapTargetProduct.id, newProduct);
    setSwapTargetProduct(null);
  };

  const handleProceedToCart = async () => {
    // Clear and add all bundle items to cart
    clearCart();
    for (const item of bundleItems) {
      addToCart(item, 1);
    }
    await syncCartToServer();
    showNotification('Bundle locked and synced to cart!', 'success');
    navigateTo('cart');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Header & Tier Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
        <div>
          <Badge variant="info">Optimization Studio</Badge>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Recommended Purchasing Decision</h2>
          <p className="text-xs text-slate-500">
            Mathematically optimized combination maximizing utility under your ${budgetCeiling} ceiling.
          </p>
        </div>

        {/* Tier Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTier('budget')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTier === 'budget' ? 'bg-[#0070BA] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Budget Tier
          </button>
          <button
            onClick={() => setActiveTier('balanced')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTier === 'balanced' ? 'bg-[#0070BA] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Balanced (Optimal)
          </button>
          <button
            onClick={() => setActiveTier('performance')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTier === 'performance' ? 'bg-[#0070BA] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pro Grade
          </button>
        </div>
      </div>

      {/* Real-Time Budget Gauge */}
      <BudgetMeter currentTotal={grandTotal} budgetCeiling={budgetCeiling} />

      {/* Transparent AI Decision Explainer Banner */}
      <div className="bg-blue-50/80 rounded-2xl border border-blue-200/90 p-5 space-y-2 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-[#0070BA]" />
            <span>Transparent Decision Rationale ({activeTier.toUpperCase()} Tier)</span>
          </div>
          {executionPlan && (
            <Badge variant="info" size="sm">
              Plan v{executionPlan.version}
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm text-blue-900/90 leading-relaxed">
          {executionPlan?.summary ||
            `The knapsack engine optimized this ${bundleItems.length}-item bundle under your $${budgetCeiling} ceiling, balancing component compatibility, verified specifications, and authoritative catalog pricing.`}
        </p>
      </div>

      {/* Recommended Items Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
          <span>Optimized Line Items ({bundleItems.length} Components)</span>
          <span className="text-slate-400">Click Swap to adjust individual items</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bundleItems.map((product) => {
            const planItem = executionPlan?.items?.find((i) => i.productId === product.id);
            const selectionReason =
              planItem?.selectionReason ||
              `Evaluated for ${product.categoryId} requirements with high utility-to-cost ratio.`;
            return (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={true}
                isLocked={lockedProductIds.includes(product.id)}
                onToggleLock={() => toggleLock(product.id)}
                onSwap={() => setSwapTargetProduct(product)}
                selectionReason={selectionReason}
              />
            );
          })}
        </div>
      </div>

      {/* Footer / Review Action */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left space-y-0.5">
          <span className="text-xs text-slate-400">Estimated Total (Subtotal + 8% Tax)</span>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatCurrency(grandTotal)}
          </div>
        </div>

        <Button
          size="lg"
          isLoading={isLoading}
          onClick={handleProceedToCart}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="bg-[#0070BA] hover:bg-[#005ea6] w-full sm:w-auto"
        >
          Lock Proposal & Review Cart
        </Button>
      </div>

      {/* Alternative Swap Drawer */}
      <Drawer
        isOpen={Boolean(swapTargetProduct)}
        onClose={() => setSwapTargetProduct(null)}
        title={`Swap Item in ${swapTargetProduct?.categoryId || 'Category'}`}
        description="Select an alternate catalog SKU. The budget meter will recalculate in real-time."
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-slate-500">
            Current: <strong>{swapTargetProduct?.title}</strong> ({formatCurrency(swapTargetProduct?.basePrice || 0)})
          </p>

          <div className="space-y-3">
            {catalogProducts
              .filter((p) => p.id !== swapTargetProduct?.id)
              .slice(0, 5)
              .map((alt) => {
                const delta = alt.basePrice - (swapTargetProduct?.basePrice || 0);
                return (
                  <div
                    key={alt.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-left hover:border-blue-400 transition-colors"
                  >
                    <div className="space-y-1 pr-3">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">{alt.title}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold">{formatCurrency(alt.basePrice)}</span>
                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            delta <= 0 ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {delta > 0 ? `+${formatCurrency(delta)}` : formatCurrency(delta)}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleApplySwap(alt)}>
                      Swap
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
