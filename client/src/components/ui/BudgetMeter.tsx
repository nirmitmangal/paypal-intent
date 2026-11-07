import { formatCurrency, cn } from '../../lib/utils';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export interface BudgetMeterProps {
  currentTotal: number;
  budgetCeiling: number;
  currency?: string;
  className?: string;
}

export function BudgetMeter({
  currentTotal,
  budgetCeiling,
  currency = 'USD',
  className,
}: BudgetMeterProps) {
  const percentage = Math.min(100, Math.round((currentTotal / budgetCeiling) * 100));
  const isOverBudget = currentTotal > budgetCeiling;
  const remaining = Math.round((budgetCeiling - currentTotal) * 100) / 100;

  // State color mapping
  const getBarColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 95) return 'bg-[#003087]'; // Deep navy - near perfect optimization
    if (percentage >= 80) return 'bg-[#0070BA]'; // Primary blue
    return 'bg-emerald-500'; // Green - plenty of headroom
  };

  return (
    <div className={cn('bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3', className)}>
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          {isOverBudget ? (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          )}
          <span className="font-semibold text-slate-800">Budget Optimization Meter</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="font-bold text-slate-900">{formatCurrency(currentTotal, currency)}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500">{formatCurrency(budgetCeiling, currency)}</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
        <div
          className={cn('h-full rounded-full transition-all duration-300', getBarColor())}
          style={{ width: `${isOverBudget ? 100 : percentage}%` }}
        />
      </div>

      {/* Headroom / Summary Line */}
      <div className="flex items-center justify-between text-xs pt-0.5">
        <span className="text-slate-500">
          {percentage}% utilized across selected items
        </span>
        <span
          className={cn(
            'font-medium font-mono',
            isOverBudget ? 'text-red-600 font-bold' : 'text-emerald-700'
          )}
        >
          {isOverBudget
            ? `Over ceiling by ${formatCurrency(Math.abs(remaining), currency)}`
            : `${formatCurrency(remaining, currency)} headroom remaining`}
        </span>
      </div>
    </div>
  );
}
