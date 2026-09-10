import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  db, 
  COLLECTIONS, 
  collection, 
  onSnapshot, 
  query 
} from './lib/firebase';
import { Product, Category, HeroBanner, Order, ContactMessage } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { CouponProvider } from './context/CouponContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { IyzicoCheckoutModal } from './components/IyzicoCheckoutModal';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ProfilePage } from './pages/ProfilePage';
import { WishlistPage } from './pages/WishlistPage';
import { CustomDesignPage } from './pages/CustomDesignPage';
import { 
  AboutPage, 
  ShippingReturnsPage, 
  PrivacyPage, 
  DistanceSalesPage,
  PreliminaryInfoPage,
  WithdrawalFormPage,
  CookiePolicyPage,
  KvkkApplicationPage,
  TermsOfUsePage
} from './pages/LegalPages';
import { CookieConsent } from './components/CookieConsent';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { AdminPage } from './pages/AdminPage';
import { Search, X } from 'lucide-react';
import { formatCurrency } from './lib/format';
import { getProductSlug } from './lib/slugify';
import { MAINTENANCE_MODE, MAINTENANCE_BYPASS_EMAILS } from './lib/maintenance';
import { MaintenanceScreen } from './components/MaintenanceScreen';

function StoreLayout({
  categories,
  onOpenAuth,
  onOpenSearch,
  isAdmin,
  children,
}: {
  categories: Category[];
  onOpenAuth: () => void;
  onOpenSearch: () => void;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar
        categories={categories}
        onOpenAuth={onOpenAuth}
        onOpenSearch={onOpenSearch}
      />
      {children}
      <Footer
        categories={categories}
        isAdmin={isAdmin}
      />
    </>
  );
}

function loadCachedBanners(): HeroBanner[] {
  try {
    const raw = localStorage.getItem('lumen_banners_backup');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read cached banners:', e);
  }
  return [];
}

function loadCachedCategories(): Category[] {
  try {
    const raw = localStorage.getItem('lumen_categories_backup');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read cached categories:', e);
  }
  return [];
}

