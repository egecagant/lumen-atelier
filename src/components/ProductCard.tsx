import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, Heart, Sparkles, Check, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getProductSlug } from '../lib/slugify';

interface ProductCardProps {
  product: Product;
  onOpenQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenQuickView,
}) => {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { settings } = useSiteSettings();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80'];

  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] || images[0];
  const productSlug = getProductSlug(product);

  const handleCardClick = () => {
    navigate(`/urun/${productSlug}`);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stockStatus === 'out_of_stock') return;
    addToCart(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenQuickView) {
      onOpenQuickView(product);
    } else {
      navigate(`/urun/${productSlug}`);
    }
  };

  const isFavorite = isWishlisted(product.id);

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className="group relative flex flex-col bento-card rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
    >
      {/* Product Image Frame */}
      <div className="relative w-full aspect-[4/5] bg-black/50 overflow-hidden">
        {/* Main Image */}
        <img
          src={currentImage}
          alt={product.name}
          className="w-full h-full object-cover object-center"
        />

        {/* Ambient Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E11] via-transparent to-black/20 opacity-90 pointer-events-none" />

        {/* Manual Image Navigation Arrows (prev/next) */}
        {hasMultipleImages && (
          <>
            <button
              id={`prev-image-btn-${product.id}`}
              onClick={handlePrevImage}
              aria-label="Önceki Görsel"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 focus:outline-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2] text-white" />
            </button>

            <button
              id={`next-image-btn-${product.id}`}
              onClick={handleNextImage}
              aria-label="Sonraki Görsel"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 focus:outline-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2] text-white" />
            </button>

            {/* Subtle Image Indicator Dots */}
            <div className="absolute bottom-3 sm:bottom-16 inset-x-0 z-10 flex justify-center gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex
                      ? 'w-3 bg-white'
                      : 'w-1 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 z-10 flex flex-col gap-1 pointer-events-none">
          {product.stockStatus === 'out_of_stock' && (
            <span className="bg-black/85 text-zinc-400 border border-zinc-700/80 text-[8px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium backdrop-blur-md">
              {settings.productCardOutOfStockText || 'Tükendi'}
            </span>
          )}
          {product.stockStatus === 'preorder' && (
            <span className="bg-amber-950/85 text-amber-300 border border-amber-800/60 text-[8px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium backdrop-blur-md">
              {settings.productCardPreorderText || 'Ön Sipariş'}
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-[#C5A059] text-black text-[8px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold shadow-md">
              {settings.productCardNewArrivalText || 'Yeni Seri'}
            </span>
          )}
          {product.featured && (
            <span className="bg-black/75 text-[#C5A059] border border-[#C5A059]/40 text-[8px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium backdrop-blur-md inline-flex items-center gap-0.5 sm:gap-1">
              <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-[#C5A059]" /> Özel
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          id={`wishlist-btn-${product.id}`}
          onClick={handleWishlist}
          aria-label="Favorilere Ekle"
          className={`absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-20 p-1.5 sm:p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
            isFavorite
              ? 'bg-rose-950/90 text-rose-400 border border-rose-700/80 shadow-md'
              : 'bg-black/50 text-zinc-400 hover:text-white hover:bg-black/80 border border-white/10 hover:border-[#C5A059]/50'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
        </button>

        {/* Quick Action Overlay (Desktop Hover) */}
        <div className="hidden sm:flex absolute inset-x-3.5 bottom-3.5 z-20 items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button
            id={`quick-view-btn-${product.id}`}
            onClick={handleQuickView}
            className="flex-1 py-2 bg-black/80 hover:bg-black text-zinc-200 text-[11px] font-semibold uppercase tracking-wider rounded-xl border border-white/15 backdrop-blur-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>{settings.productCardDetailBtnText || 'İncele'}</span>
          </button>

          <button
            id={`quick-add-btn-${product.id}`}
            onClick={handleAddToCart}
            disabled={product.stockStatus === 'out_of_stock'}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              product.stockStatus === 'out_of_stock'
                ? 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : addedAnimation
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#C5A059] hover:bg-[#d6b26b] text-black shadow-md'
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{settings.productCardAddedBtnText || 'Eklendi'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{settings.productCardAddBtnText || 'Sepete'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 bg-gradient-to-b from-transparent to-black/20">
        <div>
          {/* Category Tag */}
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-medium block mb-0.5 sm:mb-1 truncate">
            {product.categoryName || 'Tasarım Aydınlatma'}
          </span>

          {/* Title */}
          <h3 className="font-serif-luxury text-sm sm:text-base lg:text-lg text-zinc-100 sm:group-hover:text-[#C5A059] transition-colors leading-snug line-clamp-1 sm:line-clamp-2">
            {product.name}
          </h3>

          {/* Short description / materials (desktop only to preserve compact mobile height) */}
          {product.shortDescription ? (
            <p className="hidden sm:block text-xs text-zinc-400 font-light line-clamp-1 sm:line-clamp-2 mt-1 leading-relaxed">
              {product.shortDescription}
            </p>
          ) : product.material ? (
            <p className="hidden sm:block text-xs text-zinc-500 font-light line-clamp-1 mt-1">
              {product.material}
            </p>
          ) : null}
        </div>

        {/* Price & Stock info / Mobile Fast Action */}
        <div className="pt-2 sm:pt-3 border-t border-white/5 flex items-center justify-between gap-1.5">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span className="font-semibold text-xs sm:text-base lg:text-lg text-white tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {!!(product.compareAtPrice && product.compareAtPrice > product.price) && (
              <span className="text-[10px] sm:text-xs text-zinc-500 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Stock badge */}
            <span className="hidden md:inline-block text-[10px] text-zinc-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
              {product.stockStatus === 'in_stock' ? `${product.stockQuantity || 'Var'} Stok` : 'Özel Seri'}
            </span>

            {/* Mobile Direct Add to Cart Quick Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stockStatus === 'out_of_stock'}
              aria-label="Sepete Ekle"
              className={`sm:hidden p-2 rounded-lg transition-all flex items-center justify-center ${
                product.stockStatus === 'out_of_stock'
                  ? 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                  : addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#C5A059] active:bg-[#d6b26b] text-black'
              }`}
            >
              {addedAnimation ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
