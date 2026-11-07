import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'paypal';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'neutral', size = 'md', children, ...props }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    paypal: 'bg-amber-50 text-[#003087] border-amber-300 font-bold',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-lg gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border tracking-tight select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
