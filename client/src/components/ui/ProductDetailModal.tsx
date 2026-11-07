import { useState } from 'react';
import type { Product } from '@paypal-intent/shared';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { formatCurrency } from '../../lib/utils';
import { Star, CheckCircle2, ShieldCheck, ShoppingBag, ArrowRightLeft } from 'lucide-react';

export interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  onToggleCompare?: (product: Product) => void;
  isCompared?: boolean;
  isInCart?: boolean;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleCompare,
  isCompared = false,
  isInCart = false,
}: ProductDetailModalProps) {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.title}
      description={`${product.brand} • SKU: ${product.sku}`}
      maxWidth="xl"
    >
      <div className="space-y-6 text-left">
        {/* Top Product Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
            {!imgError && product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <span className="text-3xl font-bold uppercase">{product.brand.slice(0, 3)}</span>
                <span className="text-xs mt-1">{product.categoryId}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="info">{product.brand}</Badge>
                <Badge variant="neutral">{product.categoryId}</Badge>
                {product.inStock && (
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3" /> In Stock
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-amber-500 text-sm">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-slate-800">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400 text-xs">({product.reviewCount} verified reviews)</span>
              </div>

              <div className="pt-2">
                <span className="text-xs text-slate-400 block font-normal">Catalog Price</span>
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {formatCurrency(product.basePrice, product.currency)}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              {onAddToCart && (
                <Button
                  variant={isInCart ? 'secondary' : 'primary'}
                  className="flex-1"
                  onClick={() => {
                    onAddToCart(product);
                    onClose();
                  }}
                  leftIcon={<ShoppingBag className="w-4 h-4" />}
                >
                  {isInCart ? 'Already in Cart' : 'Add to Cart'}
                </Button>
              )}

              {onToggleCompare && (
                <Button
                  variant={isCompared ? 'primary' : 'outline'}
                  onClick={() => onToggleCompare(product)}
                  title="Compare"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Technical Specification & Overview
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {product.description}
          </p>
        </div>

        {/* Compatibility & Specs Matrix */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Cross-Item Compatibility Verification
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between">
              <span className="text-slate-500">Form Factor / Mount:</span>
              <span className="font-semibold text-slate-800">Standard Desk Clamp / VESA</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between">
              <span className="text-slate-500">Electrical / Signal:</span>
              <span className="font-semibold text-slate-800">USB-C / 5V DC Standard</span>
            </div>
          </div>
        </div>

        {/* Trust Notice */}
        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 flex items-center gap-2 text-xs text-blue-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
          <span>Verified catalog SKU eligible for multi-item knapsack budget optimization.</span>
        </div>
      </div>
    </Modal>
  );
}