function loadCachedProducts(): Product[] {
  try {
    const raw = localStorage.getItem('lumen_products_backup');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read cached products:', e);
  }
  return [];
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isAuthModalOpen, openAuthModal, closeAuthModal, authModalPrompt } = useAuth();

  // Firestore Real-time Collections State with instant local cache
  const [products, setProducts] = useState<Product[]>(loadCachedProducts);
  const [productsLoading, setProductsLoading] = useState<boolean>(() => loadCachedProducts().length === 0);
  const [categories, setCategories] = useState<Category[]>(loadCachedCategories);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(() => loadCachedCategories().length === 0);
  const [banners, setBanners] = useState<HeroBanner[]>(loadCachedBanners);
  const [bannersLoading, setBannersLoading] = useState<boolean>(() => loadCachedBanners().length === 0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // Modals
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [directBuyItem, setDirectBuyItem] = useState<{ product: Product; quantity: number } | null>(null);

  // 1. Subscribe to Products
  useEffect(() => {
    try {
      const q = query(collection(db, COLLECTIONS.PRODUCTS));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach((doc) => {
          prods.push({ id: doc.id, ...doc.data() } as Product);
        });
        const sorted = prods.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setProducts(sorted);
        setProductsLoading(false);
        try {
          localStorage.setItem('lumen_products_backup', JSON.stringify(sorted));
        } catch (err) {
          // ignore quota
        }
      }, (error) => {
        console.warn('Products onSnapshot error:', error);
        setProductsLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Products subscription fallback:', e);
      setProductsLoading(false);
    }
  }, []);

  // 2. Subscribe to Categories
  useEffect(() => {
    try {
      const q = query(collection(db, COLLECTIONS.CATEGORIES));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cats: Category[] = [];
        snapshot.forEach((doc) => {
          cats.push({ id: doc.id, ...doc.data() } as Category);
        });
        const sorted = cats.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(sorted);
        setCategoriesLoading(false);
        try {
          localStorage.setItem('lumen_categories_backup', JSON.stringify(sorted));
        } catch (err) {
          // ignore quota
        }
      }, (error) => {
        console.warn('Categories onSnapshot error:', error);
        setCategoriesLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Categories subscription fallback:', e);
      setCategoriesLoading(false);
    }
  }, []);

  // 3. Subscribe to Banners
  useEffect(() => {
    try {
      const q = query(collection(db, COLLECTIONS.BANNERS));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bans: HeroBanner[] = [];
        snapshot.forEach((doc) => {
          bans.push({ id: doc.id, ...doc.data() } as HeroBanner);
        });
        const sorted = bans.sort((a, b) => (a.order || 0) - (b.order || 0));
        setBanners(sorted);
        setBannersLoading(false);
        try {
          localStorage.setItem('lumen_banners_backup', JSON.stringify(sorted));
        } catch (err) {
          // ignore quota
        }
      }, (error) => {
        console.warn('Banners onSnapshot error:', error);
        setBannersLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Banners subscription fallback:', e);
      setBannersLoading(false);
    }
  }, []);

  // 4. Subscribe to Orders (Admin-only for privacy & security)
  useEffect(() => {
    if (!isAdmin) {
      setOrders([]);
      return;
    }

    let isMounted = true;
    try {
      const q = query(collection(db, COLLECTIONS.ORDERS));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const ords: Order[] = [];
        snapshot.forEach((doc) => {
          ords.push({ id: doc.id, ...doc.data() } as Order);
        });
        const sorted = ords.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(sorted);
      }, (error) => {
        console.warn('Orders onSnapshot error:', error.message || error);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn('Orders subscription error:', e);
    }
  }, [isAdmin]);

  // 5. Subscribe to Messages (Reactive to Admin & User auth state)
  useEffect(() => {
    let isMounted = true;

    try {
      const q = query(collection(db, COLLECTIONS.MESSAGES));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const msgs: ContactMessage[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as ContactMessage);
        });
        setMessages(msgs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      }, (error) => {
        console.warn('Messages onSnapshot error:', error.message || error);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn('Messages subscription fallback:', e);
    }
  }, [isAdmin, user]);

  // Handle direct Buy Now from quick view or detail page
  const handleInstantBuy = (product: Product, quantity: number) => {
    navigate('/odeme', { state: { directBuyProduct: { product, quantity } } });
  };

  // Close search with ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Search Results Filter
  const searchResults = searchQuery.trim()
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#f4f4f5] flex flex-col selection:bg-[#C5A059] selection:text-black">
      
      <Routes>
        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <AdminPage
              products={products}
              categories={categories}
              banners={banners}
              orders={orders}
              messages={messages}
              onOpenQuickView={(prod) => setQuickViewProduct(prod)}
              onOpenAuth={() => openAuthModal()}
            />
          }
        />
        <Route
          path="/admin/:tab"
          element={
            <AdminPage
              products={products}
              categories={categories}
              banners={banners}
              orders={orders}
              messages={messages}
              onOpenQuickView={(prod) => setQuickViewProduct(prod)}
              onOpenAuth={() => openAuthModal()}
            />
          }
        />

        {/* Storefront Home */}
        <Route
          path="/"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <HomePage
                products={products}
                categories={categories}
                banners={banners}
                bannersLoading={bannersLoading}
                productsLoading={productsLoading}
                categoriesLoading={categoriesLoading}
                isAdmin={isAdmin}
                onOpenQuickView={(prod) => setQuickViewProduct(prod)}
              />
            </StoreLayout>
          }
        />

        {/* Category Page */}
        <Route
          path="/koleksiyon/:categorySlug"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <CategoryPage
                products={products}
                categories={categories}
                isLoading={productsLoading}
                isAdmin={isAdmin}
                onOpenQuickView={(prod) => setQuickViewProduct(prod)}
              />
            </StoreLayout>
          }
        />

        {/* Product Detail Page */}
        <Route
          path="/urun/:productSlug"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <ProductDetailPage
                products={products}
                categories={categories}
                isAdmin={isAdmin}
                onInstantBuy={handleInstantBuy}
                onOpenQuickView={(prod) => setQuickViewProduct(prod)}
              />
            </StoreLayout>
          }
        />

        {/* Checkout Page */}
        <Route
          path="/odeme"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <CheckoutPage />
            </StoreLayout>
          }
        />
        <Route
          path="/checkout"
          element={<Navigate to="/odeme" replace />}
        />

        {/* Dedicated Guest Checkout Redirect to Unified /odeme */}
        <Route
          path="/misafir-odeme"
          element={<Navigate to="/odeme" replace />}
        />
        <Route
          path="/misafir-satin-al"
          element={<Navigate to="/odeme" replace />}
        />
        <Route
          path="/misafir-siparis"
          element={<Navigate to="/odeme" replace />}
        />
        <Route
          path="/guest-checkout"
          element={<Navigate to="/odeme" replace />}
        />

        {/* Order Success & Payment Callback Page */}
        <Route
          path="/order-success"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <OrderSuccessPage />
            </StoreLayout>
          }
        />
        <Route
          path="/siparis-basarili"
          element={<Navigate to="/order-success" replace />}
        />

        {/* Dedicated Wishlist / Beğenilenler Page */}
        <Route
          path="/begenilenler"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <WishlistPage
                products={products}
                onOpenAuth={() => openAuthModal()}
                onOpenQuickView={(prod) => setQuickViewProduct(prod)}
              />
            </StoreLayout>
          }
        />
        <Route
          path="/favoriler"
          element={<Navigate to="/begenilenler" replace />}
        />
        <Route
          path="/favorilerim"
          element={<Navigate to="/begenilenler" replace />}
        />
        <Route
          path="/wishlist"
          element={<Navigate to="/begenilenler" replace />}
        />

        {/* User Profile & Saved Addresses */}
        <Route
          path="/profil"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <ProfilePage 
                onOpenAuth={() => openAuthModal()} 
                products={products}
                onOpenQuickView={(prod) => setQuickViewProduct(prod)}
              />
            </StoreLayout>
          }
        />
        <Route
          path="/hesabim"
          element={<Navigate to="/profil" replace />}
        />
        <Route
          path="/profilim"
          element={<Navigate to="/profil" replace />}
        />

        {/* Dedicated Custom Design Page */}
        <Route
          path="/ozel-tasarim"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <CustomDesignPage />
            </StoreLayout>
          }
        />
        <Route
          path="/ozeltasarim"
          element={<Navigate to="/ozel-tasarim" replace />}
        />
        <Route
          path="/iletisim"
          element={<Navigate to="/ozel-tasarim" replace />}
        />

        {/* Legal & Information Pages */}
        <Route
          path="/hakkimizda"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <AboutPage />
            </StoreLayout>
          }
        />
        <Route path="/hakkinda" element={<Navigate to="/hakkimizda" replace />} />
        <Route path="/about" element={<Navigate to="/hakkimizda" replace />} />

        <Route
          path="/teslimat-ve-iade"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <ShippingReturnsPage />
            </StoreLayout>
          }
        />
        <Route path="/teslimat-iade" element={<Navigate to="/teslimat-ve-iade" replace />} />
        <Route path="/iade-kosullari" element={<Navigate to="/teslimat-ve-iade" replace />} />
        <Route path="/iade" element={<Navigate to="/teslimat-ve-iade" replace />} />
        <Route path="/teslimat" element={<Navigate to="/teslimat-ve-iade" replace />} />

        <Route
          path="/gizlilik-politikasi"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <PrivacyPage />
            </StoreLayout>
          }
        />
        <Route path="/gizlilik" element={<Navigate to="/gizlilik-politikasi" replace />} />
        <Route path="/kvkk" element={<Navigate to="/gizlilik-politikasi" replace />} />

        <Route
          path="/mesafeli-satis-sozlesmesi"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <DistanceSalesPage />
            </StoreLayout>
          }
        />
        <Route path="/sozlesme" element={<Navigate to="/mesafeli-satis-sozlesmesi" replace />} />

        {/* Ön Bilgilendirme Formu */}
        <Route
          path="/on-bilgilendirme-formu"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <PreliminaryInfoPage />
            </StoreLayout>
          }
        />
        <Route path="/on-bilgilendirme" element={<Navigate to="/on-bilgilendirme-formu" replace />} />

        {/* Cayma Hakkı ve Formu */}
        <Route
          path="/cayma-formu"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <WithdrawalFormPage />
            </StoreLayout>
          }
        />
        <Route path="/cayma-hakki" element={<Navigate to="/cayma-formu" replace />} />

        {/* Çerez Politikası */}
        <Route
          path="/cerez-politikasi"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <CookiePolicyPage />
            </StoreLayout>
          }
        />
        <Route path="/cerezler" element={<Navigate to="/cerez-politikasi" replace />} />

        {/* KVKK Veri Sahibi Başvuru Formu (Gizlilik ve KVKK Politikası İçine Gömülü) */}
        <Route path="/kvkk-basvuru" element={<Navigate to="/gizlilik-politikasi#kvkk-basvuru" replace />} />
        <Route path="/veri-sahibi-basvuru" element={<Navigate to="/gizlilik-politikasi#kvkk-basvuru" replace />} />

        {/* Web Sitesi Kullanım Koşulları */}
        <Route
          path="/kullanim-kosullari"
          element={
            <StoreLayout
              categories={categories}
              onOpenAuth={() => openAuthModal()}
              onOpenSearch={() => setIsSearchOpen(true)}
              isAdmin={isAdmin}
            >
              <TermsOfUsePage />
            </StoreLayout>
          }
        />
        <Route path="/kullanim-sartlari" element={<Navigate to="/kullanim-kosullari" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Quick View / Product Detail Modal (Works everywhere on top) */}
      <ProductDetailModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onInstantCheckout={handleInstantBuy}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        onProceedToCheckout={() => {
          navigate('/odeme');
        }}
      />

      {/* iyzico Checkout Modal */}
      <IyzicoCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setDirectBuyItem(null);
        }}
        directBuyItem={directBuyItem}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        promptTitle={authModalPrompt?.title}
        promptMessage={authModalPrompt?.message}
        onSuccessAdmin={() => navigate('/admin/urunler')}
      />

      {/* Search Popup Modal */}
      {isSearchOpen && (
        <div 
          id="search-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSearchOpen(false);
              setSearchQuery('');
            }
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-in fade-in cursor-default"
        >
          <div 
            className="w-full max-w-2xl bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-[#C5A059]" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lamba adı, materyal (pirinç, mermer) veya kategori ara..."
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                aria-label="Aramayı Kapat"
                title="Kapat (ESC)"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4">
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-widest text-[#C5A059] font-semibold mb-2">
                      Bulunan Tasarımlar ({searchResults.length})
                    </p>
                    {searchResults.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          navigate(`/urun/${getProductSlug(prod)}`);
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bento-card cursor-pointer hover:border-[#C5A059]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=150&q=80'}
                            alt=""
                            className="w-12 h-12 object-cover rounded-xl bg-black border border-white/10"
                          />
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-200">{prod.name}</h4>
                            <span className="text-[10px] text-[#C5A059] uppercase tracking-wider">{prod.categoryName}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#C5A059] font-serif-luxury">
                          {formatCurrency(prod.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    "{searchQuery}" aramasıyla eşleşen lamba bulunamadı.
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Aramak istediğiniz tasarım lambanın adını veya materyalini yazın.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuthModal, isAuthModalOpen, closeAuthModal } = useAuth();

  // 1. If maintenance mode is turned off, render normal site directly
  if (!MAINTENANCE_MODE) {
    return <>{children}</>;
  }

  // 2. If auth is still loading, show a brief loading state to prevent flashing maintenance screen for admins
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
      </div>
    );
  }

  // 3. Check if logged-in user email is in the bypass list
  const userEmail = user?.email?.toLowerCase().trim();
  const isBypass = !!userEmail && MAINTENANCE_BYPASS_EMAILS.some(
    (allowed) => allowed.toLowerCase().trim() === userEmail
  );

  // 4. If bypass user is logged in, show site normally
  if (isBypass) {
    return (
      <>
        {/* Discreet indicator for admin/bypass users to know maintenance mode is active for visitors */}
        <div className="fixed bottom-3 right-3 z-50 pointer-events-none">
          <div className="bg-[#18181D] text-zinc-300 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full shadow-xl border border-[#C5A059]/40 flex items-center gap-2 pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
            <span>Bakım Modu Aktif (Bypass)</span>
          </div>
        </div>
        {children}
      </>
    );
  }

  // 5. Otherwise, display maintenance screen
  return (
    <>
      <MaintenanceScreen onOpenAuth={() => openAuthModal('Bypass testi için lütfen yetkili e-posta adresinizle giriş yapın.')} />
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MaintenanceGate>
        <SiteSettingsProvider>
          <CouponProvider>
            <CartProvider>
              <BrowserRouter>
                <MainApp />
              </BrowserRouter>
            </CartProvider>
          </CouponProvider>
        </SiteSettingsProvider>
      </MaintenanceGate>
    </AuthProvider>
  );
}
