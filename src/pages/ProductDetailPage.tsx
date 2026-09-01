import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, Category, ProductColorOption } from '../types';
import { SEO } from '../components/SEO';
import { ProductCard } from '../components/ProductCard';
import { ContactSection } from '../components/ContactSection';
import { findProductBySlug, getCategorySlug, getProductSlug } from '../lib/slugify';
import { formatCurrency } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { 
  ChevronRight, 
  ShoppingBag, 
  Heart, 
  Check, 
  Shield, 
  Truck, 
  Sparkles, 
  Ruler, 
  Layers, 
  Zap,
  Share2,
  ChevronLeft,
  ArrowLeft,
  PackageCheck,
  Award,
  Clock,
  MessageSquare,
  Palette
} from 'lucide-react';

interface ProductDetailPageProps {
  products: Product[];
  categories: Category[];
  isAdmin: boolean;
  onInstantBuy: (product: Product, quantity: number) => void;
  onOpenQuickView: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  products,
  categories,
  isAdmin,
  onInstantBuy,
  onOpenQuickView,
}) => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { user, openAuthModal } = useAuth();
  const { settings } = useSiteSettings();

  const product = productSlug ? findProductBySlug(products, productSlug) : undefined;
  
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductColorOption | string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset selected image & color when product changes
  useEffect(() => {
    setSelectedImageIdx(0);
    setQuantity(1);
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(null);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [productSlug, product?.id]);

  if (!product) {
    return (
      <main className="flex-1 min-h-[60vh] flex items-center justify-center p-6">
        <SEO title="Ürün Bulunamadı" description="Aradığınız tasarım lamba bulunamadı veya kaldırılmış olabilir." />
        <div className="max-w-md w-full bg-[#0F0F12] border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl glass-panel">
          <Sparkles className="w-12 h-12 text-[#C5A059] mx-auto opacity-75" />
          <h2 className="font-serif-luxury text-2xl text-white uppercase">Tasarım Bulunamadı</h2>
          <p className="text-xs text-zinc-400 font-light">
            İncelemek istediğiniz lamba modeli sistemde bulunamadı veya bağlantı güncellenmiş olabilir.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg"
          >
            Koleksiyona Geri Dön
          </button>
        </div>
      </main>
    );
  }

  const isOutOfStock = product ? (product.stockStatus === 'out_of_stock' || (typeof product.stockQuantity === 'number' && product.stockQuantity <= 0)) : false;
  const category = categories.find(c => c.id === product?.categoryId);
  const isFavorite = product ? isWishlisted(product.id) : false;

  const handleWishlist = () => {
    if (!product) return;
    toggleWishlist(product.id);
    if (!user) {
      openAuthModal(
        'Beğendiğiniz el yapımı lambaları favori listenize kaydetmek ve profilinizde saklamak için lütfen giriş yapın veya ücretsiz hesap oluşturun.',
        'Favorilere Eklemek İçin Giriş Yapın'
      );
    }
  };

  const images = product?.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80'];

  const currentImage = images[selectedImageIdx] || images[0];

  // Related products from the same category
  const relatedProducts = products
    .filter(p => p.id !== product?.id && (p.categoryId === product?.categoryId || !product?.categoryId))
    .slice(0, 4);

  const selectedColorName = typeof selectedColor === 'string' ? selectedColor : selectedColor?.name;

  const handleSelectColor = (color: ProductColorOption | string) => {
    setSelectedColor(color);
    const imgUrl = typeof color === 'object' ? color.imageUrl : undefined;
    if (imgUrl) {
      const existingIdx = images.findIndex(img => img === imgUrl);
      if (existingIdx !== -1) {
        setSelectedImageIdx(existingIdx);
      }
    }
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    addToCart(product, quantity, selectedColorName);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <SEO
        title={product.name}
        description={product.shortDescription || product.description?.slice(0, 160) || `${product.name} lüks tasarım lamba.`}
        image={images[0]}
        url={window.location.href}
      />

      <main className="flex-1 pb-16">
        {/* Breadcrumb Bar */}
        <div className="border-b border-white/10 bg-[#0C0C0F]/80 backdrop-blur-md">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3.5 flex items-center justify-between">
            <nav className="flex items-center gap-2 text-xs text-zinc-400 overflow-x-auto scrollbar-none">
              <Link to="/" className="hover:text-[#C5A059] transition-colors whitespace-nowrap">
                Ana Sayfa
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
              {category ? (
                <Link 
                  to={`/koleksiyon/${getCategorySlug(category)}`} 
                  className="hover:text-[#C5A059] transition-colors whitespace-nowrap"
                >
                  {category.name}
                </Link>
              ) : (
                <Link to="/#koleksiyon" className="hover:text-[#C5A059] transition-colors whitespace-nowrap">
                  Koleksiyon
                </Link>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
              <span className="text-[#C5A059] font-medium truncate max-w-[200px] sm:max-w-none">
                {product.name}
              </span>
            </nav>

            <button
              onClick={() => navigate(-1)}
              className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Geri Dön</span>
            </button>
          </div>
        </div>

        {/* Product Main Showcase Section */}
        <div className="w-full max-w-7xl xl:max-w-[1500px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
            
            {/* LEFT: Image Gallery (Col 1-5, subtly scaled down) */}
            <div className="lg:col-span-5 space-y-4 max-w-xl mx-auto w-full">
              <div className="relative w-full aspect-square max-h-[520px] rounded-3xl overflow-hidden bg-black/40 border border-white/15 shadow-2xl flex items-center justify-center group">
                {/* Main Product Image (Full Width & Height, No Side Gaps) */}
                <img
                  src={currentImage}
                  alt={product.name}
                  className={`w-full h-full object-cover object-center transition-all duration-300 ${
                    isOutOfStock ? 'grayscale opacity-75 contrast-125' : ''
                  }`}
                />

                {/* Subtle Ambient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                {/* Gallery Navigation Arrows (Same clean style as product cards) */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                      aria-label="Önceki Görsel"
                      className="flex absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 text-white items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] cursor-pointer"
                    >
                      <ChevronLeft className="w-7 h-7 stroke-[2] text-white" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                      aria-label="Sonraki Görsel"
                      className="flex absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 text-white items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] cursor-pointer"
                    >
                      <ChevronRight className="w-7 h-7 stroke-[2] text-white" />
                    </button>
                  </>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                  <span className="glass-panel text-[#C5A059] text-xs uppercase tracking-widest px-3 py-1 rounded-full font-semibold border border-[#C5A059]/40 shadow-lg">
                    {product.categoryName || 'Lüks Koleksiyon'}
                  </span>
                  {isOutOfStock && (
                    <span className="bg-black/90 text-zinc-300 border border-zinc-700 text-xs uppercase tracking-widest px-3 py-1 rounded-full font-bold shadow-lg">
                      Tükendi
                    </span>
                  )}
                  {!isOutOfStock && product.isNewArrival && (
                    <span className="bg-[#C5A059] text-black text-xs uppercase tracking-widest px-3 py-1 rounded-full font-bold shadow-md w-[100px] text-center inline-block">
                      Yeni Seri
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-black/40 ${
                        idx === selectedImageIdx
                          ? 'border-[#C5A059] ring-2 ring-[#C5A059]/50'
                          : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                      } ${isOutOfStock ? 'grayscale' : ''}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover object-center" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Details & Purchase Card (Col 6-12) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Category & Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.3em] text-[#C5A059] font-medium">
                    {product.categoryName || 'Tasarım Aydınlatma'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="p-2.5 rounded-full glass-panel hover:border-[#C5A059] text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Bağlantıyı Kopyala"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleWishlist}
                      className="p-2.5 rounded-full glass-panel hover:border-[#C5A059] text-zinc-400 hover:text-rose-400 transition-colors"
                      title="Favorilere Ekle"
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {copied && (
                  <div className="text-xs text-emerald-400 font-medium">✓ Ürün bağlantısı panoya kopyalandı!</div>
                )}

                <h1 className="font-serif-luxury text-3xl sm:text-4xl text-white leading-tight">
                  {product.name}
                </h1>

                {product.shortDescription && (
                  <p className="text-sm text-zinc-400 font-light leading-relaxed pt-1">
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Price Banner */}
              <div className="p-5 rounded-2xl glass-panel border border-white/10 flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif-luxury text-3xl sm:text-4xl text-[#C5A059] font-bold tracking-tight">
                      {formatCurrency(product.price)}
                    </span>
                    {!!(product.compareAtPrice && product.compareAtPrice > product.price) && (
                      <span className="text-base text-zinc-500 line-through">
                        {formatCurrency(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {settings.productDetailTaxIncludedText || 'Tüm vergiler ve sigortalı kargo dahildir.'}
                  </span>
                </div>

                {isOutOfStock && (
                  <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-950/60 border border-red-800/60 text-red-300">
                    Tükendi
                  </span>
                )}
              </div>

              {/* Color / Finish Variants Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#C5A059]" />
                      <span className="text-xs uppercase tracking-wider text-zinc-300 font-semibold">
                        Gövde / Renk Seçimi:
                      </span>
                    </div>
                    {selectedColorName && (
                      <span className="text-xs font-medium text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-0.5 rounded-full border border-[#C5A059]/30">
                        {selectedColorName}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {product.colors.map((colorOption, cIdx) => {
                      const cName = typeof colorOption === 'string' ? colorOption : colorOption.name;
                      const cHex = typeof colorOption === 'string' ? '#C5A059' : (colorOption.hex || '#C5A059');
                      const isSelected = selectedColorName === cName;

                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => handleSelectColor(colorOption)}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-black/90 text-white border-2 border-[#C5A059] ring-2 ring-[#C5A059]/40 shadow-lg scale-[1.02]'
                              : 'bg-black/40 text-zinc-400 border border-white/10 hover:border-white/30 hover:text-zinc-200'
                          }`}
                        >
                          <span 
                            className="w-4 h-4 rounded-full border border-white/30 shadow-inner flex-shrink-0"
                            style={{ backgroundColor: cHex }} 
                          />
                          <span>{cName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A059] ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Purchase Actions */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3">
                  {/* Quantity */}
                  <div className="flex items-center bg-black/60 border border-white/15 rounded-2xl p-1.5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock}
                      className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={isOutOfStock}
                      className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    id="page-add-to-cart-btn"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 py-4 px-6 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      isOutOfStock
                        ? 'bg-zinc-800/90 text-zinc-500 cursor-not-allowed border border-white/10'
                        : added
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#C5A059] hover:bg-[#d6b26b] text-black shadow-md hover:scale-[1.01]'
                    }`}
                  >
                    {isOutOfStock ? (
                      <span>Tükendi</span>
                    ) : added ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Sepete Eklendi</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        <span>Sepete Ekle ({formatCurrency(product.price * quantity)})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Instant Checkout Button */}
                {!isOutOfStock && (
                  <button
                    onClick={() => onInstantBuy(product, quantity)}
                    className="w-full py-4 glass-panel hover:bg-white/10 text-[#C5A059] border border-[#C5A059]/50 hover:border-[#C5A059] rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Hemen Satın Al (Stripe & 3D Secure)</span>
                  </button>
                )}
              </div>

              {/* Guarantees & Craftsmanship Bento */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bento-card flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Sigortalı Teslimat</h4>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">Ahşap korumalı sandıkta ücretsiz kargo</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bento-card flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">2 Yıl Garanti</h4>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">Orijinal atölye malzeme güvencesi</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bento-card flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">El İşçiliği</h4>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">Floransa & İstanbul usta işçiliği</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bento-card flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C5A059] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">Özel Üretim</h4>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">Her parçaya özel seri numarası</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Full Design Story & Specifications Section */}
          <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Story (Col 1-7) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C5A059] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tasarım Felsefesi & Hikayesi</span>
              </div>
              <h2 className="font-serif-luxury text-3xl text-white">
                Işığın Heykelsi Dansı
              </h2>
              <div className="text-zinc-300 text-sm font-light leading-relaxed space-y-4 whitespace-pre-line">
                {product.description}
              </div>
            </div>

            {/* Technical Specifications Bento Grid (Col 8-12) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-serif-luxury text-xl text-white">
                Teknik Özellikler
              </h3>
              
              <div className="space-y-2.5">
                {product.material && (
                  <div className="p-4 rounded-2xl bento-card flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-zinc-400 text-xs font-medium">
                      <Layers className="w-4 h-4 text-[#C5A059]" />
                      <span>Ana Materyal</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-100">{product.material}</span>
                  </div>
                )}

                {product.dimensions && (
                  <div className="p-4 rounded-2xl bento-card flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-zinc-400 text-xs font-medium">
                      <Ruler className="w-4 h-4 text-[#C5A059]" />
                      <span>Boyutlar & Ölçüler</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-100">{product.dimensions}</span>
                  </div>
                )}

                {product.lightSpecs && (
                  <div className="p-4 rounded-2xl bento-card flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-zinc-400 text-xs font-medium">
                      <Zap className="w-4 h-4 text-[#C5A059]" />
                      <span>Işık & Duy Yapısı</span>
                    </div>
                    <span className="text-xs font-semibold text-zinc-100">{product.lightSpecs}</span>
                  </div>
                )}

                <div className="p-4 rounded-2xl bento-card flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-zinc-400 text-xs font-medium">
                    <Shield className="w-4 h-4 text-[#C5A059]" />
                    <span>Garanti Süresi</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-100">24 Ay Resmi Atölye Garantisi</span>
                </div>
              </div>
            </div>

          </div>

          {/* Related Products in Same Category */}
          {relatedProducts.length > 0 && (
            <div className="mt-20 pt-12 border-t border-white/10 space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs uppercase tracking-[0.25em] text-[#C5A059] font-medium">
                    Benzer Koleksiyon Parçaları
                  </span>
                  <h3 className="font-serif-luxury text-2xl sm:text-3xl text-white mt-1">
                    Bu Tasarımı Beğenenler İçin
                  </h3>
                </div>

                {category && (
                  <Link
                    to={`/koleksiyon/${getCategorySlug(category)}`}
                    className="text-xs uppercase tracking-wider text-[#C5A059] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Tümünü Gör</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onOpenQuickView={onOpenQuickView}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
};
