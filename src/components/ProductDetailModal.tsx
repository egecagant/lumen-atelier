import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
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
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Palette
} from 'lucide-react';
import { Product, ProductColorOption } from '../types';
import { formatCurrency } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getProductSlug } from '../lib/slugify';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onInstantCheckout?: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onInstantCheckout,
}) => {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { user, openAuthModal } = useAuth();
  const { settings } = useSiteSettings();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<ProductColorOption | string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle ESC key and scroll lock & Reset state on product change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (product) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setSelectedImageIdx(0);
      setQuantity(1);
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      } else {
        setSelectedColor(null);
      }
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [product, onClose]);

  if (!product) return null;

  const isOutOfStock = product.stockStatus === 'out_of_stock' || (typeof product.stockQuantity === 'number' && product.stockQuantity <= 0);
  const productSlug = getProductSlug(product);

  const handleGoToFullPage = () => {
    onClose();
    navigate(`/urun/${productSlug}`);
  };

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80'];

  const currentImage = images[selectedImageIdx] || images[0];
  const isFavorite = isWishlisted(product.id);

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

  const handleWishlist = () => {
    toggleWishlist(product.id);
    if (!user) {
      openAuthModal(
        'Beğendiğiniz el yapımı tasarım lambaları favori listenize kaydetmek ve profilinizde saklamak için lütfen giriş yapın veya ücretsiz hesap oluşturun.',
        'Favorilere Eklemek İçin Giriş Yapın'
      );
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
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
    <div 
      id="product-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in cursor-default"
    >
      <div 
        className="relative w-full max-w-5xl bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 max-h-[92vh] flex flex-col md:flex-row my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-detail-modal-btn"
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          title="Kapat (ESC)"
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 text-zinc-300 hover:text-white hover:bg-black/95 border border-white/15 transition-all cursor-pointer shadow-lg active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Gallery */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 bg-[#0A0A0A] flex flex-col justify-start border-b md:border-b-0 md:border-r border-white/10">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center border border-white/10 shadow-inner">
            <img
              src={currentImage}
              alt={product.name}
              className={`w-full h-full object-cover object-center transition-all duration-300 ${
                isOutOfStock ? 'grayscale opacity-75 contrast-125' : ''
              }`}
            />

            {/* Navigation Arrows for Modal (Same clean style as product cards) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                  aria-label="Önceki Görsel"
                  className="flex absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2] text-white" />
                </button>
                <button
                  onClick={() => setSelectedImageIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                  aria-label="Sonraki Görsel"
                  className="flex absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 text-white items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6 stroke-[2] text-white" />
                </button>
              </>
            )}

            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
              <span className="glass-panel text-[#C5A059] text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-semibold border border-[#C5A059]/30">
                {product.categoryName || 'Lüks Aydınlatma'}
              </span>
              {isOutOfStock && (
                <span className="bg-black/90 text-zinc-300 border border-zinc-700 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold backdrop-blur-md shadow-lg">
                  {settings.productCardOutOfStockText || 'Tükendi'}
                </span>
              )}
            </div>
          </div>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-black/40 ${
                    idx === selectedImageIdx
                      ? 'border-[#C5A059] ring-1 ring-[#C5A059]'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  } ${isOutOfStock ? 'grayscale' : ''}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover object-center" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Specifications & Order Actions */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto max-h-[80vh] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-[0.25em] text-[#C5A059] font-medium">
                  {product.categoryName || 'Tasarım Koleksiyonu'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full glass-panel hover:border-[#C5A059] text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Bağlantıyı Kopyala"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleWishlist}
                    className="p-2 rounded-full glass-panel hover:border-[#C5A059] text-zinc-400 hover:text-rose-400 transition-colors"
                    title="Favorilere Ekle"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                  </button>
                </div>
              </div>

              {copied && (
                <div className="text-[11px] text-emerald-400 mb-1">✓ Ürün linki kopyalandı!</div>
              )}

              <h2 
                onClick={handleGoToFullPage}
                className="font-serif-luxury text-2xl sm:text-3xl text-white leading-tight hover:text-[#C5A059] transition-colors cursor-pointer"
                title="Tam Sayfada Görüntüle"
              >
                {product.name}
              </h2>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-3 py-2 border-y border-white/10">
              <span className="font-serif-luxury text-3xl text-[#C5A059] font-semibold tracking-wide">
                {formatCurrency(product.price)}
              </span>
              {!!(product.compareAtPrice && product.compareAtPrice > product.price) && (
                <span className="text-base text-zinc-500 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
              )}
              <span className="text-xs text-zinc-400 ml-auto">
                {settings.productDetailTaxIncludedText || 'KDV Dahil'}
              </span>
            </div>

            {/* Color / Finish Variants Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span className="text-[11px] uppercase tracking-wider text-zinc-300 font-semibold">
                      Renk / Gövde:
                    </span>
                  </div>
                  {selectedColorName && (
                    <span className="text-[11px] font-medium text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md border border-[#C5A059]/30">
                      {selectedColorName}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {product.colors.map((colorOption, cIdx) => {
                    const cName = typeof colorOption === 'string' ? colorOption : colorOption.name;
                    const cHex = typeof colorOption === 'string' ? '#C5A059' : (colorOption.hex || '#C5A059');
                    const isSelected = selectedColorName === cName;

                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleSelectColor(colorOption)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-black/90 text-white border-2 border-[#C5A059] ring-1 ring-[#C5A059]/50 shadow'
                            : 'bg-black/40 text-zinc-400 border border-white/10 hover:border-white/30 hover:text-zinc-200'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white/30 shadow-inner flex-shrink-0"
                          style={{ backgroundColor: cHex }} 
                        />
                        <span>{cName}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#C5A059]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                {settings.productDetailStoryTitle || 'Tasarım Hikayesi'}
              </h4>
              <p className="text-sm text-zinc-300 font-light leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Specifications Cards */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
              {product.material && (
                <div className="p-3 bento-card rounded-xl">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-1">
                    <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{settings.productDetailMaterialLabel || 'Materyal'}</span>
                  </div>
                  <p className="text-zinc-200 text-[11px]">{product.material}</p>
                </div>
              )}

              {product.dimensions && (
                <div className="p-3 bento-card rounded-xl">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-1">
                    <Ruler className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{settings.productDetailDimensionsLabel || 'Boyutlar'}</span>
                  </div>
                  <p className="text-zinc-200 text-[11px]">{product.dimensions}</p>
                </div>
              )}

              {product.lightSpecs && (
                <div className="p-3 bento-card rounded-xl">
                  <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-1">
                    <Zap className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{settings.productDetailLightSpecsLabel || 'Işık & Duy'}</span>
                  </div>
                  <p className="text-zinc-200 text-[11px]">{product.lightSpecs}</p>
                </div>
              )}

              <div className="p-3 bento-card rounded-xl">
                <div className="flex items-center gap-1.5 text-zinc-400 font-medium mb-1">
                  <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>{settings.productDetailWarrantyTitle || 'Garanti & Kalite'}</span>
                </div>
                <p className="text-zinc-200 text-[11px]">{settings.productDetailWarrantyText || '2 Yıl Atölye Garantisi'}</p>
              </div>
            </div>

            {/* Delivery banner */}
            <div className="p-3.5 rounded-xl glass-panel flex items-center gap-3 text-xs text-zinc-300">
              <Truck className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
              <span>{settings.productDetailShippingBanner || 'Özel ahşap sandıklı korumalı paketleme & ücretsiz sigortalı teslimat.'}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity Stepper */}
              <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStock}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                id="modal-add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-zinc-800/90 text-zinc-500 cursor-not-allowed border border-white/10'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#C5A059] hover:bg-[#d6b26b] text-black shadow-md'
                }`}
              >
                {isOutOfStock ? (
                  <span>Tükendi</span>
                ) : added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Sepete Eklendi</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{settings.productDetailAddToCartText || 'Sepete Ekle'} ({formatCurrency(product.price * quantity)})</span>
                  </>
                )}
              </button>
            </div>

            {onInstantCheckout && !isOutOfStock && (
              <button
                onClick={() => {
                  onClose();
                  onInstantCheckout(product, quantity);
                }}
                className="w-full py-3 glass-panel hover:bg-white/10 text-[#C5A059] border border-[#C5A059]/40 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{settings.productDetailInstantCheckoutText || 'Hemen Al & Stripe ile Güvenli Öde'}</span>
              </button>
            )}

            <button
              onClick={handleGoToFullPage}
              className="w-full py-2 text-zinc-400 hover:text-white text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Ürünü Tam Sayfada Görüntüle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
