import type { TransactionRecord } from '@paypal-intent/shared';
import { formatCurrency, cn } from '../../lib/utils';
import { TransactionStatusBadge } from '../ui/TransactionStatusBadge';
import { ArrowUpRight, CheckCircle2, ShoppingBag, Sparkles } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'intent' | 'optimize' | 'cart' | 'payment';
  title: string;
  timestamp: string | Date;
  status?: string;
  amount?: number;
  currency?: string;
}

export interface ActivityTableProps {
  transactions?: TransactionRecord[];
  customActivities?: ActivityItem[];
  onSelectTransaction?: (tx: TransactionRecord) => void;
  className?: string;
}

export function ActivityTable({
  transactions = [],
  customActivities,
  onSelectTransaction,
  className,
}: ActivityTableProps) {
  // If transactions exist, map them to activity items or combine with mock/real events
  const items: ActivityItem[] = customActivities || [
    ...transactions.map((tx) => ({
      id: tx.id,
      type: 'payment' as const,
      title: tx.intentSummary || 'PayPal Sandbox Order Captured',
      timestamp: tx.createdAt,
      status: tx.status,
      amount: tx.grossAmount,
      currency: tx.currency,
    })),
    {
      id: 'act_1',
      type: 'optimize' as const,
      title: 'Knapsack Optimizer Rebalanced 4 Categories',
      timestamp: new Date(Date.now() - 1000 * 60 * 12),
      status: 'OPTIMIZED',
      amount: 292.36,
      currency: 'USD',
    },
    {
      id: 'act_2',
      type: 'intent' as const,
      title: 'Intent Initialized: Study Desk Setup',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      status: 'PLAN_ACTIVE',
    },
  ].slice(0, 5);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'payment':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'optimize':
        return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
      case 'cart':
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className={cn('overflow-x-auto text-left', className)}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
            <th className="pb-2.5 font-semibold text-left">Activity / Event</th>
            <th className="pb-2.5 font-semibold text-left">Status</th>
            <th className="pb-2.5 font-semibold text-right">Amount</th>
            <th className="pb-2.5 font-semibold text-right">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => {
                const foundTx = transactions.find((t) => t.id === item.id);
                if (foundTx && onSelectTransaction) onSelectTransaction(foundTx);
              }}
              className={cn(
                'group hover:bg-slate-50/70 transition-colors',
                onSelectTransaction && item.type === 'payment' && 'cursor-pointer'
              )}
            >
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-[260px]">
                    {item.title}
                  </span>
                </div>
              </td>
              <td className="py-3 px-2">
                {item.type === 'payment' && item.status ? (
                  <TransactionStatusBadge status={item.status as any} />
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {item.status || 'LOGGED'}
                  </span>
                )}
              </td>
              <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                {item.amount !== undefined ? formatCurrency(item.amount, item.currency) : '—'}
              </td>
              <td className="py-3 pl-3 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
