import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Product } from '../types';
import { 
  Heart, 
  ShoppingBag, 
  Sparkles, 
  Trash2, 
  Store, 
  ArrowLeft, 
  Eye, 
  Check, 
  Share2, 
  ChevronRight, 
  ShieldCheck, 
  Layers, 
  Zap,
  Info,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { SEO } from '../components/SEO';
import { getProductSlug } from '../lib/slugify';

interface WishlistPageProps {
  products: Product[];
  onOpenAuth: () => void;
  onOpenQuickView?: (product: Product) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  products = [],
  onOpenAuth,
  onOpenQuickView
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlist, toggleWishlist, clearWishlist, addToCart } = useCart();
  const { settings } = useSiteSettings();

  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [allAddedAnimation, setAllAddedAnimation] = useState(false);

  // Filter products that exist in wishlist
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isOutOfStock = product.stockStatus === 'out_of_stock' || (typeof product.stockQuantity === 'number' && product.stockQuantity <= 0);
    if (isOutOfStock) return;

    addToCart(product, 1);
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }, 2200);
  };

  const handleAddAllToCart = () => {
    const inStockItems = wishlistedProducts.filter(p => !(p.stockStatus === 'out_of_stock' || (typeof p.stockQuantity === 'number' && p.stockQuantity <= 0)));
    if (inStockItems.length === 0) return;

    inStockItems.forEach(p => {
      addToCart(p, 1);
    });

    setAllAddedAnimation(true);
    setTimeout(() => {
      setAllAddedAnimation(false);
    }, 3000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LUMEN Atelier | Beğenilen Tasarımlar',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-200 pb-28 pt-4 selection:bg-[#C5A059] selection:text-black">
      <SEO 
        title="Beğenilenler & Favori Tasarımlarım" 
        description="LUMEN Atelier d'Art beğendiğiniz el yapımı pirinç, mermer ve üfleme cam lüks aydınlatma tasarımları." 
      />

      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-2 text-xs text-zinc-400 py-4 mb-2">
          <Link to="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-[#C5A059] font-medium">Beğenilenler ({wishlist.length})</span>
        </nav>

        {/* HERO HEADER SECTION */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#141419] via-[#0E0E12] to-[#09090C] border border-white/10 p-6 sm:p-10 lg:p-12 mb-8 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[11px] font-semibold uppercase tracking-widest">
                <Heart className="w-3.5 h-3.5 fill-[#C5A059]" />
                <span>Kişisel Seçkileriniz</span>
              </div>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-normal text-white uppercase tracking-wider">
                Beğenilen Tasarımlar
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed max-w-xl">
                Koleksiyonumuzdan kalbinizi fetheden el yapımı masif pirinç, İtalyan mermeri ve üfleme cam lambalarınız burada listelenir.
              </p>
            </div>

            {/* Top Stats & Quick Action Buttons */}
            {wishlist.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Listeyi Paylaş"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{copiedLink ? 'Link Kopyalandı' : 'Listeyi Paylaş'}</span>
                </button>

                <button
                  onClick={handleAddAllToCart}
                  disabled={allAddedAnimation}
                  className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
                    allAddedAnimation 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-[#C5A059] hover:bg-[#d6b26b] text-black border border-[#C5A059]'
                  }`}
                >
                  {allAddedAnimation ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sepete Eklendi!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Tümünü Sepete Ekle</span>
                    </>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowClearConfirm(!showClearConfirm)}
                    className="p-2.5 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                    title="Listeyi Temizle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Clear Confirm Popover */}
                  {showClearConfirm && (
                    <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-[#141419] border border-white/15 rounded-2xl shadow-2xl z-40 space-y-3 animate-in fade-in zoom-in-95">
                      <p className="text-xs text-zinc-300 font-medium">
                        Beğenilenler listenizdeki tüm ürünleri kaldırmak istediğinize emin misiniz?
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-3 py-1.5 text-[11px] text-zinc-400 hover:text-white rounded-lg transition-colors"
                        >
                          Vazgeç
                        </button>
                        <button
                          onClick={() => {
                            clearWishlist();
                            setShowClearConfirm(false);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          Evet, Temizle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GUEST ACCOUNT NOTICE BANNER */}
        {!user && (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#171720] via-[#131318] to-[#0F0F14] border border-[#C5A059]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 glass-panel shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Favorilerinizi Profilinizde Kalıcı Saklayın</span>
                  <span className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded-full font-normal">Tavsiye</span>
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5 max-w-2xl">
                  Şu anda misafir olarak listelediğiniz ürünler tarayıcınızda kayıtlıdır. Ücretsiz hesap açarak veya giriş yaparak favorilerinize cep telefonu ve bilgisayarınızdan her zaman erişebilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              Giriş Yap / Üye Ol
            </button>
          </div>
        )}

        {/* WISHLIST CONTENT */}
        {wishlist.length === 0 || wishlistedProducts.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-[#0D0D10] border border-white/10 rounded-3xl p-12 sm:p-20 text-center space-y-6 glass-panel max-w-3xl mx-auto my-6 shadow-2xl">
            <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-600 shadow-inner">
              <Heart className="w-12 h-12 text-zinc-600" />
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-[#C5A059]/20 border border-[#C5A059]/40 rounded-full flex items-center justify-center text-[#C5A059]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl font-serif-luxury text-white uppercase tracking-wider">
                Henüz Beğendiğiniz Bir Tasarım Bulunmuyor
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                Koleksiyonumuzdaki el yapımı pirinç, mermer ve üfleme cam lambaları keşfedip ürünlerin üzerindeki kalp simgesine tıklayarak beğendiklerinizi burada toplayabilirsiniz.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Koleksiyonu Keşfet</span>
              </button>

              <button
                onClick={() => navigate('/ozel-tasarim')}
                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Özel Tasarım Hizmeti</span>
              </button>
            </div>
          </div>
        ) : (
          /* PRODUCT GRID */
          <div className="space-y-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs uppercase tracking-widest text-zinc-400 font-medium">
                {wishlistedProducts.length} adet tasarım listeleniyor
              </span>
              <button
                onClick={() => navigate('/')}
                className="text-xs text-[#C5A059] hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <span>Koleksiyondan Daha Fazla Ürün Ekle</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {wishlistedProducts.map((product) => {
                const isOutOfStock = product.stockStatus === 'out_of_stock' || (typeof product.stockQuantity === 'number' && product.stockQuantity <= 0);
                const isAdded = addedItems[product.id];
                const productSlug = getProductSlug(product);
                const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80';
                const hasDiscount = !!(product.compareAtPrice && product.compareAtPrice > product.price);
                const discountPercentage = hasDiscount 
                  ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
                  : 0;

                return (
                  <div
                    key={product.id}
                    className={`group relative flex flex-col bento-card rounded-3xl overflow-hidden transition-all duration-300 border border-white/10 hover:border-[#C5A059]/50 bg-[#0C0C0F] hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${
                      isOutOfStock ? 'opacity-85' : ''
                    }`}
                  >
                    {/* Image Area with Zoom */}
                    <div 
                      onClick={() => navigate(`/urun/${productSlug}`)}
                      className="relative aspect-square w-full bg-black/40 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
                          isOutOfStock ? 'grayscale opacity-75' : ''
                        }`}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-20 pointer-events-none">
                        {isOutOfStock ? (
                          <span className="bg-black/90 text-zinc-300 border border-zinc-700 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold backdrop-blur-md shadow-lg">
                            Tükendi
                          </span>
                        ) : hasDiscount ? (
                          <span className="bg-emerald-500/90 text-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold shadow-md">
                            %{discountPercentage} İndirim
                          </span>
                        ) : (
                          <span className="glass-panel text-[#C5A059] text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-semibold border border-[#C5A059]/30">
                            {product.categoryName || 'Lüks Aydınlatma'}
                          </span>
                        )}
                      </div>

                      {/* Remove from Wishlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className="absolute top-3.5 right-3.5 z-30 p-2.5 rounded-full bg-black/75 hover:bg-black text-rose-400 hover:text-rose-300 border border-white/10 transition-all drop-shadow-md cursor-pointer hover:scale-110"
                        title="Favorilerden Kaldır"
                        aria-label="Favorilerden Kaldır"
                      >
                        <Heart className="w-4 h-4 fill-rose-400" />
                      </button>

                      {/* Hover Quick View Trigger Button */}
                      {onOpenQuickView && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQuickView(product);
                          }}
                          className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 px-4 py-2 bg-black/80 hover:bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-xl backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xl cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                          <span>Hızlı İncele</span>
                        </button>
                      )}
                    </div>

                    {/* Content & Action */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                          <span className="uppercase tracking-widest text-[#C5A059] font-medium">
                            {product.categoryName || 'Tasarım'}
                          </span>
                          {product.dimensions && (
                            <span className="text-[10px] text-zinc-400 font-light">
                              {product.dimensions}
                            </span>
                          )}
                        </div>

                        <Link 
                          to={`/urun/${productSlug}`}
                          className="font-serif-luxury text-base font-medium text-white hover:text-[#C5A059] transition-colors line-clamp-1 block"
                        >
                          {product.name}
                        </Link>

                        {product.material && (
                          <p className="text-xs text-zinc-400 font-light mt-1 truncate">
                            {product.material}
                          </p>
                        )}
                      </div>

                      {/* Price & Add to Cart */}
                      <div className="pt-3 border-t border-white/10 space-y-3">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="font-serif-luxury text-lg text-[#C5A059] font-bold">
                              {formatCurrency(product.price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-zinc-400 line-through">
                                {formatCurrency(product.compareAtPrice!)}
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-zinc-400 font-light">
                            {isOutOfStock ? 'Stokta Yok' : 'Stokta Var'}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isOutOfStock}
                          className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                            isOutOfStock
                              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                              : isAdded
                              ? 'bg-emerald-500 text-black border border-emerald-400'
                              : 'bg-white/10 hover:bg-[#C5A059] text-white hover:text-black border border-white/10 hover:border-[#C5A059]'
                          }`}
                        >
                          {isOutOfStock ? (
                            <span>Stokta Yok</span>
                          ) : isAdded ? (
                            <>
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Sepete Eklendi</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-4 h-4" />
                              <span>Sepete Ekle</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
