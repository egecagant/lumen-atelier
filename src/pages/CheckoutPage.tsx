import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  Building2, 
  Truck, 
  CheckCircle2, 
  Printer, 
  Tag, 
  Sparkles, 
  ArrowLeft, 
  ShoppingBag, 
  ChevronRight, 
  AlertCircle, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Check, 
  Percent,
  Clock,
  HelpCircle,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCoupons } from '../context/CouponContext';
import { formatCurrency, formatDate } from '../lib/format';
import { triggerGoldConfetti } from '../lib/confetti';
import { cleanFirestoreData } from '../lib/firebase';
import { Order, OrderAddress, Product } from '../types';
import { SEO } from '../components/SEO';

const TURKISH_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 
  'Gaziantep', 'Muğla', 'Eskişehir', 'Kocaeli', 'Mersin', 'Kayseri', 
  'Samsun', 'Balıkesir', 'Trabzon', 'Denizli', 'Aydın', 'Tekirdağ', 'Sakarya'
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, subtotal, shipping, grandTotal, clearCart } = useCart();
  const { user, saveAddress, openAuthModal } = useAuth();
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
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank_transfer' | 'cash_on_delivery'>('stripe');

  // Coupon Input State
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Address Form State
  const [address, setAddress] = useState<OrderAddress>({
    fullName: user?.displayName || '',
    phone: user?.phone || '',
    email: user?.email || '',
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

  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [saveToAccount, setSaveToAccount] = useState<boolean>(false);
  const [saveAddressTitle, setSaveAddressTitle] = useState<string>('Evim');

  // Auto-populate from user or default saved address
  useEffect(() => {
    if (user) {
      const defaultAddr = user.savedAddresses?.find(a => a.isDefault) || user.savedAddresses?.[0];
      if (defaultAddr && !selectedSavedAddressId) {
        setSelectedSavedAddressId(defaultAddr.id);
        setAddress(prev => ({
          ...prev,
          fullName: defaultAddr.fullName || user.displayName || prev.fullName,
          phone: defaultAddr.phone || user.phone || prev.phone,
          email: user.email || prev.email,
          city: defaultAddr.city || prev.city,
          district: defaultAddr.district || prev.district,
          postalCode: defaultAddr.postalCode || prev.postalCode,
          addressLine: defaultAddr.addressLine || prev.addressLine,
          invoiceType: defaultAddr.invoiceType || prev.invoiceType,
          companyName: defaultAddr.companyName || prev.companyName,
          taxOffice: defaultAddr.taxOffice || prev.taxOffice,
          taxNumber: defaultAddr.taxNumber || prev.taxNumber
        }));
      } else {
        setAddress(prev => ({
          ...prev,
          fullName: prev.fullName || user.displayName || '',
          email: prev.email || user.email || '',
          phone: prev.phone || user.phone || ''
        }));
      }
    }
  }, [user]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedSavedAddressId(addrId);
    const addr = user?.savedAddresses?.find(a => a.id === addrId);
    if (addr) {
      setAddress(prev => ({
        ...prev,
        fullName: addr.fullName,
        phone: addr.phone,
        email: prev.email || user?.email || '',
        addressLine: addr.addressLine,
        city: addr.city,
        district: addr.district,
        postalCode: addr.postalCode || '',
        invoiceType: addr.invoiceType || 'individual',
        companyName: addr.companyName || '',
        taxOffice: addr.taxOffice || '',
        taxNumber: addr.taxNumber || ''
      }));
    }
  };

  // Credit Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(user?.displayName || '');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Order processing state
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');

  // Calculations
  const shippingCost = (currentSubtotal - discountAmount > 5000 || currentSubtotal === 0) ? 0 : 250;
  const paymentDiscount = paymentMethod === 'bank_transfer' ? Math.round((currentSubtotal - discountAmount) * 0.03) : 0;
  const finalPayableTotal = Math.max(0, currentSubtotal - discountAmount - paymentDiscount + shippingCost);

  const handleFillTestCard = () => {
    setCardNumber('4242 •••• •••• 4242');
    setCardExpiry('12/28');
    setCardCvc('888');
    setCardName(address.fullName || 'Ege Çağan');
  };

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
    const trimmedEmail = (address.email || user?.email || '').trim().toLowerCase();
    const trimmedPhone = address.phone.trim();
    const trimmedAddressLine = address.addressLine.trim();

    if (!trimmedFullName || !trimmedEmail || !trimmedPhone || !trimmedAddressLine) {
      alert('Lütfen teslimat ve iletişim bilgilerinizi eksiksiz doldurunuz.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert('Lütfen geçerli bir e-posta adresi giriniz (örn: isim@ornek.com).');
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

    // If online card payment (iyzico / stripe) is selected:
    if (paymentMethod === 'iyzico' || paymentMethod === 'stripe') {
      try {
        const payload = {
          items: items.map(item => ({
            productId: item.product.id,
            productName: item.selectedColor ? `${item.product.name} (${item.selectedColor})` : item.product.name,
            productImage: item.product.images?.[0] || '',
            price: item.product.price,
            quantity: item.quantity,
            selectedColor: item.selectedColor || null
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
          notes: address.orderNote || ''
        };

        const res = await fetch('/api/iyzico/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.errorMessage || 'iyzico ödeme oturumu başlatılamadı.');
        }

        // Auto-save address to user profile if requested
        if (user && saveToAccount && address.addressLine) {
          try {
            await saveAddress({
              title: saveAddressTitle || 'Kayıtlı Adresim',
              fullName: address.fullName,
              phone: address.phone,
              city: address.city,
              district: address.district,
              postalCode: address.postalCode,
              addressLine: address.addressLine,
              invoiceType: address.invoiceType,
              companyName: address.companyName,
              taxOffice: address.taxOffice,
              taxNumber: address.taxNumber,
              isDefault: !user.savedAddresses || user.savedAddresses.length === 0
            });
          } catch (saveErr) {
            console.warn('Could not auto-save address:', saveErr);
          }
        }

        if (data.paymentPageUrl) {
          window.location.href = data.paymentPageUrl;
          return;
        } else if (data.token) {
          window.location.href = `https://sandbox-api.iyzipay.com/payment/iyzipay/checkoutform/${data.token}`;
          return;
        } else {
          throw new Error('iyzico ödeme bağlantısı bulunamadı.');
        }
      } catch (err: any) {
        console.error('iyzico start error:', err);
        alert(err.message || 'Ödeme oturumu başlatılırken bir hata oluştu. Lütfen tekrar deneyiniz.');
        setLoading(false);
        return;
      }
    }

    // Bank transfer or other non-online payment methods
    try {
      const orderPayload = {
        userId: user?.uid || 'guest',
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
          productName: item.selectedColor ? `${item.product.name} (${item.selectedColor})` : item.product.name,
          productImage: item.product.images?.[0] || '',
          price: item.product.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor || null
        })),
        discountCode: appliedCoupon?.code,
        paymentMethod,
        notes: address.orderNote || ''
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.errorMessage || 'Sipariş oluşturulamadı.');
      }

      const completed: Order = data.order;

      // Backup placed order to localStorage cache so admin panel always has access immediately
      try {
        const existing = JSON.parse(localStorage.getItem('lumen_orders_backup') || '[]');
        const updated = [completed, ...existing.filter((o: Order) => o.id !== completed.id)];
        localStorage.setItem('lumen_orders_backup', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not backup order to localStorage:', e);
      }

      // If user chose to save this address to their profile, save it
      if (user && saveToAccount && address.addressLine) {
        try {
          await saveAddress({
            title: saveAddressTitle || 'Kayıtlı Adresim',
            fullName: address.fullName,
            phone: address.phone,
            city: address.city,
            district: address.district,
            postalCode: address.postalCode,
            addressLine: address.addressLine,
            invoiceType: address.invoiceType,
            companyName: address.companyName,
            taxOffice: address.taxOffice,
            taxNumber: address.taxNumber,
            isDefault: !user.savedAddresses || user.savedAddresses.length === 0
          });
        } catch (saveErr) {
          console.warn('Could not auto-save address to user profile:', saveErr);
        }
      }

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
      <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col justify-center items-center p-4">
        <SEO title="Ödeme & Satış Ekranı" description="LUMEN Atelier Güvenli Ödeme" />
        <div className="max-w-md w-full text-center space-y-5 p-8 bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl glass-panel">
          <div className="w-16 h-16 rounded-2xl glass-panel border border-white/10 flex items-center justify-center mx-auto text-[#C5A059]">
            <ShoppingBag className="w-8 h-8 opacity-60" />
          </div>
          <div>
            <h2 className="font-serif-luxury text-2xl text-white uppercase">Sepetiniz Boş</h2>
            <p className="text-xs text-zinc-400 mt-1 font-light">
              Ödeme yapabilmek için lütfen önce beğendiğiniz tasarım lambayı sepetinize ekleyin.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Koleksiyonu İncele</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100">
      <SEO title="Güvenli Ödeme & Sipariş Tamamlama" description="LUMEN Atelier Lüks Aydınlatma Satış ve Checkout Ekranı" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Mağazaya Dön</span>
          </Link>

          <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit SSL Güvenli Altyapı</span>
          </div>
        </div>
      </header>

      {/* SUCCESS SCREEN */}
      {step === 'success' && completedOrder && (
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 space-y-8 animate-in fade-in zoom-in-95">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-[#C5A059] font-bold">
                SİPARİŞİNİZ BAŞARIYLA ALINDI
              </span>
              <h1 className="font-serif-luxury text-3xl sm:text-4xl text-white uppercase">
                Teşekkür Ederiz, {completedOrder.customerName}
              </h1>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto font-light leading-relaxed">
                Siparişiniz atölyemize iletilmiş olup usta eller tarafından ahşap korumalı sandıkta sigortalı kargo için hazırlanmaktadır.
              </p>
            </div>
          </div>

          {/* Receipt Card */}
          <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl glass-panel">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 block">Sipariş Numarası</span>
                <span className="font-mono text-lg font-bold text-[#C5A059]">
                  #{completedOrder.id.substring(0, 10).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 block">Sipariş Tarihi</span>
                <span className="text-xs font-semibold text-zinc-200">{formatDate(completedOrder.createdAt)}</span>
              </div>
            </div>

            {/* Bank Transfer Alert if applicable */}
            {completedOrder.paymentMethod === 'bank_transfer' && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs space-y-2 text-amber-200">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Building2 className="w-4 h-4" />
                  <span>Havale / EFT Ödeme Talimatı</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Lütfen <span className="font-bold text-white">{formatCurrency(completedOrder.total)}</span> tutarını aşağıdaki IBAN hesabımıza açıklama kısmına <span className="font-mono font-bold text-white">{completedOrder.bankTransferReference || completedOrder.id.substring(0, 8)}</span> yazarak 2 iş günü içinde transfer ediniz.
                </p>
                <div className="p-3 bg-black/60 rounded-xl font-mono text-zinc-200 space-y-1 text-[11px]">
                  <div><span className="text-zinc-500">Banka:</span> Garanti BBVA</div>
                  <div><span className="text-zinc-500">Alıcı:</span> Lumen Atelier Aydınlatma Tasarım A.Ş.</div>
                  <div><span className="text-zinc-500">IBAN:</span> TR33 0006 2000 0001 2345 6789 01</div>
                </div>
              </div>
            )}

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-black/40 border border-white/5 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C5A059]" /> Alıcı & İletişim
                </span>
                <p className="font-semibold text-zinc-100">{completedOrder.customerName}</p>
                <p className="text-zinc-400">{completedOrder.customerEmail}</p>
                <p className="text-zinc-400">{completedOrder.customerPhone}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> Teslimat Adresi
                </span>
                <p className="text-zinc-200">{completedOrder.address.addressLine}</p>
                <p className="text-zinc-400">
                  {completedOrder.address.district ? `${completedOrder.address.district} / ` : ''}{completedOrder.address.city}
                </p>
                <p className="text-zinc-500">{completedOrder.address.postalCode} - {completedOrder.address.country}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                Sipariş Edilen Tasarımlar ({completedOrder.items.reduce((acc, i) => acc + i.quantity, 0)})
              </h4>
              <div className="divide-y divide-white/5 border border-white/5 rounded-2xl bg-black/20 overflow-hidden">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.productImage} 
                        alt="" 
                        className="w-12 h-12 object-cover rounded-xl bg-black border border-white/10" 
                      />
                      <div>
                        <h5 className="text-xs font-semibold text-zinc-200">{item.productName}</h5>
                        <span className="text-[10px] text-zinc-400">{item.quantity} Adet × {formatCurrency(item.price)}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white font-serif-luxury">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="p-4 rounded-2xl bg-black/40 space-y-2 text-xs border border-white/5">
              <div className="flex justify-between text-zinc-400">
                <span>Ara Toplam:</span>
                <span className="text-zinc-200">{formatCurrency(completedOrder.subtotal)}</span>
              </div>

              {completedOrder.discountAmount ? (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Kupon İndirimi ({completedOrder.discountCode}):</span>
                  <span>-{formatCurrency(completedOrder.discountAmount)}</span>
                </div>
              ) : null}

              {completedOrder.paymentMethodDiscount ? (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Havale/EFT %3 Nakit İndirimi:</span>
                  <span>-{formatCurrency(completedOrder.paymentMethodDiscount)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-zinc-400">
                <span>Sigortalı Özel Kargo:</span>
                <span className="text-zinc-200">
                  {completedOrder.shipping === 0 ? <span className="text-emerald-400 font-semibold">ÜCRETSİZ</span> : formatCurrency(completedOrder.shipping)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-white/10 flex justify-between text-sm font-bold">
                <span className="text-zinc-100">Toplam Tutar:</span>
                <span className="font-serif-luxury text-xl text-[#C5A059]">
                  {formatCurrency(completedOrder.total)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-3 glass-panel hover:bg-white/10 text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#C5A059]" />
                <span>Sipariş Faturasını Yazdır</span>
              </button>

              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.15em] rounded-xl shadow-lg transition-all"
              >
                Alışverişe Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT FLOW */}
      {step === 'checkout' && (
        <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
          {/* Breadcrumb Steps */}
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold mb-8 text-zinc-400">
            <Link to="/" className="hover:text-zinc-200">Vitrin</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-300">Sepet</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[#C5A059] font-bold">Teslimat & Ödeme</span>
          </div>

          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Customer, Address & Payment (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Guest / Account Info Banner if user is not logged in */}
              {!user && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-[#181820] via-[#14141A] to-[#101014] border border-[#C5A059]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>Misafir Olarak Satın Alıyorsunuz</span>
                        <span className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded-full font-normal">Hızlı Sipariş</span>
                      </h4>
                      <p className="text-xs text-zinc-400 font-light mt-0.5">
                        Üye olmadan aşağıdaki İsim Soyisim, Telefon Numarası, Mail Adresi ve Normal Adres bilgilerinizi girerek siparişinizi tamamlayabilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to="/misafir-odeme"
                      className="px-3.5 py-2.5 bg-[#C5A059]/15 hover:bg-[#C5A059] hover:text-black text-[#C5A059] border border-[#C5A059]/30 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                    >
                      Misafir Sayfası
                    </Link>
                    <button
                      type="button"
                      onClick={() => openAuthModal('Kayıtlı teslimat adreslerinizi ve sipariş geçmişinizi kullanmak için lütfen giriş yapın veya ücretsiz hesap oluşturun.', 'Giriş Yaparak Satın Al')}
                      className="px-4 py-2.5 bg-white/5 hover:bg-[#C5A059]/20 hover:text-[#C5A059] text-zinc-200 border border-white/10 hover:border-[#C5A059]/40 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      Giriş Yap / Üye Ol
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 1: Customer Contact Info */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 glass-panel">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-serif-luxury font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider">
                      İletişim Bilgileri {!user && <span className="text-xs text-[#C5A059] font-normal lowercase">(misafir bilgileri)</span>}
                    </h3>
                    <p className="text-[11px] text-zinc-400">Fatura ve kargo takip SMS/e-postası bu bilgilere gönderilecektir.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      İsim Soyisim (Ad Soyad) *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="Örn: Ege Çağan"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Mail Adresi (E-Posta) *
                    </label>
                    <input
                      type="email"
                      required
                      value={address.email}
                      onChange={(e) => setAddress({ ...address, email: e.target.value })}
                      placeholder="ornek@domain.com"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Telefon Numarası (Kargo Bilgilendirme) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder="+90 (555) 000 00 00"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Delivery & Invoice Address */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 glass-panel">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-serif-luxury font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider">
                        Teslimat ve Fatura Adresi
                      </h3>
                      <p className="text-[11px] text-zinc-400">Ürünleriniz özel korumalı ahşap sandık ile adrese sigortalı teslim edilir.</p>
                    </div>
                  </div>

                  {user && (
                    <Link
                      to="/profil"
                      className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#C5A059] hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Adreslerimi Yönet</span>
                    </Link>
                  )}
                </div>

                {/* SAVED ADDRESSES SELECTOR (If logged in and has saved addresses) */}
                {user && user.savedAddresses && user.savedAddresses.length > 0 && (
                  <div className="space-y-2 p-3.5 bg-black/40 border border-white/10 rounded-2xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                        Kayıtlı Adreslerinizden Seçin:
                      </span>
                      <Link to="/profil" className="sm:hidden text-[11px] text-[#C5A059] hover:underline">
                        Adres Ekle / Düzenle
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {user.savedAddresses.map((addr) => {
                        const isSelected = selectedSavedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => handleSelectSavedAddress(addr.id)}
                            className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-[#C5A059]/15 border-[#C5A059] text-white ring-1 ring-[#C5A059]'
                                : 'bg-zinc-900/60 border-white/5 text-zinc-300 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                                {addr.title}
                                {addr.isDefault && (
                                  <span className="text-[9px] bg-[#C5A059]/20 text-[#C5A059] px-1.5 py-0.2 rounded font-normal">
                                    Varsayılan
                                  </span>
                                )}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate">{addr.fullName} • {addr.phone}</p>
                            <p className="text-[11px] text-zinc-300 truncate mt-0.5">{addr.district}, {addr.city}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Invoice Type Toggle */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setAddress({ ...address, invoiceType: 'individual' })}
                    className={`py-2.5 px-4 rounded-xl border font-semibold uppercase tracking-wider transition-all ${
                      address.invoiceType === 'individual'
                        ? 'bg-[#C5A059]/15 border-[#C5A059] text-[#C5A059]'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Bireysel Fatura
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddress({ ...address, invoiceType: 'corporate' })}
                    className={`py-2.5 px-4 rounded-xl border font-semibold uppercase tracking-wider transition-all ${
                      address.invoiceType === 'corporate'
                        ? 'bg-[#C5A059]/15 border-[#C5A059] text-[#C5A059]'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Kurumsal Fatura
                  </button>
                </div>

                {/* Corporate specific fields */}
                {address.invoiceType === 'corporate' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-white/10 text-xs animate-in fade-in">
                    <div className="sm:col-span-2">
                      <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                        Firma Resmi Ünvanı *
                      </label>
                      <input
                        type="text"
                        required={address.invoiceType === 'corporate'}
                        value={address.companyName}
                        onChange={(e) => setAddress({ ...address, companyName: e.target.value })}
                        placeholder="Örn: ABC Mimarlık Tasarım San. Tic. Ltd. Şti."
                        className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                        Vergi Dairesi *
                      </label>
                      <input
                        type="text"
                        required={address.invoiceType === 'corporate'}
                        value={address.taxOffice}
                        onChange={(e) => setAddress({ ...address, taxOffice: e.target.value })}
                        placeholder="Örn: Beşiktaş V.D."
                        className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-zinc-400 mb-1 font-medium">
                        Vergi Numarası *
                      </label>
                      <input
                        type="text"
                        required={address.invoiceType === 'corporate'}
                        value={address.taxNumber}
                        onChange={(e) => setAddress({ ...address, taxNumber: e.target.value })}
                        placeholder="10 Haneli Vergi No"
                        className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-zinc-200 font-mono focus:border-[#C5A059] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* City & District */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Şehir *
                    </label>
                    <select
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                    >
                      {TURKISH_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-zinc-900 text-zinc-200">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      İlçe *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.district}
                      onChange={(e) => setAddress({ ...address, district: e.target.value })}
                      placeholder="Şişli / Nişantaşı"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                      Posta Kodu
                    </label>
                    <input
                      type="text"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      placeholder="34367"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div className="text-xs">
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Açık Teslimat Adresi *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={address.addressLine}
                    onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                    placeholder="Mahalle, Cadde/Sokak, Bina No, Kat ve Daire Numarasını detaylı belirtiniz..."
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none resize-none"
                  />
                </div>

                {/* Order Note */}
                <div className="text-xs">
                  <label className="block uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                    Teslimat & Sipariş Notu (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={address.orderNote}
                    onChange={(e) => setAddress({ ...address, orderNote: e.target.value })}
                    placeholder="Örn: Güvenliğe bırakılabilir, hediye paketi yapılsın, zil çalınmasın..."
                    className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                {/* SAVE ADDRESS TO ACCOUNT (If logged in) */}
                {user && (
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-zinc-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={saveToAccount}
                        onChange={(e) => setSaveToAccount(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#C5A059] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Bu teslimat adresini hesabıma kayıtlı adres olarak ekle</span>
                    </label>

                    {saveToAccount && (
                      <div className="pl-6 animate-in fade-in">
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Adres Başlığı (Örn: Evim, Ofis, Yazlık)
                        </label>
                        <input
                          type="text"
                          value={saveAddressTitle}
                          onChange={(e) => setSaveAddressTitle(e.target.value)}
                          placeholder="Adres Başlığı"
                          className="w-full max-w-xs px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-zinc-200 focus:border-[#C5A059] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 3: Payment Method Selection */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 glass-panel">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-serif-luxury font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-lg text-white uppercase tracking-wider">
                      Ödeme Yöntemi
                    </h3>
                    <p className="text-[11px] text-zinc-400">Tüm ödemeler 256-Bit SSL ve PCI-DSS standartları ile şifrelenir.</p>
                  </div>
                </div>

                {/* Method Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Option 1: Credit Card / iyzico */}
                  <div
                    onClick={() => setPaymentMethod('iyzico')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'iyzico' || paymentMethod === 'stripe'
                        ? 'bg-[#C5A059]/10 border-[#C5A059] text-white'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'iyzico' || paymentMethod === 'stripe' ? 'text-[#C5A059]' : 'text-zinc-500'}`} />
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                        iyzico 3D Secure
                      </span>
                    </div>
                    <div className="font-semibold text-zinc-100">Kredi / Banka Kartı</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">iyzico Güvencesi ile Taksitli / Tek Çekim</div>
                  </div>

                  {/* Option 2: Bank Transfer / EFT */}
                  <div
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-[#C5A059]/10 border-[#C5A059] text-white'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Building2 className={`w-5 h-5 ${paymentMethod === 'bank_transfer' ? 'text-[#C5A059]' : 'text-zinc-500'}`} />
                      <span className="text-[10px] bg-[#C5A059] text-black font-extrabold px-1.5 py-0.5 rounded">
                        %3 Ek İndirim
                      </span>
                    </div>
                    <div className="font-semibold text-zinc-100">Havale / EFT</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Banka Hesabına Transfer</div>
                  </div>

                  {/* Option 3: Cash on Delivery / VIP Courier */}
                  <div
                    onClick={() => setPaymentMethod('cash_on_delivery')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'cash_on_delivery'
                        ? 'bg-[#C5A059]/10 border-[#C5A059] text-white'
                        : 'bg-black/40 border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Truck className={`w-5 h-5 ${paymentMethod === 'cash_on_delivery' ? 'text-[#C5A059]' : 'text-zinc-500'}`} />
                      <span className="text-[10px] bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                        VIP Kurye
                      </span>
                    </div>
                    <div className="font-semibold text-zinc-100">Kapıda Ödeme</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Teslimatta Kart / Nakit</div>
                  </div>
                </div>

                {/* Sub-form: iyzico Info */}
                {(paymentMethod === 'iyzico' || paymentMethod === 'stripe') && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3.5 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white tracking-wider">IYZICO 3D SECURE ÖDEME GEÇİDİ</span>
                        <span className="text-[10px] bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded font-mono">
                          BDDK LİSANSLI
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">256-Bit SSL</span>
                    </div>

                    <p className="text-zinc-300 leading-relaxed">
                      Siparişi onayla butonuna tıkladığınızda <strong className="text-white">iyzico Güvenli Ödeme Sayfasına</strong> yönlendirileceksiniz. Tüm banka kartları, Troy ve Advantage, World, Bonus, Maximum, CardFinans, Paraf kartları ile peşin veya taksitli ödeme yapabilirsiniz.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/5 text-center">
                        <div className="text-[11px] font-bold text-zinc-200">3D Secure</div>
                        <div className="text-[10px] text-zinc-500">SMS Şifre Doğrulama</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/5 text-center">
                        <div className="text-[11px] font-bold text-zinc-200">Taksit İmkanı</div>
                        <div className="text-[10px] text-zinc-500">12 Aya Varan Taksit</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/5 text-center">
                        <div className="text-[11px] font-bold text-zinc-200">Kart Güvenliği</div>
                        <div className="text-[10px] text-zinc-500">PCI-DSS Seviye 1</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/5 text-center">
                        <div className="text-[11px] font-bold text-zinc-200">LUMEN Güvencesi</div>
                        <div className="text-[10px] text-zinc-500">Ahşap Sandık Kargo</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-form: Bank Transfer Info */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 text-[#C5A059] font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>Havale / EFT ile %3 Ek İndirim Kazandınız</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      Siparişinizi tamamladıktan sonra size özel oluşturulacak Sipariş Takip Numarası ile aşağıdaki IBAN hesabımıza ödemenizi gerçekleştirebilirsiniz:
                    </p>
                    <div className="p-3 bg-zinc-900 rounded-xl space-y-1 font-mono text-zinc-200 border border-white/5">
                      <div><span className="text-zinc-500">Banka:</span> Garanti BBVA - Levent Ticari Şube</div>
                      <div><span className="text-zinc-500">Hesap Adı:</span> Lumen Atelier Aydınlatma Tasarım A.Ş.</div>
                      <div><span className="text-zinc-500">IBAN:</span> TR33 0006 2000 0001 2345 6789 01</div>
                    </div>
                  </div>
                )}

                {/* Sub-form: Cash on Delivery Info */}
                {paymentMethod === 'cash_on_delivery' && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                      <Truck className="w-4 h-4 text-[#C5A059]" />
                      <span>VIP Randevulu Teslimat & Kapıda Ödeme</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">
                      Tasarım ekibimiz randevu saatinde adresinize gelerek lambanızın montaj kontrolünü yapar. Ödemenizi kapıda kredi kartı veya nakit olarak yapabilirsiniz.
                    </p>
                  </div>
                )}

                {/* Terms Agreement */}
                <div className="flex items-start gap-2.5 pt-2">
                  <input
                    type="checkbox"
                    id="terms-check"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded bg-black border-white/10 text-[#C5A059] focus:ring-0"
                  />
                  <label htmlFor="terms-check" className="text-[11px] text-zinc-400 leading-tight cursor-pointer">
                    <span className="text-zinc-200 underline">Mesafeli Satış Sözleşmesi</span>'ni ve <span className="text-zinc-200 underline">Ön Bilgilendirme Koşulları</span>'nı okudum, onaylıyorum.
                  </label>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Order Review & Coupon Engine (5 Cols) */}
            <div className="lg:col-span-5 space-y-6 sticky top-24">
              
              {/* Order Items Review */}
              <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 glass-panel">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-serif-luxury text-base text-white uppercase tracking-wider">
                    Sipariş Özeti ({items.reduce((acc, i) => acc + i.quantity, 0)})
                  </h3>
                  <Link to="/" className="text-[11px] text-[#C5A059] hover:underline font-medium">
                    Düzenle
                  </Link>
                </div>

                {/* Items List */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const itemKey = item.selectedColor ? `${item.product.id}-${item.selectedColor}` : item.product.id;
                    return (
                      <div key={itemKey} className="flex gap-3.5 p-3 rounded-2xl bg-black/40 border border-white/5">
                        <img
                          src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=200&q=80'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-xl bg-black border border-white/10 flex-shrink-0"
                        />
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-200 truncate">{item.product.name}</h4>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] text-[#C5A059] uppercase tracking-wider">{item.product.categoryName}</span>
                              {item.selectedColor && (
                                <span className="text-[9px] bg-white/10 text-zinc-300 px-1.5 py-0.2 rounded border border-white/10">
                                  {item.selectedColor}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400 text-[11px]">Adet: {item.quantity}</span>
                            <span className="font-serif-luxury font-bold text-white">{formatCurrency(item.product.price * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* COUPON CODE INPUT SECTION */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#C5A059]" /> İndirim Kuponu / Promosyon Kodu
                    </span>
                  </div>

                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-900/60 text-emerald-300 flex items-center justify-center font-bold text-xs">
                          %
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                            <span>{appliedCoupon.code}</span>
                            <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1.5 py-0.2 rounded font-sans">
                              {appliedCoupon.discountType === 'percentage' ? `%${appliedCoupon.discountValue}` : `${appliedCoupon.discountValue} TL`}
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-400/80">
                            -{formatCurrency(discountAmount)} indirim uygulandı
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                        title="Kuponu Kaldır"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase().trim())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon(e.currentTarget);
                            }
                          }}
                          placeholder="İndirim Kodu Giriniz"
                          className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-zinc-100 font-mono tracking-wider focus:border-[#C5A059] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleApplyCoupon(e.currentTarget)}
                          className="px-4 py-2.5 bg-white/10 hover:bg-[#C5A059] hover:text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                        >
                          Uygula
                        </button>
                      </div>

                      {/* Feedback message */}
                      {couponFeedback && (
                        <div className={`text-[11px] p-2 rounded-lg flex items-center gap-1.5 ${
                          couponFeedback.type === 'success' 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' 
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                        }`}>
                          {couponFeedback.type === 'success' ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span>{couponFeedback.message}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Breakdown Calculation */}
                <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Ara Toplam</span>
                    <span className="text-zinc-200">{formatCurrency(currentSubtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold animate-in fade-in">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Kupon İndirimi ({appliedCoupon?.code})
                      </span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {paymentDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold animate-in fade-in">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" /> Havale/EFT %3 Nakit İndirimi
                      </span>
                      <span>-{formatCurrency(paymentDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-zinc-400">
                    <span>Sigortalı Özel Kargo</span>
                    <span className="text-zinc-200">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-400 font-semibold">ÜCRETSİZ</span>
                      ) : (
                        formatCurrency(shippingCost)
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Ödenecek Tutar</span>
                    <span className="font-serif-luxury text-2xl font-bold text-[#C5A059]">
                      {formatCurrency(finalPayableTotal)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Sipariş Güvenle İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{formatCurrency(finalPayableTotal)} Siparişi Tamamla</span>
                    </>
                  )}
                </button>

                {/* Assurance Badges */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>256-Bit SSL Güvenlik</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5">
                    <Truck className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>Özel Sandıklı Kargo</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>2 Yıl Tasarım Garantisi</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>14 Gün Kolay İade</span>
                  </div>
                </div>

              </div>

            </div>

          </form>
        </main>
      )}

    </div>
  );
};
