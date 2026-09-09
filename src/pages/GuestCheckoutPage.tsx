import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Building2, 
  ArrowLeft, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Tag, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  FileText, 
  AlertCircle, 
  Check, 
  Percent,
  Clock,
  HelpCircle,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCoupons } from '../context/CouponContext';
import { formatCurrency, formatDate } from '../lib/format';
import { triggerGoldConfetti } from '../lib/confetti';
import { Order, OrderAddress, Product } from '../types';
import { getApiUrl } from '../lib/api';
import { SEO } from '../components/SEO';
import { COMPANY } from '../lib/companyInfo';

const TURKISH_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 
  'Gaziantep', 'Muğla', 'Eskişehir', 'Kocaeli', 'Mersin', 'Kayseri', 
  'Samsun', 'Balıkesir', 'Trabzon', 'Denizli', 'Aydın', 'Tekirdağ', 'Sakarya'
];

export const GuestCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, subtotal, shipping, grandTotal, clearCart } = useCart();
  const { user, openAuthModal } = useAuth();
  const { 
    appliedCoupon, 
    discountAmount, 
    applyCoupon, 
    removeCoupon, 
    coupons,
    recalculateDiscount,
    recordCouponUsage
  } = useCoupons();

  // State for direct buy single product if passed via state
  const directProduct = location.state?.directBuyProduct as { product: Product; quantity: number } | undefined;
  const items = directProduct 
    ? [{ product: directProduct.product, quantity: directProduct.quantity }]
    : cart;

  const currentSubtotal = directProduct 
    ? directProduct.product.price * directProduct.quantity 
    : subtotal;

  // Recalculate discount whenever subtotal changes
  useEffect(() => {
    recalculateDiscount(currentSubtotal);
  }, [currentSubtotal]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'iyzico' | 'bank_transfer' | 'cash_on_delivery'>('iyzico');

  // Coupon Input State
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Address Form State - Specifically for Guest Checkout
  const [address, setAddress] = useState<OrderAddress>({
    fullName: '',
    phone: '',
    email: '',
    addressLine: '',
    city: 'İstanbul',
    district: '',
    postalCode: '34367',
    country: 'Türkiye',
    invoiceType: 'individual',
    companyName: '',
    taxOffice: '',
    taxNumber: '',
    idNumber: '',
    orderNote: ''
  });

  const [termsAccepted, setTermsAccepted] = useState(true);

  // Order processing state
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');

  // Calculations
  const shippingCost = (currentSubtotal - discountAmount > 5000 || currentSubtotal === 0) ? 0 : 250;
  const paymentDiscount = paymentMethod === 'bank_transfer' ? Math.round((currentSubtotal - discountAmount) * 0.03) : 0;
  const finalPayableTotal = Math.max(0, currentSubtotal - discountAmount - paymentDiscount + shippingCost);

  const handleApplyCoupon = (targetEl?: HTMLElement | null) => {
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput, currentSubtotal);
    if (res.success) {
      triggerGoldConfetti(targetEl);
      setCouponFeedback({ type: 'success', message: res.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', message: res.message });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponFeedback(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Sepetinizde ürün bulunmamaktadır.');
      navigate('/');
      return;
    }

    const trimmedFullName = address.fullName.trim();
    const trimmedEmail = address.email.trim().toLowerCase();
    const trimmedPhone = address.phone.trim();
    const trimmedAddressLine = address.addressLine.trim();

    // MANDATORY 4 GUEST FIELDS VALIDATION
    if (!trimmedFullName) {
      alert('Lütfen İsim Soyisim alanını doldurunuz.');
      return;
    }
    if (!trimmedEmail) {
      alert('Lütfen Mail Adresi (E-posta) alanını doldurunuz.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert('Lütfen geçerli bir e-posta adresi giriniz (örn: isim@ornek.com).');
      return;
    }
    if (!trimmedPhone) {
      alert('Lütfen Telefon Numarası alanını doldurunuz.');
      return;
    }
    if (!trimmedAddressLine) {
      alert('Lütfen Normal Açık Adres alanını eksiksiz doldurunuz.');
      return;
    }

    if (address.invoiceType === 'corporate' && (!address.companyName || !address.taxNumber)) {
      alert('Lütfen kurumsal fatura için Firma Adı ve Vergi Numarasını giriniz.');
      return;
    }

    if (!termsAccepted) {
      alert('Lütfen mesafeli satış sözleşmesini ve gizlilik koşullarını onaylayınız.');
      return;
    }

    setLoading(true);

    // Online card payment
    if (paymentMethod === 'iyzico') {
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
          subtotal: currentSubtotal,
          discountCode: appliedCoupon?.code,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          appliedCoupon: appliedCoupon ? {
            code: appliedCoupon.code,
            discountType: appliedCoupon.discountType,
            discountValue: appliedCoupon.discountValue
          } : undefined,
          shipping: shippingCost,
          total: finalPayableTotal,
          userId: user?.uid || 'guest',
          isGuestOrder: true,
          notes: address.orderNote || '',
          frontendOrigin: typeof window !== 'undefined' ? window.location.origin : undefined
        };

        const res = await fetch(getApiUrl('/api/iyzico/initialize'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.errorMessage || 'Ödeme oturumu başlatılamadı.');
        }

        if (data.paymentPageUrl) {
          window.location.href = data.paymentPageUrl;
          return;
        } else if (data.token) {
          window.location.href = `https://sandbox-api.iyzipay.com/payment/iyzipay/checkoutform/${data.token}`;
          return;
        } else {
          throw new Error('Ödeme bağlantısı bulunamadı.');
        }
      } catch (err: any) {
        console.error('Payment start error:', err);
        alert(err.message || 'Ödeme başlatılırken bir hata oluştu. Lütfen tekrar deneyiniz.');
        setLoading(false);
        return;
      }
    }

    // Bank transfer or cash on delivery
    try {
      const orderPayload = {
        userId: user?.uid || 'guest',
        isGuestOrder: true,
        customerEmail: trimmedEmail,
        customerName: trimmedFullName,
        customerPhone: trimmedPhone,
        address: {
          ...address,
          fullName: trimmedFullName,
          email: trimmedEmail,
          phone: trimmedPhone,
          addressLine: trimmedAddressLine
        },
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images?.[0] || '',
          quantity: item.quantity
        })),
        discountCode: appliedCoupon?.code,
        paymentMethod,
        notes: address.orderNote || ''
      };

      const res = await fetch(getApiUrl('/api/orders/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.errorMessage || 'Sipariş oluşturulamadı.');
      }

      const completed: Order = data.order;

      setCompletedOrder(completed);
      setStep('success');

      // Record coupon usage if coupon was applied
      if (appliedCoupon) {
        recordCouponUsage(appliedCoupon.id).catch((e) => console.warn('Could not record coupon usage:', e));
      }

      // Clear cart
      if (!directProduct) {
        clearCart();
      }

      // Confetti celebration
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#C5A059', '#e6c34f', '#ffffff', '#a8893d']
      });

    } catch (err: any) {
      console.error('Order error:', err);
      alert(err.message || 'Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  // If cart is empty and not direct buy and not in success step
  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen bg-[#070709] text-zinc-200 flex flex-col justify-center items-center p-4">
        <SEO title="Misafir Olarak Satın Al" description="LUMEN Atelier Üyeliksiz Hızlı Sipariş" />
        <div className="max-w-md w-full text-center space-y-5 p-8 bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl glass-panel">
          <div className="w-16 h-16 rounded-2xl glass-panel border border-white/10 flex items-center justify-center mx-auto text-[#C5A059]">
            <ShoppingBag className="w-8 h-8 opacity-60" />
          </div>
          <div>
            <h2 className="font-serif-luxury text-2xl text-white uppercase tracking-wider">Sepetiniz Boş</h2>
            <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
              Misafir olarak sipariş verebilmek için lütfen önce koleksiyonumuzdan beğendiğiniz el yapımı lambayı sepetinize ekleyin.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Koleksiyonu İncele</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-200 selection:bg-[#C5A059] selection:text-black">
      <SEO 
        title="Misafir Olarak Satın Al | Üyeliksiz Hızlı Sipariş" 
        description="LUMEN Atelier d'Art üyelik oluşturmadan İsim Soyisim, Telefon, E-posta ve Adres bilgilerinizle anında güvenli sipariş verin." 
      />

      {/* Top Notice Bar */}
      <div className="bg-[#0E0E12] border-b border-white/10 py-2.5 px-4 sm:px-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
        <span>Tüm siparişler 256-bit SSL şifrelemeli altyapı ve sigortalı ahşap kasa teslimatı ile korunmaktadır.</span>
      </div>

      {step === 'checkout' && (
        <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
          {/* Breadcrumb Steps */}
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold mb-6 text-zinc-400">
            <Link to="/" className="hover:text-zinc-200 transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <Link to="/begenilenler" className="hover:text-zinc-200 transition-colors">Beğenilenler</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[#C5A059] font-bold">Misafir Olarak Satın Al</span>
          </div>

          {/* PAGE HERO HEADER */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#171720] via-[#121218] to-[#0D0D11] border border-[#C5A059]/40 p-6 sm:p-8 lg:p-10 mb-8 shadow-2xl">
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] text-[11px] font-bold uppercase tracking-widest">
                  <User className="w-3.5 h-3.5" />
                  <span>Üyeliksiz Hızlı Sipariş Sayfası</span>
                </div>
                <h1 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl text-white uppercase tracking-wider">
                  Misafir Olarak Satın Al
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-2xl leading-relaxed">
                  Hesap açmanıza veya şifre belirlemenize gerek yoktur. Siparişinizin sorunsuz teslimatı için aşağıdaki <span className="text-white font-medium">4 zorunlu bilgiyi</span> (İsim Soyisim, Telefon Numarası, Mail Adresi ve Açık Adres) girerek alışverişinizi güvenle tamamlayabilirsiniz.
                </p>
              </div>

              {/* Already have an account? switch button */}
              <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 text-center sm:text-right space-y-2">
                <div className="text-[11px] text-zinc-400">
                  Mevcut bir LUMEN Atelier hesabınız var mı?
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => openAuthModal('Kayıtlı adresleriniz ve sipariş takibiniz için giriş yapabilirsiniz.', 'Giriş Yaparak Satın Al')}
                    className="px-4 py-2.5 bg-white/10 hover:bg-[#C5A059] hover:text-black text-zinc-200 border border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Giriş Yap
                  </button>
                  <Link
                    to="/odeme"
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Standart Ödeme</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Customer, Address & Payment (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* SECTION 1: Customer Contact Info (Ad Soyad, Mail, Telefon) */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 glass-panel shadow-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-serif-luxury font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Müşteri & İletişim Bilgileri</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-normal">Zorunlu</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Sipariş onayınız, dijital e-faturanız ve kargo takip SMS bildirimi bu bilgilere ulaştırılır.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block uppercase tracking-wider text-zinc-300 mb-1.5 font-semibold flex items-center justify-between">
                      <span>İsim Soyisim (Ad Soyad) *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        placeholder="Örn: Ege Çağan"
                        className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none transition-colors"
                      />
                      <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-zinc-300 mb-1.5 font-semibold flex items-center justify-between">
                      <span>Mail Adresi (E-Posta) *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={address.email}
                        onChange={(e) => setAddress({ ...address, email: e.target.value })}
                        placeholder="ornek@domain.com"
                        className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none transition-colors"
                      />
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block uppercase tracking-wider text-zinc-300 mb-1.5 font-semibold flex items-center justify-between">
                      <span>Telefon Numarası (Kargo Takip & SMS) *</span>
                      <span className="text-[10px] text-zinc-400 font-light lowercase">kurye teslimatı için gereklidir</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        placeholder="+90 (555) 000 00 00"
                        className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none transition-colors"
                      />
                      <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Delivery Address (Normal Açık Adres, İl, İlçe, vb.) */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 glass-panel shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-serif-luxury font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Teslimat ve Açık Adres</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-normal">Zorunlu</span>
                      </h3>
                      <p className="text-[11px] text-zinc-400">Ürünleriniz özel korumalı ahşap sandıkta adrese sigortalı kargo ile ulaştırılır.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* City & District */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase tracking-wider text-zinc-300 mb-1.5 font-semibold">
                        Şehir / İl *
                      </label>
                      <select
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/15 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                      >
                        {TURKISH_CITIES.map(c => (
                          <option key={c} value={c} className="bg-[#121216] text-zinc-200">{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block uppercase tracking-wider text-zinc-300 mb-1.5 font-semibold">
                        İlçe *
                      </label>
                      <input
                        type="text"
                        required
                        value={address.district}
                        onChange={(e) => setAddress({ ...address, district: e.target.value })}
                        placeholder="Örn: Kadıköy / Çankaya"
                        className="w-full px-4 py-3 bg-black/40 border border-white/15 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Address Line - CRITICAL MANDATORY */}
                  <div>
                    <label className="block uppercase tracking-wider text-zinc-300 mb-1.5 font-semibold flex items-center justify-between">
                      <span>Normal Açık Adres (Mahalle, Cadde, Sokak, No, Daire) *</span>
                      <span className="text-[10px] text-[#C5A059]">Tam Adres</span>
                    </label>
                    <div className="relative">
                      <textarea
                        required
                        rows={3}
                        value={address.addressLine}
                        onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                        placeholder="Örn: Fenerbahçe Mah. Dr. Faruk Ayanoğlu Cad. No: 12 Daire: 4"
                        className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none resize-none"
                      />
                      <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {/* Postal Code & Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                        Posta Kodu
                      </label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="34367"
                        className="w-full px-4 py-3 bg-black/40 border border-white/15 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                        Ülke
                      </label>
                      <input
                        type="text"
                        disabled
                        value="Türkiye"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Invoice Type Selection */}
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <label className="block uppercase tracking-wider text-zinc-300 font-semibold">
                      Fatura Tercihi
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAddress({ ...address, invoiceType: 'individual' })}
                        className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          address.invoiceType === 'individual'
                            ? 'bg-[#C5A059]/15 border-[#C5A059] text-[#C5A059]'
                            : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Bireysel Fatura</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAddress({ ...address, invoiceType: 'corporate' })}
                        className={`py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          address.invoiceType === 'corporate'
                            ? 'bg-[#C5A059]/15 border-[#C5A059] text-[#C5A059]'
                            : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Kurumsal Fatura</span>
                      </button>
                    </div>

                    {address.invoiceType === 'corporate' && (
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 animate-in fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-zinc-300 mb-1">Şirket / Firma Unvanı *</label>
                            <input
                              type="text"
                              required={address.invoiceType === 'corporate'}
                              value={address.companyName}
                              onChange={(e) => setAddress({ ...address, companyName: e.target.value })}
                              placeholder="Örn: LUMEN Mimarlık Ltd. Şti."
                              className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-300 mb-1">Vergi Dairesi</label>
                            <input
                              type="text"
                              value={address.taxOffice}
                              onChange={(e) => setAddress({ ...address, taxOffice: e.target.value })}
                              placeholder="Örn: Beşiktaş V.D."
                              className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-zinc-300 mb-1">Vergi Numarası / VKN *</label>
                            <input
                              type="text"
                              required={address.invoiceType === 'corporate'}
                              value={address.taxNumber}
                              onChange={(e) => setAddress({ ...address, taxNumber: e.target.value })}
                              placeholder="10 Haneli Vergi Kimlik No"
                              className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Note */}
                  <div className="pt-2">
                    <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Sipariş & Teslimat Notu (İsteğe Bağlı)
                    </label>
                    <input
                      type="text"
                      value={address.orderNote}
                      onChange={(e) => setAddress({ ...address, orderNote: e.target.value })}
                      placeholder="Örn: Zili çalmayınız, güvenliğe bırakabilirsiniz veya özel hediye paketi rica ederim."
                      className="w-full px-4 py-3 bg-black/40 border border-white/15 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Payment Method */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 glass-panel shadow-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-serif-luxury font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider">
                      Ödeme Yöntemi
                    </h3>
                    <p className="text-[11px] text-zinc-400">Tüm ödemeler 3D Secure ve SSL güvenliği altındadır.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Credit Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('iyzico')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'iyzico'
                        ? 'bg-[#C5A059]/15 border-[#C5A059] text-white shadow-lg'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'iyzico' ? 'text-[#C5A059]' : 'text-zinc-500'}`} />
                      <div className="flex items-center gap-1.5 opacity-80">
                        <img src="/payment/visa.svg" alt="Visa" className="h-3.5 w-auto object-contain" />
                        <img src="/payment/mastercard.svg" alt="Mastercard" className="h-3.5 w-auto object-contain" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">Kredi / Banka Kartı</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Tüm Kartlar & Taksit</div>
                    </div>
                  </button>

                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-[#C5A059]/15 border-[#C5A059] text-white shadow-lg'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Building2 className={`w-5 h-5 ${paymentMethod === 'bank_transfer' ? 'text-[#C5A059]' : 'text-zinc-500'}`} />
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">%3 İndirim</span>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">Havale / EFT / FAST</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Anında Hesap Doğrulama</div>
                    </div>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash_on_delivery')}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'cash_on_delivery'
                        ? 'bg-[#C5A059]/15 border-[#C5A059] text-white shadow-lg'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Truck className={`w-5 h-5 ${paymentMethod === 'cash_on_delivery' ? 'text-[#C5A059]' : 'text-zinc-500'}`} />
                      <span className="text-[10px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full">Güvenli</span>
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">Kapıda Ödeme</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Teslim Anında Ödeme</div>
                    </div>
                  </button>
                </div>

                {/* Details per method */}
                {paymentMethod === 'iyzico' && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="font-semibold flex items-center gap-1.5 text-white">
                        <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>iyzico 3D Secure Güvenli Ödeme Geçidi</span>
                      </span>
                      <span className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded font-mono">
                        PCI-DSS SEVİYE 1
                      </span>
                    </div>

                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      'Siparişi Tamamla' butonuna bastığınızda TCMB lisanslı ve PCI-DSS Seviye 1 sertifikalı güvenli <strong>iyzico 3D Secure</strong> ödeme sayfasına yönlendirileceksiniz. Kredi veya banka kartı bilgileriniz doğrudan iyzico güvenli altyapısında işlenir, sunucularımızda asla saklanmaz.
                    </p>

                    <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> 3D Secure &amp; TLS Şifreleme
                      </span>
                      <span>•</span>
                      <span>Tüm Banka & Kredi Kartları</span>
                      <span>•</span>
                      <span>Taksit İmkanı</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>Havale / EFT ile %3 İndirim Avantajı</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      Siparişinizi oluşturduktan sonra banka IBAN bilgileri ekranda ve SMS ile paylaşılacaktır. Açıklama kısmına sipariş numaranızı yazmanız yeterlidir.
                    </p>
                  </div>
                )}

                {paymentMethod === 'cash_on_delivery' && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Truck className="w-4 h-4 text-[#C5A059]" />
                      <span>Kapıda Ödeme ve Kontrol</span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      Kargonuz özel sandığında adresinize ulaştığında nakit veya POS cihazı ile kapıda ödemenizi yapabilirsiniz.
                    </p>
                  </div>
                )}

                {/* Terms Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-black/40 text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
                    />
                    <span>
                      <Link
                        to="/mesafeli-satis-sozlesmesi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#C5A059] hover:underline"
                      >
                        Mesafeli Satış Sözleşmesi
                      </Link>
                      'ni ve{' '}
                      <Link
                        to="/teslimat-ve-iade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#C5A059] hover:underline"
                      >
                        Teslimat/İade Şartları
                      </Link>
                      'nı okudum, onaylıyorum.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary & Place Order (5 Cols) */}
            <div className="lg:col-span-5 space-y-6 sticky top-24">
              <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 glass-panel shadow-2xl">
                
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
                    <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider">
                      Sipariş Özeti
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">
                    {items.reduce((acc, i) => acc + i.quantity, 0)} Ürün
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3.5 items-center p-2.5 rounded-2xl bg-white/5 border border-white/5">
                      <img
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80'}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-xl border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-light">
                          Adet: {item.quantity} x {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-serif-luxury text-xs text-[#C5A059] font-bold">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <label className="block text-xs uppercase tracking-wider text-zinc-300 font-semibold">
                    İndirim Kuponu
                  </label>
                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-mono font-bold text-emerald-300 text-xs">{appliedCoupon.code}</div>
                          <div className="text-[10px] text-emerald-400">-{formatCurrency(discountAmount)} İndirim Uygulandı</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-zinc-400 hover:text-rose-400 p-1 transition-colors"
                        title="Kuponu Kaldır"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase().trim())}
                        placeholder="Kupon Kodu"
                        className="flex-1 px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs font-mono text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleApplyCoupon(e.currentTarget)}
                        className="px-4 py-2 bg-white/10 hover:bg-[#C5A059] hover:text-black text-xs font-bold uppercase rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Uygula
                      </button>
                    </div>
                  )}
                  {couponFeedback && !appliedCoupon && (
                    <p className={`text-[11px] ${couponFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {couponFeedback.message}
                    </p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-xs pt-2 border-t border-white/10">
                  <div className="flex justify-between text-zinc-400">
                    <span>Ara Toplam</span>
                    <span className="text-zinc-200 font-medium">{formatCurrency(currentSubtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Kupon İndirimi ({appliedCoupon?.code})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {paymentDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Havale / EFT İndirimi (%3)</span>
                      <span>-{formatCurrency(paymentDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-zinc-400">
                    <span>Sigortalı Özel Kargo</span>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-emerald-400 font-semibold">ÜCRETSİZ</span>
                      ) : (
                        <span className="text-zinc-200 font-medium">{formatCurrency(shippingCost)}</span>
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/15 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Toplam Tutar</span>
                    <span className="font-serif-luxury text-2xl text-[#C5A059] font-bold">
                      {formatCurrency(finalPayableTotal)}
                    </span>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className={`w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-2xl ${
                    loading || !termsAccepted
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                      : 'bg-[#C5A059] hover:bg-[#d6b26b] active:scale-[0.99] text-black shadow-[#C5A059]/20 cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Sipariş Hazırlanıyor...</span>
                    </div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Misafir Siparişini Tamamla</span>
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="space-y-2 pt-2 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span>PCI-DSS Seviye 1 ve 3D Secure ile Güvenli Ödeme</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span>Özel ahşap sandıklı, kırılmaya karşı tam sigortalı kargo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span>2 Yıl Birebir Atölye ve Malzeme Garantisi</span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="text-zinc-500">Güvenli Kart Altyapısı</span>
                    <div className="flex items-center gap-2">
                      <img src="/payment/visa.svg" alt="Visa" className="h-4 w-auto object-contain opacity-75" />
                      <img src="/payment/mastercard.svg" alt="Mastercard" className="h-4 w-auto object-contain opacity-75" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </form>
        </main>
      )}

      {/* SUCCESS STEP */}
      {step === 'success' && completedOrder && (
        <main className="w-full max-w-3xl mx-auto px-4 py-16 text-center space-y-8 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 rounded-3xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center mx-auto text-[#C5A059] shadow-2xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">Misafir Siparişiniz Alındı</span>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl text-white uppercase tracking-wider">
              Teşekkür Ederiz, Siparişiniz Onaylandı!
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-md mx-auto leading-relaxed">
              Sipariş dökümünüz ve kargo takip kodunuz <span className="text-white font-medium">{completedOrder.customerEmail}</span> adresine ve <span className="text-white font-medium">{completedOrder.customerPhone}</span> numarasına iletilecektir.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 text-left space-y-5 glass-panel shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Sipariş Numarası</span>
                <span className="font-mono text-sm font-bold text-white">{completedOrder.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Sipariş Tarihi</span>
                <span className="text-xs text-zinc-200">{formatDate(completedOrder.createdAt)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Ödeme Şekli</span>
                <span className="text-xs text-[#C5A059] font-semibold">
                  {completedOrder.paymentMethod === 'bank_transfer' ? 'Havale / EFT' : completedOrder.paymentMethod === 'cash_on_delivery' ? 'Kapıda Ödeme' : 'Kredi Kartı (Online)'}
                </span>
              </div>
            </div>

            {/* Delivery Info Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">Teslimat Adresi</span>
                <p className="text-white font-medium">{completedOrder.address.fullName}</p>
                <p className="text-zinc-300 font-light">{completedOrder.address.addressLine}</p>
                <p className="text-zinc-400">{completedOrder.address.district} / {completedOrder.address.city}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">İletişim Bilgileri</span>
                <p className="text-white font-medium">{completedOrder.customerPhone}</p>
                <p className="text-zinc-300">{completedOrder.customerEmail}</p>
                <p className="text-[#C5A059] text-[11px]">Kargo hazırlık süresi: 1-3 iş günü</p>
              </div>
            </div>

            {/* Bank Info If Bank Transfer */}
            {completedOrder.paymentMethod === 'bank_transfer' && (
              <div className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-2xl space-y-2 text-xs">
                <div className="font-semibold text-[#C5A059] flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Havale Yapılacak Banka Hesabı</span>
                </div>
                <p className="text-zinc-300 font-mono text-xs">
                  {COMPANY.bank.iban} ({COMPANY.bank.bankName} - {COMPANY.bank.accountHolder})
                </p>
                <p className="text-[11px] text-zinc-400">
                  Lütfen açıklama kısmına <strong>{completedOrder.id}</strong> sipariş kodunuzu yazınız.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Vitrine Geri Dön
            </button>
          </div>
        </main>
      )}
    </div>
  );
};
