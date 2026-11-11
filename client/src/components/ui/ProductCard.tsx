import React from 'react';
import type { Product } from '@paypal-intent/shared';
import { formatCurrency, cn } from '../../lib/utils';
import { Star, Check, RefreshCw, Lock, Unlock, ArrowRightLeft } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

export interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  isLocked?: boolean;
  onSelect?: (product: Product) => void;
  onSwap?: (product: Product) => void;
  onToggleLock?: (product: Product) => void;
  onCompareToggle?: (product: Product) => void;
  isCompared?: boolean;
  selectionReason?: string;
  className?: string;
}

export function ProductCard({
  product,
  isSelected = false,
  isLocked = false,
  onSelect,
  onSwap,
  onToggleLock,
  onCompareToggle,
  isCompared = false,
  selectionReason,
  className,
}: ProductCardProps) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col',
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow',
        className
      )}
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-100">
        {!imgError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-400 bg-slate-50">
            <span className="text-2xl font-bold uppercase tracking-wider text-slate-300">
              {product.brand.slice(0, 3)}
            </span>
            <span className="text-xs text-slate-400 mt-1">{product.categoryId}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge variant="neutral" size="sm" className="bg-white/90 backdrop-blur shadow-xs">
            {product.brand}
          </Badge>
          {isSelected && (
            <Badge variant="info" size="sm" className="bg-blue-600 text-white border-blue-600">
              <Check className="w-3 h-3" /> Selected
            </Badge>
          )}
        </div>

        {/* Top Right Action: Lock status */}
        {onToggleLock && isSelected && (
          <button
            onClick={() => onToggleLock(product)}
            className={cn(
              'absolute top-2.5 right-2.5 p-1.5 rounded-lg backdrop-blur transition-all cursor-pointer focus-ring',
              isLocked
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white/80 text-slate-600 hover:bg-white'
            )}
            title={isLocked ? 'Item Locked (pinned to plan)' : 'Lock Item'}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">{product.sku}</span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
              <span className="text-slate-400">({product.reviewCount})</span>
            </div>
          </div>
          <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.title}
          </h4>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* AI Selection Rationale if present */}
          {selectionReason && (
            <div className="mt-2 p-2 bg-blue-50/70 rounded-lg border border-blue-100 text-[11px] text-blue-900 leading-normal">
              <span className="font-semibold text-blue-800">AI Choice: </span>
              {selectionReason}
            </div>
          )}
        </div>

        {/* Footer: Price & Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-normal">Price</span>
            <span className="text-lg font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(product.basePrice, product.currency)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onCompareToggle && (
              <Button
                variant={isCompared ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onCompareToggle(product)}
                title="Compare with other products"
                className="px-2"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </Button>
            )}

            {onSwap && isSelected ? (
              <Button variant="outline" size="sm" onClick={() => onSwap(product)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                <span>Swap</span>
              </Button>
            ) : onSelect ? (
              <Button
                variant={isSelected ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onSelect(product)}
              >
                {isSelected ? 'In Cart' : 'Select'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
