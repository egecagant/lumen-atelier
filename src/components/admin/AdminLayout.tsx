import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  Image as ImageIcon, 
  ShoppingBag, 
  Store, 
  LogOut, 
  ShieldCheck,
  Sliders,
  Tag,
  Percent,
  Users
} from 'lucide-react';
import { Product, Category, HeroBanner, Order, ContactMessage } from '../../types';
import { ProductManager } from './ProductManager';
import { CategoryManager } from './CategoryManager';
import { BannerAndAnnouncementManager } from './BannerAndAnnouncementManager';
import { OrdersManager } from './OrdersManager';
import { CouponsManager } from './CouponsManager';
import { UserManager } from './UserManager';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useCoupons } from '../../context/CouponContext';
import { formatCurrency } from '../../lib/format';

export type AdminTab = 'products' | 'categories' | 'banners' | 'coupons' | 'orders' | 'users';

interface AdminLayoutProps {
  products: Product[];
  categories: Category[];
  banners: HeroBanner[];
  orders: Order[];
  messages?: ContactMessage[];
  onOpenQuickView: (product: Product) => void;
  onExitAdmin: () => void;
  initialTab?: AdminTab;
  initialSubTab?: 'banners' | 'announcement';
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  products,
  categories,
  banners,
  orders,
  messages = [],
  onOpenQuickView,
  onExitAdmin,
  initialTab = 'products',
  initialSubTab = 'banners',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const { settings } = useSiteSettings();
  const { coupons } = useCoupons();

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  const { user, logout } = useAuth();

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const activeBannersCount = banners.filter(b => b.active).length;
  const activeCouponsCount = coupons.filter(c => c.active).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onExitAdmin}
              className="group text-left flex flex-col focus:outline-none"
              title="Vitrini Görüntüle"
            >
              <span className="font-serif-luxury text-xl sm:text-2xl tracking-[0.25em] font-semibold text-white group-hover:text-[#C5A059] transition-colors uppercase">
                {settings.brandName || 'LUMEN'}
              </span>
              <span className="text-[9px] tracking-[0.4em] text-[#C5A059] uppercase -mt-1 font-light">
                {settings.brandTagline || "ATELIER D'ART"}
              </span>
            </button>
            <span className="text-[10px] bg-[#C5A059] text-black px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 border-l border-white/10 pl-4">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>{user?.email || 'Yönetici Modu'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="admin-to-store-btn"
            onClick={onExitAdmin}
            className="px-4 py-2 glass-panel hover:border-[#C5A059] text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-[#C5A059]" />
            <span>Vitrini Görüntüle</span>
          </button>

          <button
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition-colors"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 flex-1 space-y-8">
        
        {/* Unified Tab Cards (Bento Metric + Tab Selector with Icons) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Tab 1: Products */}
          <button
            id="tab-admin-products"
            onClick={() => handleSelectTab('products')}
            className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden group flex flex-col justify-between border ${
              activeTab === 'products'
                ? 'bg-[#18181B] border-[#C5A059]'
                : 'bg-[#0F0F12] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between w-full text-zinc-400 text-xs mb-2">
              <span className={`font-semibold tracking-wide uppercase text-[11px] ${activeTab === 'products' ? 'text-[#C5A059]' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                Ürünler
              </span>
              <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-[#C5A059] group-hover:bg-white/10'}`}>
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between w-full">
              <span className="font-sans text-xl sm:text-2xl text-white font-bold tracking-tight">
                {products.length}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans">Toplam Ürün</span>
            </div>
          </button>

          {/* Tab 2: Categories */}
          <button
            id="tab-admin-categories"
            onClick={() => handleSelectTab('categories')}
            className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden group flex flex-col justify-between border ${
              activeTab === 'categories'
                ? 'bg-[#18181B] border-[#C5A059]'
                : 'bg-[#0F0F12] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between w-full text-zinc-400 text-xs mb-2">
              <span className={`font-semibold tracking-wide uppercase text-[11px] ${activeTab === 'categories' ? 'text-[#C5A059]' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                Kategoriler
              </span>
              <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'categories' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-[#C5A059] group-hover:bg-white/10'}`}>
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between w-full">
              <span className="font-sans text-xl sm:text-2xl text-white font-bold tracking-tight">
                {categories.length}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans">Kategori</span>
            </div>
          </button>

          {/* Tab 3: Banners & Announcement */}
          <button
            id="tab-admin-banners"
            onClick={() => handleSelectTab('banners')}
            className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden group flex flex-col justify-between border ${
              activeTab === 'banners'
                ? 'bg-[#18181B] border-[#C5A059]'
                : 'bg-[#0F0F12] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between w-full text-zinc-400 text-xs mb-2">
              <span className={`font-semibold tracking-wide uppercase text-[11px] ${activeTab === 'banners' ? 'text-[#C5A059]' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                Vitrin & Duyuru
              </span>
              <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'banners' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-[#C5A059] group-hover:bg-white/10'}`}>
                <Sliders className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between w-full">
              <span className="font-sans text-xl sm:text-2xl text-white font-bold tracking-tight">
                {activeBannersCount}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans">Aktif Vitrin</span>
            </div>
          </button>

          {/* Tab 4: Coupons */}
          <button
            id="tab-admin-coupons"
            onClick={() => handleSelectTab('coupons')}
            className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden group flex flex-col justify-between border ${
              activeTab === 'coupons'
                ? 'bg-[#18181B] border-[#C5A059]'
                : 'bg-[#0F0F12] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between w-full text-zinc-400 text-xs mb-2">
              <span className={`font-semibold tracking-wide uppercase text-[11px] ${activeTab === 'coupons' ? 'text-[#C5A059]' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                Kuponlar
              </span>
              <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'coupons' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-[#C5A059] group-hover:bg-white/10'}`}>
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between w-full">
              <span className="font-sans text-xl sm:text-2xl text-white font-bold tracking-tight">
                {coupons.length}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans">({activeCouponsCount} Aktif)</span>
            </div>
          </button>

          {/* Tab 5: Orders */}
          <button
            id="tab-admin-orders"
            onClick={() => handleSelectTab('orders')}
            className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden group flex flex-col justify-between border ${
              activeTab === 'orders'
                ? 'bg-[#18181B] border-[#C5A059]'
                : 'bg-[#0F0F12] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between w-full text-zinc-400 text-xs mb-2">
              <span className={`font-semibold tracking-wide uppercase text-[11px] ${activeTab === 'orders' ? 'text-[#C5A059]' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                Siparişler
              </span>
              <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-[#C5A059] group-hover:bg-white/10'}`}>
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between w-full">
              <span className="font-sans text-xl sm:text-2xl text-white font-bold tracking-tight">
                {orders.length}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans">Sipariş</span>
            </div>
          </button>

          {/* Tab 6: Users */}
          <button
            id="tab-admin-users"
            onClick={() => handleSelectTab('users')}
            className={`p-4 rounded-2xl text-left transition-all relative overflow-hidden group flex flex-col justify-between border ${
              activeTab === 'users'
                ? 'bg-[#18181B] border-[#C5A059]'
                : 'bg-[#0F0F12] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center justify-between w-full text-zinc-400 text-xs mb-2">
              <span className={`font-semibold tracking-wide uppercase text-[11px] ${activeTab === 'users' ? 'text-[#C5A059]' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                Kullanıcılar
              </span>
              <div className={`p-1.5 rounded-xl transition-colors ${activeTab === 'users' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-[#C5A059] group-hover:bg-white/10'}`}>
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between w-full">
              <span className="font-sans text-xl sm:text-2xl text-amber-300 font-bold tracking-tight">
                Yetkiler
              </span>
              <span className="text-[10px] text-zinc-400 font-sans">Yönetim</span>
            </div>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'products' && (
            <ProductManager
              products={products}
              categories={categories}
              onOpenQuickView={onOpenQuickView}
            />
          )}

          {activeTab === 'categories' && (
            <CategoryManager
              categories={categories}
              products={products}
            />
          )}

          {activeTab === 'banners' && (
            <BannerAndAnnouncementManager
              banners={banners}
              initialSubTab={initialSubTab}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponsManager />
          )}

          {activeTab === 'orders' && (
            <OrdersManager
              orders={orders}
            />
          )}

          {activeTab === 'users' && (
            <UserManager />
          )}
        </div>

      </div>
    </div>
  );
};
