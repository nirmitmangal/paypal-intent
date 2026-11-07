import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
