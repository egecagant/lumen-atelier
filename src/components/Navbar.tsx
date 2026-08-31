import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Menu, 
  X, 
  ShieldCheck, 
  Search, 
  Sparkles, 
  SlidersHorizontal, 
  LogOut, 
  ChevronDown, 
  Layers, 
  Plus, 
  ArrowRight,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Category } from '../types';
import { getCategorySlug } from '../lib/slugify';

interface NavbarProps {
  categories: Category[];
  selectedCategory?: string | null;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  selectedCategory,
  onOpenAuth,
  onOpenSearch,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { settings } = useSiteSettings();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const isAdminRoute = location.pathname.startsWith('/admin');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCatObj = categories.find(c => c.id === selectedCategory);

  const handleGoHomeAndScroll = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('koleksiyon');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0A]/85 backdrop-blur-xl border-b border-white/10 transition-all duration-300">
      {/* Top Announcement Bar */}
      {settings.announcementActive && (
        <div 
          style={{
            backgroundColor: settings.announcementBgColor || '#121215',
            color: settings.announcementTextColor || '#C5A059'
          }}
          className="relative text-[11px] uppercase tracking-[0.22em] py-2 border-b border-white/5 font-medium overflow-hidden transition-colors select-none"
        >
          {settings.announcementAnimation === 'marquee' ? (
            <div className="w-full overflow-hidden flex items-center">
              <div 
                className={`${
                  settings.announcementSpeed === 'fast' 
                    ? 'animate-marquee-fast' 
                    : settings.announcementSpeed === 'slow' 
                    ? 'animate-marquee-slow' 
                    : 'animate-marquee-normal'
                }`}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-6 flex-shrink-0 px-6">
                    <Sparkles 
                      className="w-3 h-3 flex-shrink-0" 
                      style={{ color: settings.announcementTextColor || '#C5A059' }}
                    />
                    <span>{settings.announcementText}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div 
              className={`flex items-center justify-center gap-2.5 px-4 text-center ${
                settings.announcementAnimation === 'pulse' 
                  ? settings.announcementSpeed === 'fast'
                    ? 'animate-announcement-pulse-fast'
                    : settings.announcementSpeed === 'slow'
                    ? 'animate-announcement-pulse-slow'
                    : 'animate-announcement-pulse-normal'
                  : settings.announcementAnimation === 'shimmer'
                  ? 'animate-announcement-shimmer'
                  : settings.announcementAnimation === 'bounce'
                  ? 'animate-announcement-float'
                  : ''
              }`}
            >
              <Sparkles 
                className="w-3 h-3 animate-pulse flex-shrink-0" 
                style={{ color: settings.announcementTextColor || '#C5A059' }}
              />
              <span className="truncate max-w-[90vw] sm:max-w-none">{settings.announcementText}</span>
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-zinc-300 hover:text-[#C5A059] transition-colors focus:outline-none"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Brand Logo (Left) */}
          <div className="flex items-center flex-shrink-0">
            <Link 
              to="/"
              className="group text-left flex flex-col focus:outline-none"
            >
              <span className="font-serif-luxury text-xl sm:text-2xl tracking-[0.22em] font-semibold text-white group-hover:text-[#C5A059] transition-colors uppercase leading-none">
                {settings.brandName || 'LUMEN'}
              </span>
              <span className="text-[8px] sm:text-[9px] tracking-[0.35em] text-[#C5A059] uppercase mt-0.5 font-light leading-none">
                {settings.brandTagline || "ATELIER D'ART"}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links (Aligned to Left near Logo) */}
          <nav className="hidden lg:flex items-center space-x-5 xl:space-x-7 ml-6 xl:ml-10 mr-auto">
            <button
              id="nav-all-products"
              onClick={handleGoHomeAndScroll}
              className={`text-xs uppercase tracking-[0.16em] font-medium transition-colors py-1 relative flex-shrink-0 ${
                location.pathname === '/' && !selectedCategory
                  ? 'text-[#C5A059] font-bold'
                  : 'text-zinc-300 hover:text-[#C5A059]'
              }`}
            >
              {settings.navAllProductsText || 'Tüm Koleksiyon'}
            </button>

            {/* KATEGORİLER DROPDOWN MENU */}
            <div className="relative flex-shrink-0" ref={categoryDropdownRef}>
              <button
                id="nav-categories-dropdown-btn"
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                onMouseEnter={() => setCategoryDropdownOpen(true)}
                className={`text-xs uppercase tracking-[0.16em] font-medium transition-all py-1 inline-flex items-center gap-1.5 relative group ${
                  location.pathname.startsWith('/koleksiyon') || categoryDropdownOpen
                    ? 'text-[#C5A059] font-bold'
                    : 'text-zinc-300 hover:text-[#C5A059]'
                }`}
              >
                <span>{settings.navCategoriesDropdownText || 'Kategoriler'}</span>
                {selectedCatObj && (
                  <span className="text-[9px] bg-[#C5A059]/15 text-[#C5A059] px-1.5 py-0.5 rounded-full border border-[#C5A059]/30 font-sans tracking-normal capitalize">
                    {selectedCatObj.name}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-[#C5A059]' : 'text-zinc-400 group-hover:text-[#C5A059]'}`} />
                
                {location.pathname.startsWith('/koleksiyon') && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C5A059]" />
                )}
              </button>

              {/* Dropdown Menu Popup (Matte style, text-only, no images or descriptions) */}
              {categoryDropdownOpen && (
                <div 
                  onMouseLeave={() => setCategoryDropdownOpen(false)}
                  className="absolute left-0 mt-2 w-60 bg-[#161618] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100"
                >
                  <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
                    <span className="text-[10px] uppercase tracking-[0.16em] font-medium text-zinc-400">
                      Kategoriler
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
                    {/* All Products Option */}
                    <button
                      onClick={() => {
                        setCategoryDropdownOpen(false);
                        handleGoHomeAndScroll();
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between text-xs ${
                        location.pathname === '/'
                          ? 'bg-white/10 text-white font-semibold' 
                          : 'text-zinc-300 hover:text-white hover:bg-white/5 font-normal'
                      }`}
                    >
                      <span>Tüm Koleksiyon</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    </button>

                    {/* Dynamic categories from Firestore */}
                    {categories.length === 0 ? (
                      <div className="py-4 px-2.5 text-center text-xs text-zinc-400">
                        Henüz kategori eklenmedi.
                      </div>
                    ) : (
                      categories.map((cat) => {
                        const slug = getCategorySlug(cat);
                        const isSelected = location.pathname === `/koleksiyon/${slug}` || selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            id={`dropdown-cat-${cat.id}`}
                            onClick={() => {
                              setCategoryDropdownOpen(false);
                              navigate(`/koleksiyon/${slug}`);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between text-xs ${
                              isSelected
                                ? 'bg-white/10 text-white font-semibold'
                                : 'text-zinc-300 hover:text-white hover:bg-white/5 font-normal'
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            {isSelected && (
                              <span className="text-[9px] bg-white text-black font-semibold px-1.5 py-0.5 rounded">
                                Seçili
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Admin Quick Category Shortcut */}
                  {isAdmin && (
                    <div className="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between px-2">
                      <span className="text-[10px] text-zinc-400 font-medium">Yönetici</span>
                      <button
                        onClick={() => {
                          setCategoryDropdownOpen(false);
                          navigate('/admin/kategoriler');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white font-medium"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Yeni Kategori Ekle</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Özel Tasarım & İletişim */}
            <button
              onClick={() => navigate('/ozel-tasarim')}
              className={`text-xs uppercase tracking-[0.18em] transition-colors py-1 relative flex-shrink-0 ${
                location.pathname === '/ozel-tasarim'
                  ? 'text-[#C5A059] font-bold'
                  : 'text-zinc-300 hover:text-[#C5A059]'
              }`}
            >
              <span>{settings.navContactText || 'Özel Tasarım & İletişim'}</span>
              {location.pathname === '/ozel-tasarim' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C5A059]" />
              )}
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop Search Bar (Right side) */}
            <div className="hidden md:flex items-center w-44 lg:w-52 xl:w-60">
              <div 
                id="header-search-bar"
                onClick={onOpenSearch}
                className="w-full relative cursor-pointer group"
              >
                <div className="flex items-center w-full bg-black/50 hover:bg-black/80 border border-white/10 hover:border-[#C5A059]/60 rounded-full py-1.5 px-3 text-xs text-zinc-400 hover:text-zinc-200 transition-all shadow-inner">
                  <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#C5A059] mr-2 transition-colors flex-shrink-0" />
                  <span className="truncate text-xs font-light">Ürün ara...</span>
                  <kbd className="hidden xl:inline-block ml-auto text-[9px] text-zinc-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-sans">
                    Ara
                  </kbd>
                </div>
              </div>
            </div>
            {/* Search Trigger (Mobile only, desktop has wide search bar) */}
            <button
              id="search-trigger-btn"
              onClick={onOpenSearch}
              className="md:hidden p-2 text-zinc-300 hover:text-[#C5A059] transition-colors rounded-full hover:bg-white/5"
              aria-label="Arama"
              title="Ürün Ara"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* User Account / Auth */}
            <div className="relative">
              {user ? (
                <div className="relative">
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1 p-2 text-zinc-300 hover:text-[#C5A059] transition-colors rounded-full hover:bg-white/5"
                    title={user.displayName || user.email}
                  >
                    <UserIcon className="w-4.5 h-4.5" />
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-[#0B0B0E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95)] py-2 z-50 animate-in fade-in zoom-in-95"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{user.displayName}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{user.email || user.phone}</p>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-full mt-1 font-medium border border-[#C5A059]/20">
                            <ShieldCheck className="w-3 h-3" /> Yönetici Rolü
                          </span>
                        )}
                      </div>

                      <button
                        id="nav-user-profile-btn"
                        onClick={() => {
                          navigate('/profil');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-200 hover:text-[#C5A059] hover:bg-white/5 flex items-center gap-2 transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Hesabım & Profilim</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigate('/admin/urunler');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-[#C5A059] hover:bg-white/5 flex items-center gap-2 border-t border-white/5"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Admin Yönetim Paneli</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-white/5 flex items-center gap-2 border-t border-white/5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="auth-login-btn"
                  onClick={onOpenAuth}
                  className="p-2 text-zinc-300 hover:text-[#C5A059] transition-colors rounded-full hover:bg-white/5"
                  aria-label="Giriş Yap"
                  title="Giriş / Kayıt"
                >
                  <UserIcon className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            {/* Cart Drawer Trigger */}
            <button
              id="cart-drawer-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-zinc-300 hover:text-[#C5A059] transition-colors rounded-full hover:bg-white/5"
              aria-label="Sepetim"
              title="Alışveriş Sepeti"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C5A059] text-black text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0E0E11] border-b border-white/10 px-4 pt-3 pb-6 space-y-3">
          <div className="border-b border-white/10 pb-2">
            <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-semibold mb-2">Kategoriler</p>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-sm py-1.5 ${
                  location.pathname === '/'
                    ? 'text-[#C5A059] font-semibold'
                    : 'text-zinc-400'
                }`}
              >
                Tüm Koleksiyon
              </button>
              {categories.map((cat) => {
                const slug = getCategorySlug(cat);
                const isSelected = location.pathname === `/koleksiyon/${slug}`;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      navigate(`/koleksiyon/${slug}`);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left text-sm py-1.5 ${
                      isSelected
                        ? 'text-[#C5A059] font-semibold'
                        : 'text-zinc-400'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-col space-y-2 border-t border-white/10">
            {user ? (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    navigate('/profil');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-sm text-[#C5A059] font-medium py-1.5 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profilim & Kayıtlı Adreslerim</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full text-left text-sm text-zinc-300 hover:text-[#C5A059] py-1.5 flex items-center gap-2"
              >
                <UserIcon className="w-4 h-4 text-[#C5A059]" />
                <span>Giriş Yap / Üye Ol</span>
              </button>
            )}

            <button
              onClick={() => {
                navigate('/ozel-tasarim');
                setMobileMenuOpen(false);
              }}
              className={`text-left text-sm py-1.5 transition-colors ${
                location.pathname === '/ozel-tasarim'
                  ? 'text-[#C5A059] font-semibold'
                  : 'text-zinc-300 hover:text-[#C5A059]'
              }`}
            >
              {settings.navContactText || 'Özel Tasarım & İletişim'}
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  navigate(isAdminRoute ? '/' : '/admin/urunler');
                  setMobileMenuOpen(false);
                }}
                className="text-left text-sm text-[#C5A059] font-semibold py-2 flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {isAdminRoute ? 'Vitrini Görüntüle' : 'Admin Yönetim Paneli'}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
