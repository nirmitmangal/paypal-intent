import { useState, useMemo } from 'react';
import type { Product } from '@paypal-intent/shared';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../ui/ProductCard';
import { ProductDetailModal } from '../ui/ProductDetailModal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { ProductCardSkeleton } from '../ui/LoadingSkeleton';
import { formatCurrency } from '../../lib/utils';
import { Search, ArrowRightLeft } from 'lucide-react';

export function DiscoveryScreen() {
  const {
    catalogProducts,
    cartItems,
    addToCart,
    comparedProducts,
    toggleCompare,
    clearCompare,
    isLoading,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const cartProductIds = useMemo(() => cartItems.map((item) => item.product.id), [cartItems]);

  const categories = [
    { id: 'all', label: 'All Catalog (23)' },
    { id: 'laptops', label: 'Laptops' },
    { id: 'monitors', label: 'Monitors' },
    { id: 'keyboards', label: 'Keyboards' },
    { id: 'mice', label: 'Mice' },
    { id: 'headphones', label: 'Headphones' },
    { id: 'furniture', label: 'Furniture' },
    { id: 'accessories', label: 'Accessories' },
  ];

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    let result = [...catalogProducts];

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [catalogProducts, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
        <div>
          <Badge variant="info">Curated Catalog</Badge>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Product Discovery & Comparison</h2>
          <p className="text-xs text-slate-500">
            Browse verified catalog inventory across 6 commerce domains with specifications and pricing.
          </p>
        </div>

        {/* Comparison Trigger Button */}
        {comparedProducts.length > 0 && (
          <Button
            size="sm"
            onClick={() => setIsCompareModalOpen(true)}
            leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            className="bg-[#0070BA] animate-bounce"
          >
            Compare ({comparedProducts.length}) Items
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search by title, brand, or specification (e.g., dynamic, 40mm, VESA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-lg py-2 px-2.5 text-xs font-semibold text-slate-800"
            >
              <option value="featured">Featured / Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm">No products matched your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={(e) => {
                // If not clicking button, open detail modal
                if ((e.target as HTMLElement).closest('button')) return;
                setDetailProduct(prod);
              }}
              className="cursor-pointer"
            >
              <ProductCard
                product={prod}
                isSelected={cartProductIds.includes(prod.id)}
                onSelect={() => addToCart(prod, 1)}
                onCompareToggle={() => toggleCompare(prod)}
                isCompared={comparedProducts.some((p) => p.id === prod.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(p) => addToCart(p, 1)}
        onToggleCompare={(p) => toggleCompare(p)}
        isCompared={detailProduct ? comparedProducts.some((p) => p.id === detailProduct.id) : false}
        isInCart={detailProduct ? cartProductIds.includes(detailProduct.id) : false}
      />

      {/* Comparison Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Side-by-Side Product Comparison"
        description="Evaluate technical specifications, pricing, and suitability across candidate items."
        maxWidth="2xl"
      >
        <div className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {comparedProducts.map((p) => (
              <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{p.brand}</span>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{p.title}</h4>
                <div className="font-mono text-base font-bold text-slate-900">
                  {formatCurrency(p.basePrice, p.currency)}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">SKU:</span>
                    <span className="font-mono font-medium">{p.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rating:</span>
                    <span className="font-semibold text-amber-600">★ {p.rating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reviews:</span>
                    <span>{p.reviewCount}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={cartProductIds.includes(p.id) ? 'secondary' : 'primary'}
                  className="w-full text-xs"
                  onClick={() => {
                    addToCart(p, 1);
                    setIsCompareModalOpen(false);
                  }}
                >
                  {cartProductIds.includes(p.id) ? 'Already in Cart' : 'Select for Cart'}
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearCompare}>
              Clear Comparison
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
