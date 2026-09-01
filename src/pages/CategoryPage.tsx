import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, Category } from '../types';
import { ProductGrid } from '../components/ProductGrid';
import { SEO } from '../components/SEO';
import { findCategoryBySlug, getCategorySlug } from '../lib/slugify';
import { ChevronRight, Layers, Sparkles, ArrowLeft } from 'lucide-react';

interface CategoryPageProps {
  products: Product[];
  categories: Category[];
  isAdmin: boolean;
  isLoading?: boolean;
  onOpenQuickView: (product: Product) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  products,
  categories,
  isAdmin,
  isLoading,
  onOpenQuickView,
}) => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();

  const currentCategory = categorySlug 
    ? findCategoryBySlug(categories, categorySlug) 
    : undefined;

  // Filter products for this category
  const categoryProducts = currentCategory 
    ? products.filter(p => p.categoryId === currentCategory.id) 
    : [];

  return (
    <>
      <SEO
        title={currentCategory ? `${currentCategory.name} Koleksiyonu` : 'Koleksiyon'}
        description={currentCategory?.description || `${currentCategory?.name || 'Tasarım lamba'} kategorisindeki özel heykelsi aydınlatma tasarımlarını keşfedin.`}
        image={currentCategory?.imageUrl}
      />

      <main className="flex-1">
        {/* Category Header Hero */}
        <div className="relative bg-[#0E0E12] border-b border-white/10 py-12 sm:py-16 overflow-hidden">
          {/* Subtle Ambient Background Image with Dark Gradient */}
          {currentCategory?.imageUrl && (
            <div className="absolute inset-0 z-0">
              <img
                src={currentCategory.imageUrl}
                alt={currentCategory.name}
                className="w-full h-full object-cover object-center filter blur-xl opacity-20 transform scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E12] via-[#0E0E12]/80 to-transparent" />
            </div>
          )}

          <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
              <Link to="/" className="hover:text-[#C5A059] transition-colors flex items-center gap-1">
                <span>Ana Sayfa</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <Link to="/#koleksiyon" className="hover:text-[#C5A059] transition-colors">
                Koleksiyonlar
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[#C5A059] font-medium truncate max-w-[200px]">
                {currentCategory?.name || categorySlug}
              </span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C5A059] font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kategori Koleksiyonu</span>
                </div>
                <h1 className="font-serif-luxury text-3xl sm:text-5xl text-white tracking-tight">
                  {currentCategory ? currentCategory.name : 'Seçilen Koleksiyon'}
                </h1>
                {currentCategory?.description && (
                  <p className="text-zinc-300 text-sm sm:text-base font-light max-w-2xl leading-relaxed">
                    {currentCategory.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
                  {categoryProducts.length} Özel Tasarım
                </span>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 glass-panel hover:border-[#C5A059] text-xs text-zinc-200 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tüm Vitrin</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid filtered by this category */}
        <ProductGrid
          products={products}
          categories={categories}
          isLoading={isLoading}
          selectedCategory={currentCategory ? currentCategory.id : null}
          onSelectCategory={(catId) => {
            if (!catId) {
              navigate('/');
            } else {
              const cat = categories.find(c => c.id === catId);
              if (cat) {
                navigate(`/koleksiyon/${getCategorySlug(cat)}`);
              }
            }
          }}
          onOpenQuickView={onOpenQuickView}
          isAdmin={isAdmin}
          onOpenAdminProductCreate={() => navigate('/admin/urunler')}
          onOpenAdminDemoData={() => navigate('/admin/araclar')}
        />
      </main>
    </>
  );
};
