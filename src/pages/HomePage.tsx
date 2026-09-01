import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Category, HeroBanner } from '../types';
import { HeroSlider } from '../components/HeroSlider';
import { CategoryGrid } from '../components/CategoryGrid';
import { ProductGrid } from '../components/ProductGrid';
import { ContactSection } from '../components/ContactSection';
import { SEO } from '../components/SEO';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getCategorySlug } from '../lib/slugify';

interface HomePageProps {
  products: Product[];
  categories: Category[];
  banners: HeroBanner[];
  bannersLoading?: boolean;
  productsLoading?: boolean;
  categoriesLoading?: boolean;
  isAdmin: boolean;
  onOpenQuickView: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  categories,
  banners,
  bannersLoading,
  productsLoading,
  categoriesLoading,
  isAdmin,
  onOpenQuickView,
}) => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  return (
    <>
      <SEO
        title="Lüks Tasarım Lambalar & Heykelsi Aydınlatma Koleksiyonu"
        description={settings.brandDescription || "El yapımı pirinç, İtalyan mermeri ve üfleme cam ile şekillendirilen lüks heykelsi aydınlatma tasarımları."}
      />

      <main className="flex-1">
        {/* Hero Banner Slider */}
        <HeroSlider
          banners={banners}
          isLoading={bannersLoading}
          isAdmin={isAdmin}
          onOpenAdminBanners={() => navigate('/admin/banner')}
        />

        {/* Bento Categories Grid */}
        <CategoryGrid
          categories={categories}
          products={products}
          isLoading={categoriesLoading}
          selectedCategory={null}
          onSelectCategory={(catId) => {
            if (!catId) {
              const el = document.getElementById('koleksiyon');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            } else {
              const cat = categories.find(c => c.id === catId);
              if (cat) {
                navigate(`/koleksiyon/${getCategorySlug(cat)}`);
              }
            }
          }}
          isAdmin={isAdmin}
          onOpenAdminCategories={() => navigate('/admin/kategoriler')}
        />

        {/* All Products Showcase */}
        <ProductGrid
          products={products}
          categories={categories}
          isLoading={productsLoading}
          selectedCategory={null}
          onSelectCategory={(catId) => {
            if (!catId) {
              const el = document.getElementById('koleksiyon');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
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

        {/* Contact / Custom Order Section */}
        <ContactSection />
      </main>
    </>
  );
};
