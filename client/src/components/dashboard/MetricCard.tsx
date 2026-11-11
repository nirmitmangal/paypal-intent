import React from 'react';
import { cn } from '../../lib/utils';

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  subtext?: React.ReactNode;
  trend?: 'positive' | 'negative' | 'neutral';
}

export function MetricCard({
  label,
  value,
  icon,
  badge,
  subtext,
  trend = 'neutral',
  className,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[22px] p-5 border border-slate-200/70 shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex flex-col justify-between transition-all duration-200 text-left',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
          {value}
        </div>
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {badge}
          {subtext && (
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'positive' && 'text-emerald-600',
                trend === 'negative' && 'text-red-600',
                trend === 'neutral' && 'text-slate-500'
              )}
            >
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
