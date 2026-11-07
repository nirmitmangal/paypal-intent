import { cn } from '../../lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'bg-red-50/50 rounded-2xl border border-red-200/80 p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-3 max-w-md mx-auto',
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-red-900">{title}</h4>
        <p className="text-xs text-red-700 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="bg-white border-red-200 text-red-700 hover:bg-red-50">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
