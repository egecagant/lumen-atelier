import React, { useState } from 'react';
import { Category, Product } from '../types';
import { Sparkles, ArrowUpRight, Plus, ChevronDown } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface CategoryGridProps {
  categories: Category[];
  products: Product[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onOpenAdminCategories?: () => void;
  isAdmin?: boolean;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  products,
  selectedCategory,
  onSelectCategory,
  onOpenAdminCategories,
  isAdmin,
}) => {
  const { settings } = useSiteSettings();
  const [showAllMobile, setShowAllMobile] = useState(false);

  if (categories.length === 0) {
    return (
      <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="text-center py-12 px-6 rounded-2xl bento-card border border-dashed border-white/10">
          <Sparkles className="w-8 h-8 text-[#C5A059] mx-auto mb-3 opacity-80 animate-pulse" />
          <h3 className="font-serif-luxury text-2xl text-zinc-100">Kategoriler Hazırlanıyor</h3>
          <p className="text-zinc-400 text-sm max-w-md mx-auto mt-2 mb-6 font-light">
            Henüz kategori tanımlanmadı. Lüks lamba koleksiyonunuz için bento kategorileri admin panelinden ekleyebilirsiniz.
          </p>
          {isAdmin && onOpenAdminCategories && (
            <button
              onClick={onOpenAdminCategories}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Kategori Ekle
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-16">
      {/* Bento Grid Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-10 gap-2 sm:gap-4">
        <div>
          <h2 className="font-serif-luxury text-xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            {settings.categorySectionTitle || 'Kategoriye Göre Keşfedin'}
          </h2>
        </div>
        <p className="text-xs text-zinc-400 max-w-md font-light leading-relaxed hidden sm:block">
          {settings.categorySectionDescription || 'Yaşam alanlarınıza sıcaklık ve heykelsi bir estetik katmak için hazırlanan seçkin lamba grupları.'}
        </p>
      </div>

      {/* Bento Grid layout for categories (compact 2-cols on mobile, 4-cols on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5 auto-rows-[120px] sm:auto-rows-[280px]">
        {categories.map((cat, idx) => {
          const count = products.filter(p => p.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          // Create asymmetric bento tile rhythm if 3 or more categories on desktop
          const isFeatured = categories.length >= 3 && (idx === 0 || idx === 3);
          const isHiddenOnMobile = idx >= 4 && !showAllMobile;

          return (
            <div
              key={cat.id}
              id={`cat-card-${cat.id}`}
              onClick={() => {
                onSelectCategory(cat.id);
                const el = document.getElementById('koleksiyon');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 flex flex-col justify-end items-start text-left p-2 sm:p-3.5 ${
                isHiddenOnMobile ? 'hidden sm:flex' : 'flex'
              } ${
                isFeatured && categories.length > 2 ? 'sm:col-span-2' : 'col-span-1'
              } ${
                isSelected 
                  ? 'border-white/40 ring-1 ring-white/30 shadow-lg' 
                  : 'border-white/10 sm:hover:border-white/25 active:scale-[0.98]'
              }`}
            >
              {/* Background Image (Reduced dark filter by 50% for brighter, clear visuals) */}
              <img
                src={cat.imageUrl || 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80'}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.92] sm:group-hover:brightness-100 transition-all duration-500"
              />

              {/* Dark Gradient Overlay (50% lighter for clear visibility) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

              {/* Bottom Left Information */}
              <div className="relative z-10 space-y-0.5 sm:space-y-1 w-full text-left">
                {isSelected && (
                  <div>
                    <span className="inline-block text-[8px] sm:text-[9px] bg-white text-black px-1.5 py-0.5 rounded font-bold shadow-sm">
                      Seçili
                    </span>
                  </div>
                )}

                <h3 className="font-serif-luxury text-xs sm:text-xl text-white font-medium transition-colors leading-tight line-clamp-1">
                  {cat.name}
                </h3>

                {cat.description && (
                  <p className="text-[10px] sm:text-xs text-zinc-300 line-clamp-1 font-light opacity-90 hidden sm:block">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Show More / Less Button for > 4 categories */}
      {categories.length > 4 && (
        <div className="mt-3.5 sm:hidden flex justify-center">
          <button
            id="toggle-more-categories-mobile-btn"
            onClick={() => setShowAllMobile(prev => !prev)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 active:bg-white/10 border border-[#C5A059]/40 text-[#C5A059] active:text-[#d6b26b] text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <span>{showAllMobile ? 'Daha Az Göster' : `Daha Fazlasını Göster (+${categories.length - 4})`}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-300 ${showAllMobile ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </section>
  );
};

