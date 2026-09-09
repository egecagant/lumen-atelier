import React, { useState, useMemo, useEffect } from 'react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { 
  Sparkles, 
  Search, 
  Plus, 
  PackageSearch, 
  Mail, 
  Check, 
  ArrowUpDown,
  Grid,
  ChevronDown,
  Layers
} from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onOpenQuickView: (product: Product) => void;
  onOpenAdminProductCreate?: () => void;
  onOpenAdminDemoData?: () => void;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenQuickView,
  onOpenAdminProductCreate,
  onOpenAdminDemoData,
  isAdmin,
  isLoading = false,
}) => {
  const { settings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Active Category info
  const currentCategoryObj = categories.find(c => c.id === selectedCategory);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, searchQuery, onlyInStock, sortBy]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory && p.categoryId !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchMat = p.material?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchMat) return false;
      }
      // In stock filter
      if (onlyInStock && (p.stockStatus === 'out_of_stock' || (typeof p.stockQuantity === 'number' && p.stockQuantity <= 0))) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [products, selectedCategory, searchQuery, onlyInStock, sortBy]);

  // Sliced products for 12 per page pagination
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const hasMore = filteredProducts.length > visibleCount;
  const remainingCount = filteredProducts.length - visibleCount;
  const nextBatchCount = Math.min(12, remainingCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitted(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 4000);
  };

  const sectionTitle = selectedCategory
    ? (currentCategoryObj?.name || 'Koleksiyon')
    : (settings.productSectionTitle || 'Tüm Ürünler');

  const sectionBadge = selectedCategory
    ? 'Kategori Koleksiyonu'
    : (settings.productSectionBadge || 'Lüks Aydınlatma Koleksiyonu');

  const sectionDesc = selectedCategory
    ? (currentCategoryObj?.description || 'Bu kategorideki özel heykelsi el yapımı aydınlatma tasarımları.')
    : (settings.productSectionDescription || 'Yaşam alanlarınız için özenle tasarlanan modern ve heykelsi aydınlatma armatürleri.');

  return (
    <section id="koleksiyon" className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-10 scroll-mt-24">
      {/* Filter & Sort Glass Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="product-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={settings.productSearchInputPlaceholder || 'Lamba veya materyal ara (pirinç, cam)...'}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort & In-Stock filter */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-4">
          <label className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded border-zinc-700 bg-black/50 text-[#C5A059] focus:ring-0"
            />
            <span>{settings.productStockFilterText || 'Yalnızca Stokta'}</span>
          </label>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#C5A059]" />
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded-xl text-[11px] sm:text-xs text-zinc-200 py-2 sm:py-2.5 px-2.5 sm:px-3.5 focus:outline-none focus:border-[#C5A059]"
            >
              <option value="newest">En Yeniler</option>
              <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid or EMPTY STATE */}
      {isLoading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5 lg:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="rounded-2xl bg-[#0D0D11] border border-white/5 overflow-hidden animate-pulse">
              <div className="aspect-square bg-white/5" />
              <div className="p-4 space-y-2.5">
                <div className="h-3 bg-white/5 rounded w-1/3" />
                <div className="h-4 bg-white/10 rounded w-4/5" />
                <div className="h-5 bg-white/10 rounded w-1/2 pt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5 lg:gap-6">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenQuickView={onOpenQuickView}
              />
            ))}
          </div>

          {/* Load More Pagination (Her 12 tanede 1 Daha Fazla Yükle) */}
          {hasMore ? (
            <div className="mt-10 sm:mt-14 flex flex-col items-center justify-center space-y-4">
              {/* Progress info */}
              <div className="text-center space-y-1.5">
                <span className="text-xs text-zinc-400 font-light">
                  <strong className="text-zinc-200 font-medium">{visibleProducts.length}</strong> / {filteredProducts.length} ürün gösteriliyor
                </span>
                <div className="w-48 sm:w-64 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
                  <div 
                    className="h-full bg-gradient-to-r from-[#C5A059] to-[#dfbf79] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.round((visibleProducts.length / filteredProducts.length) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Load More Button */}
              <button
                id="load-more-products-btn"
                onClick={handleLoadMore}
                className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#C5A059] via-[#d6b26b] to-[#C5A059] hover:from-[#d6b26b] hover:to-[#C5A059] text-black font-semibold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#C5A059]/20 hover:shadow-[#C5A059]/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <span>Daha Fazla Yükle (+{nextBatchCount} Ürün)</span>
                <ChevronDown className="w-4 h-4 text-black group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          ) : filteredProducts.length > 12 ? (
            <div className="mt-10 sm:mt-12 text-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400">
                <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Tüm ürünler görüntülendi ({filteredProducts.length} ürün)</span>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        /* Empty State Bento Glass Box */
        <div className="relative overflow-hidden rounded-3xl bento-card p-10 sm:p-16 text-center">
          {/* Subtle Ambient Glow Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C5A059]/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-lg mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-black/60 border border-[#C5A059]/40 flex items-center justify-center mx-auto text-[#C5A059] shadow-xl">
              <PackageSearch className="w-8 h-8 opacity-90 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#C5A059] font-medium">
                {currentCategoryObj ? `${currentCategoryObj.name} Kategorisi` : (settings.brandName || 'LUMEN ATELIER')}
              </span>
              <h3 className="font-serif-luxury text-3xl sm:text-4xl text-white tracking-tight">
                {settings.productEmptyStateTitle || 'Yeni Koleksiyon Yakında'}
              </h3>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                {selectedCategory
                  ? `"${currentCategoryObj?.name}" kategorisindeki el yapımı tasarım lambalar atölyemizde özenle şekilleniyor. Çok yakında burada sergilenecektir.`
                  : searchQuery
                  ? `"${searchQuery}" aramasıyla eşleşen lamba bulunamadı. Lütfen filtrelerinizi sıfırlayın.`
                  : (settings.productEmptyStateDesc || 'Atölyemiz lüks tasarım aydınlatma koleksiyonları üzerinde titizlikle çalışıyor. Ürünler hazırlandıkça vitrinde yerini alacaktır.')}
              </p>
            </div>

            {/* Newsletter Subscribe to be notified */}
            <div className="pt-3">
              {newsletterSubmitted ? (
                <div className="p-3.5 bg-emerald-950/70 border border-emerald-700 text-emerald-300 text-xs rounded-xl inline-flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Teşekkürler! Yeni lüks lamba serisi yayınlandığında ilk siz haberdar olacaksınız.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex max-w-md mx-auto gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={settings.productEmptyNewsletterPlaceholder || 'E-posta adresinizi bırakın (İlk siz öğrenin)'}
                    className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{settings.productEmptyNewsletterBtnText || 'Haber Ver'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Admin Management Shortcuts if Admin */}
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
                {onOpenAdminProductCreate && (
                  <button
                    id="admin-empty-add-product-btn"
                    onClick={onOpenAdminProductCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" /> İlk Ürünü Ekle
                  </button>
                )}
                {onOpenAdminDemoData && products.length === 0 && (
                  <button
                    id="admin-empty-seed-btn"
                    onClick={onOpenAdminDemoData}
                    className="inline-flex items-center gap-2 px-4 py-2.5 glass-panel text-[#C5A059] text-xs font-medium uppercase tracking-wider rounded-xl border border-[#C5A059]/40 hover:border-[#C5A059] transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Örnek Koleksiyonu Yükle
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

