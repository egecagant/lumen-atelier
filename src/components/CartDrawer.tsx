import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Sparkles, Tag, Check, AlertCircle, Plus, Minus, UserCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCoupons } from '../context/CouponContext';
import { formatCurrency } from '../lib/format';
import { triggerGoldConfetti } from '../lib/confetti';

interface CartDrawerProps {
  onProceedToCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const navigate = useNavigate();
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    subtotal, 
    shipping, 
    grandTotal 
  } = useCart();
  const { settings } = useSiteSettings();
  const { appliedCoupon, discountAmount, applyCoupon, removeCoupon } = useCoupons();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  // Body scroll lock and ESC key listener
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsCartOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const totalItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const freeShippingThreshold = 5000;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const finalTotal = Math.max(0, subtotal - discountAmount + shipping);

  const handleApplyCoupon = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput, subtotal);
    setCouponFeedback(res.message);
    if (res.success) {
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]') as HTMLElement | null;
      triggerGoldConfetti(submitBtn || e.currentTarget);
      setCouponInput('');
    }
  };

  const handleGoToProduct = (slugOrId: string) => {
    setIsCartOpen(false);
    navigate(`/urun/${slugOrId}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:max-w-md flex">
        <div className="w-full h-full bg-[#0F0F12] sm:border-l border-white/10 text-zinc-100 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif-luxury text-base sm:text-lg text-white uppercase tracking-wider">
                  {settings.cartTitle || 'Alışveriş Sepeti'}
                </h2>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {totalItemCount} {totalItemCount === 1 ? 'ürün' : 'ürün'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 1 && (
                <button
                  onClick={() => clearCart()}
                  className="text-[11px] text-zinc-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  title="Sepeti Boşalt"
                >
                  Temizle
                </button>
              )}
              <button
                id="close-cart-btn"
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Sepeti Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free Shipping Meter */}
          <div className="px-4 sm:px-6 py-3 bg-[#0A0A0A]/90 border-b border-white/10 text-xs flex-shrink-0">
            {remainingForFreeShipping > 0 ? (
              <div className="flex items-center justify-between text-zinc-300 text-[11px] sm:text-xs mb-1.5 font-light">
                <span>
                  Ücretsiz kargo için <span className="text-[#C5A059] font-semibold">{formatCurrency(remainingForFreeShipping)}</span> daha ekleyin
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">%{Math.round(progressToFreeShipping)}</span>
              </div>
            ) : (
              <p className="text-emerald-400 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>{settings.cartFreeShippingReachedText || 'Tebrikler! Ücretsiz sigortalı kargo uygulandı.'}</span>
              </p>
            )}
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#C5A059]/80 to-[#C5A059] h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 bg-[#0A0A0A]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 px-4">
                <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center text-zinc-500">
                  <ShoppingBag className="w-8 h-8 opacity-40 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-lg text-zinc-200">
                    {settings.cartEmptyTitle || 'Sepetiniz Boş'}
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                    {settings.cartEmptyDesc || 'Lüks tasarım aydınlatma koleksiyonumuzdan dilediğiniz eseri sepetinize ekleyebilirsiniz.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    const el = document.getElementById('koleksiyon');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  {settings.cartEmptyBtnText || 'Koleksiyonu Keşfet'}
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const itemKey = item.selectedColor ? `${item.product.id}-${item.selectedColor}` : item.product.id;
                const img = item.product.images?.[0] || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80';
                return (
                  <div 
                    key={itemKey}
                    className="flex gap-3 p-3 bento-card rounded-xl border border-white/10 hover:border-[#C5A059]/30 transition-all"
                  >
                    <button
                      onClick={() => handleGoToProduct(item.product.slug || item.product.id)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-white/10 cursor-pointer group relative"
                    >
                      <img 
                        src={img} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </button>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <button
                            onClick={() => handleGoToProduct(item.product.slug || item.product.id)}
                            className="text-xs sm:text-sm font-semibold text-zinc-100 line-clamp-1 text-left hover:text-[#C5A059] transition-colors"
                          >
                            {item.product.name}
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors p-1 -mt-1 -mr-1 flex-shrink-0"
                            title="Ürünü Sil"
                            aria-label="Ürünü Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[10px] text-[#C5A059] uppercase tracking-wider font-medium truncate">
                            {item.product.categoryName}
                          </span>
                          {item.selectedColor && (
                            <span className="text-[9px] bg-white/10 text-zinc-200 px-1.5 py-0.5 rounded border border-white/10 font-medium">
                              {item.selectedColor}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                        {/* Quantity Stepper with improved touch targets */}
                        <div className="flex items-center border border-white/15 bg-black/60 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
                            aria-label="Miktarı azalt"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold px-2 min-w-[24px] text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor)}
                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
                            aria-label="Miktarı artır"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-bold text-white font-serif-luxury block">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[9px] text-zinc-500 font-mono block">
                              ({formatCurrency(item.product.price)} / adet)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0A0A0A] space-y-3 flex-shrink-0">
              
              {/* Coupon input */}
              <div className="space-y-1 text-xs">
                {appliedCoupon ? (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="font-mono font-bold text-emerald-300 text-xs truncate">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-emerald-400 flex-shrink-0">(-{formatCurrency(discountAmount)})</span>
                    </div>
                    <button
                      onClick={() => removeCoupon()}
                      className="text-zinc-400 hover:text-rose-400 p-1 flex-shrink-0 transition-colors"
                      title="Kuponu Kaldır"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase().trim())}
                      placeholder="İndirim Kupon Kodu"
                      className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-zinc-200 font-mono tracking-wider focus:border-[#C5A059] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-white/10 hover:bg-[#C5A059] hover:text-black text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex-shrink-0"
                    >
                      Uygula
                    </button>
                  </form>
                )}
                {couponFeedback && !appliedCoupon && (
                  <p className="text-[10px] text-rose-400 pl-1">{couponFeedback}</p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-zinc-400">
                  <span>Ara Toplam</span>
                  <span className="text-zinc-200 font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Kupon İndirimi ({appliedCoupon?.code})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Sigortalı Özel Kargo</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-emerald-400 font-semibold">ÜCRETSİZ</span>
                    ) : (
                      <span className="text-zinc-200 font-medium">{formatCurrency(shipping)}</span>
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-baseline text-sm font-bold text-zinc-100">
                  <span>Genel Toplam</span>
                  <span className="font-serif-luxury text-lg sm:text-xl text-[#C5A059]">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Action Buttons */}
              <div className="space-y-2">
                <button
                  id="cart-checkout-btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    if (onProceedToCheckout) {
                      onProceedToCheckout();
                    } else {
                      navigate('/odeme');
                    }
                  }}
                  className="w-full py-3.5 sm:py-4 bg-[#C5A059] hover:bg-[#d6b26b] active:scale-[0.99] text-black text-xs sm:text-sm font-bold uppercase tracking-[0.2em] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>{settings.cartCheckoutBtnText || 'Güvenli Ödeme & Adres Girişi'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="cart-guest-checkout-btn"
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/misafir-odeme');
                  }}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 active:scale-[0.99] text-zinc-300 hover:text-white border border-white/10 hover:border-[#C5A059]/40 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Misafir Olarak Satın Al (Hızlı Sipariş)</span>
                </button>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                <span className="truncate">{settings.cartSecurityBadgeText || '256-Bit SSL & 3D Secure Güvenli Altyapı'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
