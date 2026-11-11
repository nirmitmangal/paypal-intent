import React from 'react';
import { cn } from '../../lib/utils';

export interface DashboardCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function DashboardCard({
  title,
  subtitle,
  badge,
  action,
  headerClassName,
  bodyClassName,
  footer,
  children,
  className,
  ...props
}: DashboardCardProps) {
  const hasHeader = Boolean(title || subtitle || badge || action);

  return (
    <div
      className={cn(
        'bg-white rounded-[24px] border border-slate-200/70 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition-all duration-200 flex flex-col overflow-hidden',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            'px-6 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-slate-100/80',
            headerClassName
          )}
        >
          <div className="space-y-0.5 text-left min-w-0">
            <div className="flex items-center gap-2">
              {typeof title === 'string' ? (
                <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium leading-relaxed truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={cn('p-6 flex-1 flex flex-col', bodyClassName)}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
