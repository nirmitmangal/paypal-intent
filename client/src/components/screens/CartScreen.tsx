import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { formatCurrency } from '../../lib/utils';
import { Trash2, ArrowRight, ShieldCheck, ShoppingBag, Plus, Minus, Tag, AlertTriangle } from 'lucide-react';

export function CartScreen() {
  const {
    cartItems,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    syncCartToServer,
    currentIntent,
    updateIntentBudget,
    navigateTo,
    showNotification,
  } = useApp();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const isHardCeiling = currentIntent?.isHardCeiling ?? true;
  const budgetCeiling = currentIntent?.budgetAmount || 350;

  // Calculate totals
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.basePrice * item.quantity, 0);
  const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const estimatedTax = Math.round(discountedSubtotal * 0.08 * 100) / 100;
  const shippingFee = 0.0;
  const grandTotal = Math.round((discountedSubtotal + estimatedTax + shippingFee) * 100) / 100;
  const isOverBudget = Boolean(isHardCeiling && grandTotal > budgetCeiling);
  const shortfall = isOverBudget ? Math.round((grandTotal - budgetCeiling) * 100) / 100 : 0;
  const savings = isOverBudget ? 0 : Math.max(0, Math.round((budgetCeiling - grandTotal) * 100) / 100);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'HACKATHON') {
      setDiscountPercent(10);
      showNotification('Promo code HACKATHON applied! 10% discount added.', 'success');
    } else {
      showNotification('Invalid promotional code. Try "HACKATHON".', 'warning');
    }
  };

  if (cartItems.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="w-8 h-8 text-[#0070BA]" />}
        title="Your Shopping Cart is Empty"
        description="No products are currently staged for checkout. Launch an intention from Home or browse the verified catalog."
        actionText="Browse Product Catalog"
        onAction={() => navigateTo('discovery')}
        className="my-16"
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="info">Checkout Staging</Badge>
            <span className="text-[11px] text-slate-400 font-mono">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Total Units
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Shopping Cart & Staging</h2>
          <p className="text-xs text-slate-500">
            Review line items, reconcile catalog pricing, and verify hard ceiling compliance before PayPal checkout.
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={clearCart} className="text-slate-500 hover:text-red-600">
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Cart Line Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-300/80 shadow-2xs overflow-hidden">
            <CardContent className="p-0 divide-y divide-slate-100">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="p-4 sm:p-5 flex items-center gap-4 text-left hover:bg-slate-50/50 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-400">
                        {product.brand.slice(0, 3)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] font-bold text-[#0070BA] uppercase tracking-wider block">
                      {product.brand}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{product.title}</h4>
                    <span className="text-[11px] font-mono text-slate-400 block">{product.sku}</span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, quantity - 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors cursor-pointer"
                      title="Decrease quantity"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold w-6 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, quantity + 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors cursor-pointer"
                      title="Increase quantity"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono text-slate-900 block">
                      {formatCurrency(product.basePrice * quantity, product.currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      className="text-xs text-red-500 hover:text-red-700 p-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1 mt-0.5"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Promotional Voucher Input */}
          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Have a voucher code? (Try HACKATHON for 10% off)"
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-3 text-xs uppercase text-slate-900 placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:border-[#0070BA] shadow-2xs"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="shrink-0">
              Apply Code
            </Button>
          </form>
        </div>

        {/* Right: Checkout Financials Summary */}
        <div className="space-y-4 text-left">
          <Card className="border-slate-300/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
              <CardTitle className="text-sm font-bold text-slate-900">Financial Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3.5 text-xs p-5">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Hackathon Discount (10%):</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Estimated Sales Tax (Simulated 8.0% Demo Rate):</span>
                <span className="font-mono font-medium">{formatCurrency(estimatedTax)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Standard Delivery:</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Total Due:</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {/* Ceiling Defense Alert */}
              {isOverBudget ? (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-950 text-xs space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-red-900">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>Hard Ceiling Exceeded (+{formatCurrency(shortfall)})</span>
                  </div>
                  <p className="text-[11px] text-red-800 leading-normal font-normal">
                    Cart total of <strong>{formatCurrency(grandTotal)}</strong> exceeds your hard budget limit of <strong>${budgetCeiling}</strong>.
                    Checkout is locked out to guarantee budget adherence.
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white text-xs mt-1 cursor-pointer"
                    onClick={() => updateIntentBudget(Math.ceil(grandTotal))}
                  >
                    Increase Ceiling to ${Math.ceil(grandTotal)}
                  </Button>
                </div>
              ) : savings > 0 ? (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>Safely under your ${budgetCeiling} ceiling ({formatCurrency(savings)} headroom).</span>
                </div>
              ) : null}

              {/* Primary Checkout CTA */}
              <Button
                size="lg"
                disabled={isOverBudget}
                onClick={async () => {
                  if (isOverBudget) {
                    showNotification(`Cannot proceed: Cart exceeds hard ceiling by $${shortfall}`, 'error');
                    return;
                  }
                  await syncCartToServer();
                  navigateTo('payment');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className={`w-full mt-2 cursor-pointer ${
                  isOverBudget
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300'
                    : 'bg-[#0070BA] hover:bg-[#005ea6] text-white shadow-sm'
                }`}
              >
                {isOverBudget
                  ? `Cannot Proceed — Exceeds Ceiling (+${formatCurrency(shortfall)})`
                  : 'Proceed to PayPal'}
              </Button>

              <p className="text-[10px] text-slate-400 text-center leading-normal pt-1">
                Authoritative human approval required via official PayPal Sandbox in the next step.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
