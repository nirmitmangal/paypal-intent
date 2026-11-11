import { useState, useMemo, useEffect } from 'react';
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
import { Search, ArrowRightLeft, PackageSearch } from 'lucide-react';

export function DiscoveryScreen() {
  const {
    catalogProducts,
    refreshCatalog,
    cartItems,
    addToCart,
    comparedProducts,
    toggleCompare,
    clearCompare,
    isLoading,
  } = useApp();

  useEffect(() => {
    if (catalogProducts.length === 0) {
      refreshCatalog();
    }
  }, [catalogProducts.length, refreshCatalog]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const cartProductIds = useMemo(() => cartItems.map((item) => item.product.id), [cartItems]);

  const categories = [
    { id: 'all', label: 'All Catalog' },
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
    <div className="space-y-6 max-w-6xl mx-auto py-4 text-left">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="info">Curated Catalog</Badge>
            <span className="text-[11px] text-slate-400 font-mono">{catalogProducts.length} Verified SKUs</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Product Discovery & Catalog</h2>
          <p className="text-xs text-slate-500">
            Browse verified catalog inventory across 7 commerce categories with specifications and authoritative pricing.
          </p>
        </div>

        {/* Comparison Trigger Button */}
        {comparedProducts.length > 0 && (
          <Button
            size="sm"
            onClick={() => setIsCompareModalOpen(true)}
            leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            className="bg-[#0070BA] text-white shadow-sm hover:shadow cursor-pointer"
          >
            Compare ({comparedProducts.length}) Items
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <Input
              placeholder="Search by product title, brand, or specification (e.g., dynamic, 4K, ergonomic)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0070BA] cursor-pointer"
            >
              <option value="featured">Featured / Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-50 text-[#0070BA] border border-blue-200/80 shadow-2xs font-bold'
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
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
          <PackageSearch className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No matching products found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Try adjusting your search terms or select "All Catalog" to view available items.
          </p>
          <Button size="sm" variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={(e) => {
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
              <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0070BA]">{p.brand}</span>
                <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{p.title}</h4>
                <div className="font-mono text-base font-bold text-slate-900">
                  {formatCurrency(p.basePrice, p.currency)}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">SKU:</span>
                    <span className="font-mono font-medium text-slate-700">{p.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rating:</span>
                    <span className="font-semibold text-amber-600">★ {p.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reviews:</span>
                    <span className="text-slate-600">{p.reviewCount}</span>
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
