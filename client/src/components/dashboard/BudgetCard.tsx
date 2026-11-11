import { formatCurrency, cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export interface BudgetCardProps {
  subtotal: number;
  tax: number;
  total: number;
  budgetCeiling: number;
  currency?: string;
  isHardCeiling?: boolean;
  onProceedToCart?: () => void;
  className?: string;
}

export function BudgetCard({
  subtotal,
  tax,
  total,
  budgetCeiling,
  currency = 'USD',
  isHardCeiling = true,
  onProceedToCart,
  className,
}: BudgetCardProps) {
  const percentage = budgetCeiling > 0 ? Math.min(Math.round((total / budgetCeiling) * 100), 150) : 0;
  const isOverBudget = isHardCeiling && total > budgetCeiling;
  const headroom = Math.round((budgetCeiling - total) * 100) / 100;
  const shortfall = Math.round((total - budgetCeiling) * 100) / 100;

  return (
    <div
      className={cn(
        'bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex flex-col justify-between text-left space-y-5',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Financial Balance
          </span>
          <h3 className="font-bold text-lg text-slate-900 mt-0.5">Budget Allocation</h3>
        </div>
        <Badge variant={isOverBudget ? 'error' : percentage > 90 ? 'warning' : 'success'}>
          {isOverBudget ? 'Exceeded' : `${percentage}% Used`}
        </Badge>
      </div>

      {/* Big Total & Cushion */}
      <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-100 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500 font-medium">Estimated Net Total:</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
            {formatCurrency(total, currency)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isOverBudget
                  ? 'bg-red-500'
                  : percentage > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-0.5">
            <span>$0.00</span>
            <span>Target: {formatCurrency(budgetCeiling, currency)}</span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="pt-1 flex items-center justify-between text-xs">
          {isOverBudget ? (
            <div className="flex items-center gap-1.5 text-red-600 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Over budget by {formatCurrency(shortfall, currency)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cushion remaining: {formatCurrency(headroom, currency)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Snapshot */}
      <div className="space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
        <div className="flex justify-between">
          <span>Catalog Items Subtotal:</span>
          <span className="font-mono font-medium text-slate-800">{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Sales Tax (8%):</span>
          <span className="font-mono font-medium text-slate-800">{formatCurrency(tax, currency)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-100">
          <span>Hard Ceiling Limit:</span>
          <span className="font-mono">{formatCurrency(budgetCeiling, currency)}</span>
        </div>
      </div>

      {/* Action */}
      {onProceedToCart && (
        <Button
          onClick={onProceedToCart}
          className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white py-2.5 rounded-xl cursor-pointer"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          disabled={isOverBudget}
        >
          {isOverBudget ? 'Adjust Plan to Continue' : 'Review Cart & Checkout'}
        </Button>
      )}
    </div>
  );
}
