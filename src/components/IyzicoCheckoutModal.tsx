import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  ArrowLeft,
  Truck,
  Building,
  Tag,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCoupons } from '../context/CouponContext';
import { formatCurrency, formatDate } from '../lib/format';
import { triggerGoldConfetti } from '../lib/confetti';
import { Order, OrderAddress, Product } from '../types';
import { getApiUrl } from '../lib/api';

interface IyzicoCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  directBuyItem?: { product: Product; quantity: number } | null;
}

export const IyzicoCheckoutModal: React.FC<IyzicoCheckoutModalProps> = ({
  isOpen,
  onClose,
  directBuyItem,
}) => {
  const { cart, subtotal: cartSubtotal, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const { 
    appliedCoupon, 
    discountAmount, 
    applyCoupon, 
    removeCoupon, 
    recalculateDiscount
  } = useCoupons();

  // Determine items to checkout
  const items = directBuyItem 
    ? [{ product: directBuyItem.product, quantity: directBuyItem.quantity }]
    : cart;

  const subtotal = directBuyItem 
    ? directBuyItem.product.price * directBuyItem.quantity 
    : cartSubtotal;

  useEffect(() => {
    recalculateDiscount(subtotal);
  }, [subtotal]);

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const shipping = (subtotal - discountAmount > 5000 || subtotal === 0) ? 0 : 250;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const [step, setStep] = useState<'details' | 'payment_init'>('details');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Address Form State
  const [address, setAddress] = useState<OrderAddress>({
    fullName: user?.displayName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    addressLine: '',
    city: 'İstanbul',
    district: '',
    postalCode: '34367',
    country: 'Türkiye'
  });

  const [email, setEmail] = useState(user?.email || '');

  // Update address email when user logs in or changes
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (user?.displayName && !address.fullName) {
      setAddress(prev => ({ ...prev, fullName: user.displayName || '' }));
    }
  }, [user]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleApplyCoupon = (targetEl?: HTMLElement | null) => {
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput, subtotal);
    if (res.success) {
      triggerGoldConfetti(targetEl);
      setCouponFeedback({ type: 'success', message: res.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', message: res.message });
    }
  };

  const handleStartIyzicoPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedFullName = address.fullName.trim();
    const trimmedEmail = (email || address.email || user?.email || '').trim().toLowerCase();
    const trimmedPhone = address.phone.trim();
    const trimmedAddressLine = address.addressLine.trim();

    if (!trimmedFullName || !trimmedEmail || !trimmedAddressLine || !trimmedPhone) {
      setErrorMessage('Lütfen teslimat ve iletişim bilgilerinizi eksiksiz doldurun.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz (örn: isim@ornek.com).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images?.[0] || '',
          price: item.product.price,
          quantity: item.quantity
        })),
        customerName: trimmedFullName,
        customerEmail: trimmedEmail,
        customerPhone: trimmedPhone,
        address: {
          ...address,
          fullName: trimmedFullName,
          email: trimmedEmail,
          phone: trimmedPhone,
          addressLine: trimmedAddressLine
        },
        subtotal,
        discountCode: appliedCoupon?.code,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        appliedCoupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discountType: appliedCoupon.discountType,
          discountValue: appliedCoupon.discountValue
        } : undefined,
        shipping,
        total,
        userId: user?.uid || 'guest',
        notes: address.orderNote || '',
        frontendOrigin: typeof window !== 'undefined' ? window.location.origin : undefined
      };

      const response = await fetch(getApiUrl('/api/iyzico/initialize'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.errorMessage || 'iyzico ödeme oturumu oluşturulamadı.');
      }

      if (data.paymentPageUrl) {
        // Redirect directly to iyzico hosted payment page
        window.location.href = data.paymentPageUrl;
      } else if (data.token) {
        // Sandbox fallback redirect
        window.location.href = `https://sandbox-api.iyzipay.com/payment/iyzipay/checkoutform/${data.token}`;
      } else {
        throw new Error('iyzico ödeme sayfası bağlantısı alınamadı.');
      }

    } catch (err: any) {
      console.error('iyzico payment start error:', err);
      setErrorMessage(err.message || 'Ödeme oturumu başlatılırken bir sorun oluştu. Lütfen tekrar deneyiniz.');
      setLoading(false);
    }
  };

  return (
    <div 
      id="checkout-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in cursor-default"
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 glass-panel my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with prominent close button */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]/95 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-panel border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-base sm:text-lg text-white uppercase tracking-wider">
                iyzico ile Güvenli Ödeme
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[#C5A059]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PCI-DSS Seviye 1 • 3D Secure &amp; TLS Güvenlik</span>
              </div>
            </div>
          </div>
          
          <button
            id="close-checkout-btn"
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Pencereyi Kapat"
            title="Kapat (ESC)"
            className="p-2.5 text-zinc-300 hover:text-white rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Security Badge Banner */}
        <div className="bg-gradient-to-r from-[#17171d] via-[#1a1714] to-[#17171d] px-6 py-2.5 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-zinc-300">
            <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Tüm banka ve kredi kartları ile peşin / taksitli ödeme</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#C5A059]">
            <span className="px-1.5 py-0.5 rounded bg-black/50 border border-[#C5A059]/30">iyzico Sandbox</span>
            <span className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10">3D Secure</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleStartIyzicoPayment} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Guest / Account Info Notice */}
            {!user && (
              <div className="p-4 rounded-2xl bg-[#181820]/80 border border-[#C5A059]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="text-white font-medium flex items-center gap-1.5">
                    <span className="text-[#C5A059]">✨</span>
                    <span>Misafir Olarak Satın Alıyorsunuz</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Ad Soyad, telefon, e-posta ve açık teslimat adresi bilgilerinizi doldurarak hızlıca sipariş verebilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal('Kayıtlı teslimat adreslerinizi kullanmak için lütfen giriş yapın.', 'Giriş Yaparak Satın Al');
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-[#C5A059]/20 hover:text-[#C5A059] text-zinc-300 border border-white/10 hover:border-[#C5A059]/40 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all shrink-0 cursor-pointer"
                >
                  Giriş Yap / Üye Ol
                </button>
              </div>
            )}

            {/* Customer Information */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5A059] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> 1. Teslimat & İletişim Bilgileri {!user && '(Misafir)'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="Örn: Ege Çağan"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    E-Posta Adresi *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ege@example.com"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Telefon Numarası *
                  </label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="+90 555 000 0000"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Şehir *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="İstanbul"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Açık Teslimat Adresi *
                </label>
                <textarea
                  required
                  rows={2}
                  value={address.addressLine}
                  onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                  placeholder="Mahalle, Cadde, Sokak, No, Daire..."
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    İlçe
                  </label>
                  <input
                    type="text"
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    placeholder="Şişli / Nişantaşı"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    placeholder="34367"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div className="pt-2">
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-medium flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#C5A059]" /> İndirim Kuponu / Promosyon Kodu
              </label>
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-emerald-300">{appliedCoupon.code}</span>
                    <span className="text-[11px] text-emerald-400">(-{formatCurrency(discountAmount)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCoupon()}
                    className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase().trim())}
                      placeholder="İndirim Kupon Kodu"
                      className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-200 font-mono tracking-wider focus:border-[#C5A059] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = (e.currentTarget.nextElementSibling as HTMLElement) || e.currentTarget;
                          handleApplyCoupon(btn);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => handleApplyCoupon(e.currentTarget)}
                      className="px-4 py-2 bg-white/10 hover:bg-[#C5A059] hover:text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                    >
                      Uygula
                    </button>
                  </div>
                  {couponFeedback && (
                    <div className={`text-[11px] p-1.5 rounded flex items-center gap-1 ${
                      couponFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {couponFeedback.type === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{couponFeedback.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Items Preview & Price Breakdown */}
            <div className="mt-4 p-4 rounded-2xl bento-card space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold flex justify-between">
                <span>Sipariş Edilen Ürünler ({items.length})</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {items.slice(0, 2).map((it) => (
                <div key={it.product.id} className="text-xs text-zinc-300 flex justify-between">
                  <span className="truncate max-w-[280px]">{it.product.name} × {it.quantity}</span>
                  <span className="text-zinc-400">{formatCurrency(it.product.price * it.quantity)}</span>
                </div>
              ))}
              {discountAmount > 0 && (
                <div className="text-xs text-emerald-400 font-semibold flex justify-between pt-1 border-t border-white/5">
                  <span>Kupon İndirimi ({appliedCoupon?.code}):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="text-xs text-zinc-400 flex justify-between">
                <span>Sigortalı Ahşap Sandık Kargo:</span>
                <span>{shipping === 0 ? <span className="text-emerald-400 font-semibold">ÜCRETSİZ</span> : formatCurrency(shipping)}</span>
              </div>
              <div className="text-sm font-bold text-white flex justify-between pt-2 border-t border-white/10">
                <span>Toplam Ödenecek Tutar:</span>
                <span className="text-[#C5A059] font-serif-luxury text-base">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Submit to iyzico Button */}
            <div className="pt-2 space-y-2.5">
              <button
                id="submit-iyzico-checkout-btn"
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer shadow-lg active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>iyzico Güvenli Ödeme Sayfasına Yönlendiriliyorsunuz...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{formatCurrency(total)} • iyzico ile Güvenli Öde</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </>
                )}
              </button>

              <button
                id="cancel-modal-checkout-btn"
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Alışverişe Devam Et / Pencereyi Kapat</span>
              </button>

              <p className="text-[11px] text-zinc-500 text-center mt-1 flex items-center justify-center gap-1.5 font-light">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Kart bilgileriniz asla saklanmaz, iyzico 3D Secure güvencesiyle işlenir.</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
