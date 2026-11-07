import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { formatCurrency } from '../../lib/utils';
import { Trash2, ArrowRight, ShieldCheck, ShoppingBag, Plus, Minus, Tag } from 'lucide-react';

export function CartScreen() {
  const {
    cartItems,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    syncCartToServer,
    currentIntent,
    navigateTo,
    showNotification,
  } = useApp();

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  const budgetCeiling = currentIntent?.budgetAmount || 350;

  // Calculate totals
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.basePrice * item.quantity, 0);
  const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const estimatedTax = Math.round(discountedSubtotal * 0.08 * 100) / 100;
  const shippingFee = 0.0;
  const grandTotal = Math.round((discountedSubtotal + estimatedTax + shippingFee) * 100) / 100;
  const savings = Math.max(0, Math.round((budgetCeiling - grandTotal) * 100) / 100);

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
        icon={<ShoppingBag className="w-6 h-6" />}
        title="Your Cart is Empty"
        description="No products are currently in your cart. Launch a goal from Home or browse the catalog."
        actionText="Browse Catalog"
        onAction={() => navigateTo('discovery')}
        className="my-12"
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <div className="flex items-center justify-between text-left">
        <div>
          <Badge variant="info">Review & Stage</Badge>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Shopping Cart Summary</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Units
          </span>
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Clear
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items Table */}
        <div className="lg:col-span-2 space-y-3">
          <Card>
            <CardContent className="p-0 divide-y divide-slate-100">
              {cartItems.map(({ product, quantity }) => (
                <div key={product.id} className="p-4 flex items-center gap-4 text-left">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-400">
                        SKU
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      {product.brand}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 truncate">{product.title}</h4>
                    <span className="text-[11px] font-mono text-slate-400">{product.sku}</span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                    <button
                      onClick={() => updateCartQuantity(product.id, quantity - 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                      title="Decrease"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-xs font-bold w-5 text-center">{quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(product.id, quantity + 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                      title="Increase"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono text-slate-900 block">
                      {formatCurrency(product.basePrice * quantity, product.currency)}
                    </span>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-xs text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Promo Code Input */}
          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Have a promo code? (Try HACKATHON)"
                className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-3 text-xs uppercase text-slate-900 placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Apply Code
            </Button>
          </form>
        </div>

        {/* Right: Checkout Breakdown */}
        <div className="space-y-4 text-left">
          <Card>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-sm">Order Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-4">
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
                <span>Estimated Sales Tax (8.0%):</span>
                <span className="font-mono font-medium">{formatCurrency(estimatedTax)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Standard Shipping:</span>
                <span className="text-emerald-700 font-medium">FREE</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Order Total:</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {savings > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>Safely under your ${budgetCeiling} ceiling with {formatCurrency(savings)} savings.</span>
                </div>
              )}

              <Button
                size="lg"
                onClick={async () => {
                  await syncCartToServer();
                  navigateTo('payment');
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full bg-[#0070BA] hover:bg-[#005ea6] mt-2"
              >
                Proceed to PayPal
              </Button>

              <p className="text-[10px] text-slate-400 text-center leading-normal">
                You will review and authorize payment via PayPal Sandbox in the next step.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
