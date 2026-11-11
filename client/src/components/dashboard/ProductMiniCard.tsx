import { useState } from 'react';
import type { Product } from '@paypal-intent/shared';
import { formatCurrency, cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Lock, Unlock, RefreshCw, Star } from 'lucide-react';

export interface ProductMiniCardProps {
  product: Product;
  isLocked?: boolean;
  onToggleLock?: (product: Product) => void;
  onSwap?: (product: Product) => void;
  onClick?: () => void;
  className?: string;
}

export function ProductMiniCard({
  product,
  isLocked = false,
  onToggleLock,
  onSwap,
  onClick,
  className,
}: ProductMiniCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-left',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Image Thumbnail */}
        <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/60 shrink-0 relative flex items-center justify-center">
          {!imgError && product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="text-xs font-bold text-slate-400 uppercase">
              {product.brand.slice(0, 3)}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="neutral" size="sm" className="text-[10px] py-0 px-1.5">
              {product.categoryId}
            </Badge>
            <span className="text-[10px] font-mono text-slate-400 truncate">
              {product.sku}
            </span>
          </div>
          <h4 className="text-xs font-bold text-slate-900 truncate leading-snug">
            {product.title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">{product.brand}</span>
            <span>•</span>
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-medium text-slate-600">{product.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Price & Actions */}
      <div className="text-right shrink-0 space-y-1">
        <div className="text-sm font-bold font-mono text-slate-900">
          {formatCurrency(product.basePrice, product.currency)}
        </div>

        <div className="flex items-center justify-end gap-1">
          {onToggleLock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(product);
              }}
              title={isLocked ? 'Pinned to plan' : 'Pin item'}
              className={cn(
                'p-1.5 rounded-lg border transition-all cursor-pointer focus-ring',
                isLocked
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-slate-50 text-slate-400 hover:text-slate-700 border-slate-200'
              )}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          )}

          {onSwap && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwap(product);
              }}
              title="Swap for alternative product"
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer focus-ring"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
