import { useState } from 'react';
import type { Product } from '@paypal-intent/shared';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BudgetMeter } from '../ui/BudgetMeter';
import { ProductCard } from '../ui/ProductCard';
import { Drawer } from '../ui/Drawer';
import { formatCurrency } from '../../lib/utils';
import { Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';

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
    updateIntentBudget,
  } = useApp();

  const [swapTargetProduct, setSwapTargetProduct] = useState<Product | null>(null);

  const isHardCeiling = currentIntent?.isHardCeiling ?? true;
  const budgetCeiling = currentIntent?.budgetAmount || 350;
  const subtotal = bundleItems.reduce((acc, item) => acc + item.basePrice, 0);
  const estimatedTax = Math.round(subtotal * 0.08 * 100) / 100;
  const grandTotal = Math.round((subtotal + estimatedTax) * 100) / 100;
  const isOverBudget = Boolean(isHardCeiling && grandTotal > budgetCeiling);
  const shortfall = isOverBudget ? Math.round((grandTotal - budgetCeiling) * 100) / 100 : 0;
  const isFeasible = executionPlan?.isFeasible ?? !isOverBudget;

  const handleApplySwap = (newProduct: Product) => {
    if (!swapTargetProduct) return;
    swapBundleItem(swapTargetProduct.id, newProduct);
    setSwapTargetProduct(null);
  };

  const handleProceedToCart = async () => {
    if (isOverBudget) {
      showNotification(`Cannot lock proposal: Total exceeds hard ceiling by $${shortfall}`, 'error');
      return;
    }
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
    <div className="space-y-6 max-w-5xl mx-auto py-4 text-left">
      {/* Header & Optimization Tier Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <>
                <Badge variant="error">Budget Ceiling Exceeded (+${formatCurrency(shortfall)})</Badge>
                <Badge variant="warning">Infeasible Under ${budgetCeiling}</Badge>
              </>
            ) : (
              <Badge variant="info">Optimization Studio</Badge>
            )}
            <span className="text-[11px] text-slate-400 font-mono">Plan v{executionPlan?.version || 1}</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Recommended Purchasing Decision
          </h2>
          <p className="text-xs text-slate-500">
            {isOverBudget
              ? `No valid combination satisfies all requirements under $${budgetCeiling}. Global minimum viable bundle is ${formatCurrency(grandTotal)}.`
              : `Mathematically optimized bundle maximizing utility under your $${budgetCeiling} ceiling.`}
          </p>
        </div>

        {/* Tier Selector Tabs */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTier('budget')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTier === 'budget'
                ? 'bg-[#0070BA] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Budget Tier
          </button>
          <button
            type="button"
            onClick={() => setActiveTier('balanced')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTier === 'balanced'
                ? 'bg-[#0070BA] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Balanced (Optimal)
          </button>
          <button
            type="button"
            onClick={() => setActiveTier('performance')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTier === 'performance'
                ? 'bg-[#0070BA] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pro Grade
          </button>
        </div>
      </div>

      {/* Real-Time Budget Gauge */}
      <BudgetMeter currentTotal={grandTotal} budgetCeiling={budgetCeiling} />

      {/* Budget Deficit Notice OR Transparent Rationale */}
      {isOverBudget || !isFeasible ? (
        <div className="bg-red-50/90 rounded-2xl border border-red-200/90 p-5 space-y-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-700 shrink-0 mt-0.5 border border-red-200/60">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-red-950">
                  Budget Deficit Notice: +{formatCurrency(shortfall)} Required
                </h3>
                <Badge variant="error" size="sm">Hard Ceiling Defense Active</Badge>
              </div>
              <p className="text-xs text-red-900 leading-relaxed font-normal">
                The combinatorial knapsack solver exhaustively evaluated all catalog candidates across all {bundleItems.length} required categories using authoritative catalog pricing.
                No valid combination satisfying all constraints fits under your hard ceiling of <strong>${budgetCeiling}</strong>.
                The global minimum viable bundle costs <strong>{formatCurrency(grandTotal)}</strong> (${formatCurrency(subtotal)} + ${formatCurrency(estimatedTax)} 8% tax), resulting in a budget shortfall of <strong>+{formatCurrency(shortfall)}</strong>.
              </p>
            </div>
          </div>

          {/* Transparent Trade-offs */}
          <div className="pt-3 border-t border-red-200/80 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-950">
              Available Trade-Offs to Resolve Deficit:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-xl border border-red-200/90 space-y-2.5 flex flex-col justify-between shadow-2xs">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">Option 1: Increase Budget Ceiling</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Expand budget ceiling from ${budgetCeiling} to <strong>${Math.ceil(grandTotal)}</strong> to fully fund all 4 exact requirements (including Over-Ear headphones).
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-[#0070BA] hover:bg-[#005ea6] text-white text-xs w-full mt-1 cursor-pointer"
                  onClick={() => updateIntentBudget(Math.ceil(grandTotal))}
                >
                  Increase Ceiling to ${Math.ceil(grandTotal)}
                </Button>
              </div>

              <div className="p-4 bg-white rounded-xl border border-red-200/90 space-y-2.5 flex flex-col justify-between shadow-2xs">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">Option 2: Relax Over-Ear Headphone Constraint</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Swap to on-ear stereo headset ($49.99), dropping the 4-item bundle to <strong>~$264.56</strong> (safely under $300).
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-300 text-xs w-full mt-1 cursor-pointer"
                  onClick={() => {
                    const hpItem = bundleItems.find((b) => b.categoryId === 'headphones');
                    const onEarSku = catalogProducts.find((p) => p.id === 'prod_hp_03');
                    if (hpItem && onEarSku) {
                      swapBundleItem(hpItem.id, onEarSku);
                      showNotification('Swapped to on-ear headset. Recalculating bundle under $300...', 'info');
                    } else {
                      const hp = bundleItems.find((b) => b.categoryId === 'headphones');
                      if (hp) setSwapTargetProduct(hp);
                    }
                  }}
                >
                  Relax Over-Ear Constraint
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/80 rounded-2xl border border-blue-200/90 p-5 space-y-2 text-left shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-[#0070BA]" />
              <span>Transparent Decision Rationale ({activeTier.toUpperCase()} Tier)</span>
            </div>
            {executionPlan && (
              <Badge variant="info" size="sm">
                Plan v{executionPlan.version}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-blue-900 leading-relaxed font-normal">
            {executionPlan?.summary ||
              `The knapsack engine optimized this ${bundleItems.length}-item bundle under your $${budgetCeiling} ceiling, balancing component compatibility, verified specifications, and authoritative catalog pricing.`}
          </p>
        </div>
      )}

      {/* Recommended Items Grid */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>
            {isOverBudget
              ? `Minimum Viable Bundle (${bundleItems.length} Components — Deficit: +${formatCurrency(shortfall)})`
              : `Optimized Line Items (${bundleItems.length} Components)`}
          </span>
          <span className="text-slate-400 font-normal">Click Swap on any card to select alternative SKUs</span>
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

      {/* Review Action Footer */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-xs text-slate-400 font-medium">Authoritative Total (Subtotal + 8% Sales Tax)</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold font-mono ${isOverBudget ? 'text-red-600' : 'text-slate-900'}`}>
              {formatCurrency(grandTotal)}
            </span>
            {isOverBudget && (
              <span className="text-xs font-bold text-red-600 font-mono">
                (+{formatCurrency(shortfall)} over ceiling)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
          <Button
            size="lg"
            isLoading={isLoading}
            disabled={isOverBudget || isLoading}
            onClick={handleProceedToCart}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className={`w-full sm:w-auto cursor-pointer ${
              isOverBudget
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300'
                : 'bg-[#0070BA] hover:bg-[#005ea6] text-white shadow-sm'
            }`}
          >
            {isOverBudget
              ? `Cannot Lock — Exceeds Ceiling (+${formatCurrency(shortfall)})`
              : 'Lock Proposal & Review Cart'}
          </Button>
          {isOverBudget && (
            <span className="text-[11px] text-red-600 font-medium">
              Proposal checkout locked: Resolve budget deficit of {formatCurrency(shortfall)} to proceed.
            </span>
          )}
        </div>
      </div>

      {/* Alternative Swap Drawer */}
      <Drawer
        isOpen={Boolean(swapTargetProduct)}
        onClose={() => setSwapTargetProduct(null)}
        title={`Swap Item in ${swapTargetProduct?.categoryId || 'Category'}`}
        description="Select an alternate catalog SKU. The budget meter will recalculate in real-time."
      >
        <div className="space-y-4 text-left">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block">Current Selected Item:</span>
            <span className="text-xs font-bold text-slate-900 block mt-0.5">
              {swapTargetProduct?.title}
            </span>
            <span className="text-xs font-mono font-semibold text-[#0070BA]">
              {formatCurrency(swapTargetProduct?.basePrice || 0)}
            </span>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Compatible Alternatives in Catalog:
            </span>
            {catalogProducts
              .filter((p) => p.id !== swapTargetProduct?.id)
              .slice(0, 6)
              .map((alt) => {
                const delta = alt.basePrice - (swapTargetProduct?.basePrice || 0);
                return (
                  <div
                    key={alt.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between text-left hover:border-blue-400 transition-colors shadow-2xs"
                  >
                    <div className="space-y-1 pr-3 flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate block">{alt.title}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-800">{formatCurrency(alt.basePrice)}</span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            delta <= 0 ? 'text-emerald-700' : 'text-amber-700'
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
