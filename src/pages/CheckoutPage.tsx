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
  ArrowRight,
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
  User,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Clock,
  Shield,
  Home,
  CheckCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCoupons } from '../context/CouponContext';
import { formatCurrency, formatDate } from '../lib/format';
import { getApiUrl } from '../lib/api';
import { triggerGoldConfetti } from '../lib/confetti';
import { Order, OrderAddress, Product } from '../types';
import { SEO } from '../components/SEO';
import { COMPANY } from '../lib/companyInfo';

const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin',
  'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
  'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir',
  'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
];

type CheckoutTab = 'cart' | 'shipping' | 'payment';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, subtotal, shipping, grandTotal, clearCart, updateQuantity, removeFromCart } = useCart();
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

  // Active step / category tab: Sepet -> Kargo Bilgileri -> Ödeme
  const [activeTab, setActiveTab] = useState<CheckoutTab>('cart');

  // Direct buy single product if passed via location state
  const directProduct = location.state?.directBuyProduct as { product: Product; quantity: number } | undefined;
  const items = directProduct 
    ? [{ product: directProduct.product, quantity: directProduct.quantity, selectedColor: undefined }]
    : cart;

  const currentSubtotal = directProduct 
    ? directProduct.product.price * directProduct.quantity 
    : subtotal;

  // Recalculate coupon discount whenever subtotal changes
  useEffect(() => {
    recalculateDiscount(currentSubtotal);
  }, [currentSubtotal]);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'iyzico' | 'bank_transfer'>('iyzico');

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
    postalCode: '34000',
    country: 'Türkiye',
    invoiceType: 'individual',
    companyName: '',
    taxOffice: '',
    taxNumber: '',
    idNumber: '',
    orderNote: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [saveToAccount, setSaveToAccount] = useState<boolean>(false);
  const [saveAddressTitle, setSaveAddressTitle] = useState<string>('Ev Adresim');

  // Auto-populate from user profile or saved addresses
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
      setFormErrors({});
    }
  };

  // Agreements and order submission
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<'checkout' | 'success'>('checkout');

  // Financial Calculations
  const shippingThreshold = 5000;
  const isFreeShipping = (currentSubtotal - discountAmount) >= shippingThreshold || currentSubtotal === 0;
  const shippingCost = isFreeShipping ? 0 : 250;
  const remainingForFreeShipping = Math.max(0, shippingThreshold - (currentSubtotal - discountAmount));

  // 3% discount for Wire Transfer / EFT
  const paymentDiscount = paymentMethod === 'bank_transfer' 
    ? Math.round((currentSubtotal - discountAmount) * 0.03) 
    : 0;

  const finalPayableTotal = Math.max(0, currentSubtotal - discountAmount - paymentDiscount + shippingCost);

  // Total items count
  const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Coupon handlers
  const handleApplyCoupon = async (targetEl?: HTMLElement | null) => {
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput, currentSubtotal);
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

  // Validate address form
  const validateShippingForm = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedFullName = address.fullName.trim();
    const trimmedEmail = (address.email || user?.email || '').trim().toLowerCase();
    const trimmedPhone = address.phone.trim();
    const trimmedAddressLine = address.addressLine.trim();

    if (!trimmedFullName || trimmedFullName.length < 3) {
      errors.fullName = 'Lütfen ad ve soyadınızı eksiksiz giriniz.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      errors.email = 'Geçerli bir e-posta adresi giriniz.';
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (!trimmedPhone || phoneDigits.length < 10) {
      errors.phone = 'Geçerli bir telefon numarası giriniz (en az 10 hane).';
    }

    if (!address.city) {
      errors.city = 'Lütfen il seçiniz.';
    }

    if (!address.district.trim()) {
      errors.district = 'Lütfen ilçe giriniz.';
    }

    if (!trimmedAddressLine || trimmedAddressLine.length < 8) {
      errors.addressLine = 'Lütfen cadde, mahalle, sokak ve bina/kapı numaranızı yazınız.';
    }

    if (address.invoiceType === 'corporate') {
      if (!address.companyName?.trim()) {
        errors.companyName = 'Firma unvanı zorunludur.';
      }
      if (!address.taxNumber?.trim()) {
        errors.taxNumber = 'Vergi kimlik numarası zorunludur.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step transition handlers
  const handleTabClick = (tab: CheckoutTab) => {
    if (tab === 'cart') {
      setActiveTab('cart');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'shipping') {
      if (items.length === 0) {
        alert('Sepetinizde ürün bulunmamaktadır.');
        return;
      }
      setActiveTab('shipping');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'payment') {
      if (items.length === 0) {
        alert('Sepetinizde ürün bulunmamaktadır.');
        return;
      }
      if (!validateShippingForm()) {
        setActiveTab('shipping');
        window.scrollTo({ top: 200, behavior: 'smooth' });
        return;
      }
      setActiveTab('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProceedToShipping = () => {
    if (items.length === 0) {
      alert('Sepetinizde ürün bulunmamaktadır.');
      return;
    }
    setActiveTab('shipping');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = () => {
    if (!validateShippingForm()) {
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }
    setActiveTab('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Place order logic
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Sepetinizde ürün bulunmamaktadır.');
      navigate('/');
      return;
    }

    if (!validateShippingForm()) {
      setActiveTab('shipping');
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    if (!termsAccepted) {
      alert("Lütfen Ön Bilgilendirme Formu'nu ve Mesafeli Satış Sözleşmesi'ni onaylayınız.");
      return;
    }

    const trimmedFullName = address.fullName.trim();
    const trimmedEmail = (address.email || user?.email || '').trim().toLowerCase();
    const trimmedPhone = address.phone.trim();
    const trimmedAddressLine = address.addressLine.trim();

    setLoading(true);

    // Online Card Payment with iyzico 3D Secure
    if (paymentMethod === 'iyzico') {
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
          notes: address.orderNote || '',
          marketingConsent,
          marketingConsentAt: marketingConsent ? Date.now() : undefined,
          contractsAcceptedAt: Date.now(),
          frontendOrigin: typeof window !== 'undefined' ? window.location.origin : undefined
        };

        const res = await fetch(getApiUrl('/api/iyzico/initialize'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.errorMessage || 'iyzico ödeme oturumu başlatılamadı.');
        }

        // Auto-save address to user profile if user is logged in and opted in
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

    // Bank transfer or Cash on Delivery
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
        notes: address.orderNote || '',
        marketingConsent,
        marketingConsentAt: marketingConsent ? Date.now() : undefined,
        contractsAcceptedAt: Date.now()
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

      // Save address if requested
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

      if (appliedCoupon) {
        recordCouponUsage(appliedCoupon.id).catch((e) => console.warn('Could not record coupon usage:', e));
      }

      if (!directProduct) {
        clearCart();
      }

      triggerGoldConfetti();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Order creation error:', err);
      alert(err.message || 'Sipariş oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Category-like Step tabs definition
  const stepTabs: { id: CheckoutTab; title: string; subtitle: string; icon: any; stepNumber: number }[] = [
    {
      id: 'cart',
      title: 'Sepet',
      subtitle: `${totalItemCount} Tasarım Ürünü`,
      icon: ShoppingBag,
      stepNumber: 1
    },
    {
      id: 'shipping',
      title: 'Kargo Bilgileri',
      subtitle: address.fullName ? `${address.fullName}` : 'Teslimat & İletişim',
      icon: Truck,
      stepNumber: 2
    },
    {
      id: 'payment',
      title: 'Ödeme',
      subtitle: paymentMethod === 'iyzico' 
        ? 'Kartla 3D Güvenli Ödeme' 
        : 'Havale (%3 İndirim)',
      icon: CreditCard,
      stepNumber: 3
    }
  ];

  // SUCCESS / RECEIPT SCREEN
  if (step === 'success' && completedOrder) {
    return (
      <>
        <SEO title="Siparişiniz Alındı | LUMEN Atelier" description="Siparişiniz başarıyla alındı ve üretime hazırlandı." />
        <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Header Success Card */}
            <div className="text-center bg-[#0F0F12] border border-[#C5A059]/40 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl mb-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/10 rounded-full filter blur-3xl pointer-events-none" />
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#C5A059]/15 border border-[#C5A059] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#C5A059]" />
              </div>

              <span className="inline-block text-[10px] sm:text-xs tracking-[0.3em] uppercase bg-[#C5A059] text-black font-bold px-3 py-1 rounded-full mb-3">
                Sipariş Onaylandı
              </span>

              <h1 className="font-serif-luxury text-3xl sm:text-4xl text-white mb-2">
                Teşekkür Ederiz, {completedOrder.customerName || 'Değerli Müşterimiz'}
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-lg mx-auto">
                Siparişiniz başarıyla alındı. Özel heykelsi aydınlatma tasarımlarınız özenle paketlenerek hızlı kargo ile adresinize sevk edilecektir.
              </p>

              <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 bg-black/40 border border-white/10 rounded-2xl px-5 py-3">
                <div className="text-left">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Sipariş Takip Kodu</div>
                  <div className="font-mono text-sm sm:text-base font-bold text-[#C5A059] tracking-wider">{completedOrder.id}</div>
                </div>
                <div className="hidden sm:block w-px h-8 bg-white/10" />
                <div className="text-left">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Tarih</div>
                  <div className="text-xs sm:text-sm text-zinc-200">{formatDate(completedOrder.createdAt)}</div>
                </div>
              </div>
            </div>

            {/* Bank Transfer Instructions if Selected */}
            {completedOrder.paymentMethod === 'bank_transfer' && (
              <div className="bg-[#121216] border border-[#C5A059]/40 rounded-2xl p-6 mb-8 text-left">
                <div className="flex items-center gap-2.5 text-[#C5A059] font-serif-luxury text-lg mb-2">
                  <Building2 className="w-5 h-5" />
                  <span>Havale / EFT Ödeme Bilgileri</span>
                </div>
                <p className="text-xs text-zinc-300 font-light mb-4">
                  Lütfen 2 iş günü içerisinde aşağıdaki banka hesabımıza sipariş kodunuzu açıklama kısmına yazarak ödemenizi gerçekleştiriniz.
                </p>

                <div className="space-y-2.5 bg-black/50 p-4 rounded-xl border border-white/10 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Banka:</span>
                    <span className="text-white font-medium">{COMPANY.bank.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Alıcı:</span>
                    <span className="text-white font-medium">{COMPANY.bank.accountHolder}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-1 border-t border-white/5">
                    <span className="text-zinc-400">IBAN:</span>
                    <span className="text-[#C5A059] font-bold text-xs sm:text-sm select-all">{COMPANY.bank.iban}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-zinc-400">Ödenecek Tutar:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(completedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-zinc-400">Açıklama:</span>
                    <span className="text-white font-bold select-all">{completedOrder.id}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Details & Summary Card */}
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 text-left mb-8">
              <h2 className="font-serif-luxury text-xl text-white border-b border-white/10 pb-4">
                Sipariş Detayları
              </h2>

              {/* Items List */}
              <div className="space-y-4">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                    <div className="w-14 h-14 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm text-white font-medium truncate">{item.productName}</h4>
                      {item.selectedColor && (
                        <div className="text-[11px] text-[#C5A059]">Renk: {item.selectedColor}</div>
                      )}
                      <div className="text-[11px] text-zinc-400 font-mono">Adet: {item.quantity} x {formatCurrency(item.price)}</div>
                    </div>
                    <div className="font-serif-luxury text-sm text-[#C5A059]">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <div className="text-zinc-400 font-semibold uppercase tracking-wider mb-1">Teslimat Adresi</div>
                  <div className="text-zinc-200 font-medium">{completedOrder.address.fullName}</div>
                  <div className="text-zinc-400 mt-0.5">{completedOrder.address.addressLine}</div>
                  <div className="text-zinc-400">{completedOrder.address.district} / {completedOrder.address.city}</div>
                  <div className="text-zinc-400 mt-1">{completedOrder.address.phone}</div>
                </div>
                <div>
                  <div className="text-zinc-400 font-semibold uppercase tracking-wider mb-1">Ödeme Özeti</div>
                  <div className="space-y-1 text-zinc-300">
                    <div className="flex justify-between">
                      <span>Ara Toplam:</span>
                      <span>{formatCurrency(completedOrder.subtotal)}</span>
                    </div>
                    {completedOrder.discountAmount ? (
                      <div className="flex justify-between text-emerald-400">
                        <span>İndirim ({completedOrder.discountCode}):</span>
                        <span>-{formatCurrency(completedOrder.discountAmount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between">
                      <span>Kargo:</span>
                      <span>{completedOrder.shipping === 0 ? 'ÜCRETSİZ (Hızlı Kargo)' : formatCurrency(completedOrder.shipping)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/10">
                      <span>Ödenen Toplam:</span>
                      <span className="text-[#C5A059]">{formatCurrency(completedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#C5A059]" />
                <span>Yazdır / Fiş Görüntüle</span>
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-8 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Alışverişe Devam Et</span>
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // EMPTY STATE
  if (items.length === 0) {
    return (
      <>
        <SEO title="Sepetiniz Boş | LUMEN Atelier" description="Siparişinizi tamamlamak için sepetinize özel lamba tasarımlarımızdan ekleyin." />
        <main className="min-h-[70vh] flex items-center justify-center bg-[#0A0A0A] text-zinc-100 px-4 py-16">
          <div className="text-center max-w-md bg-[#0F0F12] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 text-[#C5A059]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-serif-luxury text-2xl text-white mb-2">Sepetinizde Ürün Bulunmuyor</h2>
            <p className="text-xs text-zinc-400 font-light mb-8 leading-relaxed">
              Ödeme ve sipariş adımlarına geçebilmek için koleksiyonumuzdan benzersiz heykelsi bir aydınlatma tasarımı seçebilirsiniz.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Koleksiyonu Keşfet</span>
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Siparişi Tamamla | Güvenli Ödeme & Kargo Bilgileri" 
        description="LUMEN ATELIER sipariş tamamlama ekranı. Sepet inceleme, teslimat adresi ve PCI-DSS Seviye 1 sertifikalı iyzico 3D Secure ödeme adımları." 
      />

      <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-[1500px] mx-auto">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
            <Link to="/" className="hover:text-[#C5A059] transition-colors flex items-center gap-1">
              <span>Ana Sayfa</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-200">Sipariş & Ödeme</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-[#C5A059] font-medium">
              {activeTab === 'cart' ? '1. Sepet' : activeTab === 'shipping' ? '2. Kargo Bilgileri' : '3. Ödeme'}
            </span>
          </div>

          {/* PAGE TITLE */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#C5A059] font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PCI-DSS Seviye 1 • 3D Secure</span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-4xl text-white tracking-tight">
                Siparişi Tamamla
              </h1>
            </div>
            
            <div className="text-xs text-zinc-400 font-light flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Misafir veya üye olarak anında işlem</span>
            </div>
          </div>

          {/* ============================================================
              MINIMALIST CENTERED STEP TRACKER (Symbols + Greater-Than Delimiters)
              "bunu kaldir araya 2 tane buyuktur isareti koy yazi fontunu daha modern olanla degistir aradaki boslugu azalr sepet kargo odeme arasinda"
          ============================================================ */}
          <div className="w-full flex items-center justify-center mb-10 px-4">
            <div className="inline-flex items-center justify-center gap-3 sm:gap-6 md:gap-8">
              {stepTabs.map((s, index) => {
                const isActive = activeTab === s.id;
                const isCompleted = (s.id === 'cart' && (activeTab === 'shipping' || activeTab === 'payment')) ||
                                    (s.id === 'shipping' && activeTab === 'payment');
                const Icon = s.icon;

                return (
                  <React.Fragment key={s.id}>
                    <button
                      id={`checkout-tab-${s.id}`}
                      type="button"
                      onClick={() => handleTabClick(s.id)}
                      className="relative flex flex-col items-center group cursor-pointer focus:outline-none"
                    >
                      {/* Circle Icon Badge */}
                      <div className="relative flex items-center justify-center">
                        <div
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border relative shadow-md transition-colors ${
                            isActive
                              ? 'bg-[#C5A059] border-[#E5C378] text-black ring-1 ring-[#C5A059]/40'
                              : isCompleted
                              ? 'bg-[#18181D] border-white/20 text-zinc-200'
                              : 'bg-[#111116] border-white/10 text-zinc-400 hover:text-zinc-100 hover:border-white/20'
                          }`}
                        >
                          <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />

                          {/* Completed Checkmark badge (Sarı / Altın Tik Rozeti) */}
                          {isCompleted && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C5A059] text-black flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Step Title Label - Modern Sans Font */}
                      <div className="mt-2 flex flex-col items-center text-center">
                        <span className={`text-[11px] sm:text-xs font-sans tracking-[0.12em] uppercase font-semibold transition-colors ${
                          isActive ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}>
                          {s.title}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mt-1" />
                        )}
                      </div>
                    </button>

                    {/* 2 Tane Büyüktür İşareti (Sepet ile Kargo ve Kargo ile Ödeme arasına) */}
                    {index < stepTabs.length - 1 && (
                      <div className="flex items-center -translate-y-2.5 select-none" aria-hidden="true">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 shrink-0" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              MAIN CONTENT GRID: ACTIVE STEP VIEW + STICKY ORDER SUMMARY
          ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN: ACTIVE STEP CONTENTS */}
            <div className="lg:col-span-8 space-y-6">
              {/* --------------------------------------------------------
                  TAB 1: SEPET (Ürün İnceleme, Adet Değiştirme, Kupon)
              -------------------------------------------------------- */}
              {activeTab === 'cart' && (
                <section className="bg-[#0F0F12] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-5">
                    <div>
                      <h2 className="font-serif-luxury text-xl sm:text-2xl text-white flex items-center gap-2.5">
                        <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
                        <span>Sepetinizdeki Tasarımlar</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 font-light">
                        Adetleri güncelleyebilir, kupon uygulayabilir ve siparişinizi kontrol edebilirsiniz.
                      </p>
                    </div>
                    <span className="text-xs text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
                      {totalItemCount} Tasarım Parçası
                    </span>
                  </div>

                  {/* Free Shipping Progress Bar */}
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Truck className="w-4 h-4 text-[#C5A059]" />
                        <span>
                          {isFreeShipping 
                            ? 'Tebrikler! Ücretsiz Sigortalı Kargo Kazandınız.' 
                            : `Ücretsiz Kargo İçin: ${formatCurrency(remainingForFreeShipping)} daha ekleyin`}
                        </span>
                      </div>
                      <span className="text-[#C5A059] font-bold font-mono">
                        {isFreeShipping ? 'ÜCRETSİZ' : '₺250'}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#C5A059] to-[#E5C378] h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((currentSubtotal - discountAmount) / shippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-white/5">
                    {items.map((item, idx) => {
                      const itemSubtotal = item.product.price * item.quantity;
                      return (
                        <div key={`${item.product.id}-${item.selectedColor || idx}`} className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {/* Product Thumbnail */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex-shrink-0 relative group">
                              {item.product.images?.[0] ? (
                                <img 
                                  src={item.product.images[0]} 
                                  alt={item.product.name} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                  <ShoppingBag className="w-6 h-6" />
                                </div>
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="space-y-1">
                              <h3 className="font-serif-luxury text-sm sm:text-base text-white font-medium">
                                {item.product.name}
                              </h3>
                              {item.selectedColor && (
                                <div className="inline-block text-[10px] bg-white/5 border border-white/10 text-zinc-300 px-2 py-0.5 rounded-md">
                                  Renk: {item.selectedColor}
                                </div>
                              )}
                              <div className="text-xs text-zinc-400 font-mono">
                                Birim: {formatCurrency(item.product.price)}
                              </div>
                            </div>
                          </div>

                          {/* Controls: Quantity & Total & Remove */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                            {/* Quantity Stepper */}
                            {!directProduct ? (
                              <div className="flex items-center border border-white/10 rounded-xl bg-black/40 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor)}
                                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                  aria-label="Adet Azalt"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-3 text-xs font-mono font-bold text-white min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor)}
                                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                  aria-label="Adet Artır"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-zinc-400 font-mono">
                                Adet: <strong className="text-white">{item.quantity}</strong>
                              </div>
                            )}

                            {/* Line Total */}
                            <div className="font-serif-luxury text-base sm:text-lg text-[#C5A059] font-medium min-w-[5rem] text-right">
                              {formatCurrency(itemSubtotal)}
                            </div>

                            {/* Remove button */}
                            {!directProduct && (
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                                className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                                title="Ürünü Sepetten Kaldır"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon Engine */}
                  <div className="pt-4 border-t border-white/10">
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                      İndirim Kuponu / Promosyon Kodu
                    </label>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <div>
                            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-xs text-emerald-400/80 ml-2">
                              (-{formatCurrency(discountAmount)} İndirim Uygulandı)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs text-zinc-400 hover:text-rose-400 p-1 transition-colors"
                        >
                          Kaldır
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyCoupon(e.currentTarget);
                              }
                            }}
                            placeholder="Kupon kodunuz (örn: LUMEN10)"
                            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 uppercase tracking-wider focus:outline-none focus:border-[#C5A059]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleApplyCoupon(e.currentTarget)}
                          className="px-5 py-2.5 bg-white/10 hover:bg-[#C5A059] hover:text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                          Uygula
                        </button>
                      </div>
                    )}

                    {couponFeedback && (
                      <div className={`text-xs mt-2 flex items-center gap-1.5 ${
                        couponFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {couponFeedback.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{couponFeedback.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Forward to Shipping Action */}
                  <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link
                      to="/"
                      className="text-xs text-zinc-400 hover:text-[#C5A059] transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Alışverişe Devam Et</span>
                    </Link>

                    <button
                      id="proceed-to-shipping-btn"
                      type="button"
                      onClick={handleProceedToShipping}
                      className="w-full sm:w-auto px-8 py-4 bg-[#C5A059] hover:bg-[#d6b26b] active:scale-[0.99] text-black text-xs sm:text-sm font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Kargo Bilgilerine Devam Et</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

            {/* --------------------------------------------------------
                TAB 2: KARGO BİLGİLERİ (Misafir / Üye Adres Formu)
            -------------------------------------------------------- */}
            {activeTab === 'shipping' && (
              <section className="bg-[#0F0F12] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-5">
                    <div>
                      <h2 className="font-serif-luxury text-xl sm:text-2xl text-white flex items-center gap-2.5">
                        <Truck className="w-5 h-5 text-[#C5A059]" />
                        <span>Teslimat ve İletişim Bilgileri</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 font-light">
                        Misafir veya üye olarak sipariş verebilirsiniz. Üyelik zorunlu değildir.
                      </p>
                    </div>

                    {!user ? (
                      <button
                        type="button"
                        onClick={() => openAuthModal('Giriş yaparak kayıtlı adreslerinizi kolayca seçebilirsiniz.')}
                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <User className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Üye Girişi Yap</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium self-start sm:self-auto flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Üye: {user.displayName || user.email}</span>
                      </span>
                    )}
                  </div>

                  {/* Saved Addresses Picker for Logged-in Users */}
                  {user && user.savedAddresses && user.savedAddresses.length > 0 && (
                    <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/10">
                      <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Kayıtlı Adresleriniz</span>
                        <span className="text-[10px] text-zinc-500">Tek tıkla seçin</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {user.savedAddresses.map((sa) => (
                          <div
                            key={sa.id}
                            onClick={() => handleSelectSavedAddress(sa.id)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                              selectedSavedAddressId === sa.id
                                ? 'bg-[#1C1C24] border-[#C5A059] ring-1 ring-[#C5A059]/40'
                                : 'bg-black/30 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white">{sa.title || 'Adresim'}</span>
                              {selectedSavedAddressId === sa.id && (
                                <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                              {sa.addressLine}, {sa.district} / {sa.city}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address Form Inputs */}
                  <div className="space-y-4">
                    {/* Contact details row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          Ad Soyad <span className="text-[#C5A059]">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="shipping-fullname"
                            type="text"
                            value={address.fullName}
                            onChange={(e) => {
                              setAddress({ ...address, fullName: e.target.value });
                              if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: '' });
                            }}
                            placeholder="Adınız ve Soyadınız"
                            className={`w-full pl-10 pr-4 py-2.5 bg-black/40 border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors ${
                              formErrors.fullName ? 'border-rose-500/80 bg-rose-500/5' : 'border-white/10'
                            }`}
                          />
                        </div>
                        {formErrors.fullName && (
                          <p className="text-[11px] text-rose-400 mt-1">{formErrors.fullName}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          Telefon Numarası <span className="text-[#C5A059]">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="shipping-phone"
                            type="tel"
                            value={address.phone}
                            onChange={(e) => {
                              setAddress({ ...address, phone: e.target.value });
                              if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                            }}
                            placeholder="05XX XXX XX XX"
                            className={`w-full pl-10 pr-4 py-2.5 bg-black/40 border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors ${
                              formErrors.phone ? 'border-rose-500/80 bg-rose-500/5' : 'border-white/10'
                            }`}
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="text-[11px] text-rose-400 mt-1">{formErrors.phone}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        E-posta Adresi <span className="text-[#C5A059]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="shipping-email"
                          type="email"
                          value={address.email}
                          onChange={(e) => {
                            setAddress({ ...address, email: e.target.value });
                            if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                          }}
                          placeholder="ornek@alanadi.com (Sipariş takibi için)"
                          className={`w-full pl-10 pr-4 py-2.5 bg-black/40 border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors ${
                            formErrors.email ? 'border-rose-500/80 bg-rose-500/5' : 'border-white/10'
                          }`}
                        />
                      </div>
                      {formErrors.email && (
                        <p className="text-[11px] text-rose-400 mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    {/* City & District & Postal Code */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* City */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          İl <span className="text-[#C5A059]">*</span>
                        </label>
                        <select
                          id="shipping-city"
                          value={address.city}
                          onChange={(e) => {
                            setAddress({ ...address, city: e.target.value });
                            if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                          }}
                          className={`w-full px-3 py-2.5 bg-black/40 border rounded-xl text-xs text-white focus:outline-none focus:border-[#C5A059] transition-colors ${
                            formErrors.city ? 'border-rose-500/80' : 'border-white/10'
                          }`}
                        >
                          {TURKISH_CITIES.map((c) => (
                            <option key={c} value={c} className="bg-zinc-900 text-white">
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* District */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          İlçe <span className="text-[#C5A059]">*</span>
                        </label>
                        <input
                          id="shipping-district"
                          type="text"
                          value={address.district}
                          onChange={(e) => {
                            setAddress({ ...address, district: e.target.value });
                            if (formErrors.district) setFormErrors({ ...formErrors, district: '' });
                          }}
                          placeholder="Örn: Beşiktaş, Çankaya"
                          className={`w-full px-3 py-2.5 bg-black/40 border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors ${
                            formErrors.district ? 'border-rose-500/80 bg-rose-500/5' : 'border-white/10'
                          }`}
                        />
                        {formErrors.district && (
                          <p className="text-[11px] text-rose-400 mt-1">{formErrors.district}</p>
                        )}
                      </div>

                      {/* Postal code */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          Posta Kodu
                        </label>
                        <input
                          id="shipping-postalcode"
                          type="text"
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          placeholder="34000"
                          className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Full Address */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Açık Teslimat Adresi <span className="text-[#C5A059]">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                        <textarea
                          id="shipping-address-line"
                          rows={3}
                          value={address.addressLine}
                          onChange={(e) => {
                            setAddress({ ...address, addressLine: e.target.value });
                            if (formErrors.addressLine) setFormErrors({ ...formErrors, addressLine: '' });
                          }}
                          placeholder="Mahalle, Cadde, Sokak, Bina No, Kat ve Daire numarası..."
                          className={`w-full pl-10 pr-4 py-2.5 bg-black/40 border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors ${
                            formErrors.addressLine ? 'border-rose-500/80 bg-rose-500/5' : 'border-white/10'
                          }`}
                        />
                      </div>
                      {formErrors.addressLine && (
                        <p className="text-[11px] text-rose-400 mt-1">{formErrors.addressLine}</p>
                      )}
                    </div>

                    {/* Invoice Type Radio: Individual vs Corporate */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                        Fatura Türü
                      </label>
                      <div className="grid grid-cols-2 gap-3 max-w-sm">
                        <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          address.invoiceType === 'individual'
                            ? 'bg-[#1C1C24] border-[#C5A059] text-white'
                            : 'bg-black/30 border-white/10 text-zinc-400'
                        }`}>
                          <input
                            type="radio"
                            name="invoiceType"
                            checked={address.invoiceType === 'individual'}
                            onChange={() => setAddress({ ...address, invoiceType: 'individual' })}
                            className="hidden"
                          />
                          <User className="w-4 h-4 text-[#C5A059]" />
                          <span className="text-xs font-medium">Bireysel Fatura</span>
                        </label>

                        <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          address.invoiceType === 'corporate'
                            ? 'bg-[#1C1C24] border-[#C5A059] text-white'
                            : 'bg-black/30 border-white/10 text-zinc-400'
                        }`}>
                          <input
                            type="radio"
                            name="invoiceType"
                            checked={address.invoiceType === 'corporate'}
                            onChange={() => setAddress({ ...address, invoiceType: 'corporate' })}
                            className="hidden"
                          />
                          <Building2 className="w-4 h-4 text-[#C5A059]" />
                          <span className="text-xs font-medium">Kurumsal Fatura</span>
                        </label>
                      </div>

                      {/* Corporate Details Fields */}
                      {address.invoiceType === 'corporate' && (
                        <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                          <div>
                            <label className="block text-xs text-zinc-300 mb-1">
                              Firma Unvanı <span className="text-[#C5A059]">*</span>
                            </label>
                            <input
                              type="text"
                              value={address.companyName || ''}
                              onChange={(e) => setAddress({ ...address, companyName: e.target.value })}
                              placeholder="Şirket Tam Resmi Unvanı"
                              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                            />
                            {formErrors.companyName && (
                              <p className="text-[11px] text-rose-400 mt-1">{formErrors.companyName}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-zinc-300 mb-1">Vergi Dairesi</label>
                              <input
                                type="text"
                                value={address.taxOffice || ''}
                                onChange={(e) => setAddress({ ...address, taxOffice: e.target.value })}
                                placeholder="Vergi Dairesi"
                                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-300 mb-1">
                                Vergi Numarası / VKN <span className="text-[#C5A059]">*</span>
                              </label>
                              <input
                                type="text"
                                value={address.taxNumber || ''}
                                onChange={(e) => setAddress({ ...address, taxNumber: e.target.value })}
                                placeholder="10 Haneli VKN"
                                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                              />
                              {formErrors.taxNumber && (
                                <p className="text-[11px] text-rose-400 mt-1">{formErrors.taxNumber}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order / Delivery Note */}
                    <div className="pt-2">
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Kurye & Sipariş Notu (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={address.orderNote || ''}
                        onChange={(e) => setAddress({ ...address, orderNote: e.target.value })}
                        placeholder="Örn: Zile basmayın, güvenliğe bırakılabilir vb."
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C5A059] transition-colors"
                      />
                    </div>

                    {/* Option to save address for member */}
                    {user && (
                      <div className="pt-2">
                        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveToAccount}
                            onChange={(e) => setSaveToAccount(e.target.checked)}
                            className="rounded border-zinc-700 bg-black/50 text-[#C5A059] focus:ring-0"
                          />
                          <span>Bu teslimat adresini hesabıma sonraki siparişler için kaydet</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Actions: Back to Cart or Proceed to Payment */}
                  <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('cart');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Sepete Geri Dön</span>
                    </button>

                    <button
                      id="proceed-to-payment-btn"
                      type="button"
                      onClick={handleProceedToPayment}
                      className="w-full sm:w-auto px-8 py-4 bg-[#C5A059] hover:bg-[#d6b26b] active:scale-[0.99] text-black text-xs sm:text-sm font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Ödeme Adımına Geç</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

            {/* --------------------------------------------------------
                TAB 3: ÖDEME (iyzico 3D Secure, Havale)
            -------------------------------------------------------- */}
            {activeTab === 'payment' && (
              <section className="bg-[#0F0F12] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-5">
                    <div>
                      <h2 className="font-serif-luxury text-xl sm:text-2xl text-white flex items-center gap-2.5">
                        <CreditCard className="w-5 h-5 text-[#C5A059]" />
                        <span>Ödeme Yöntemi ve Güvenli Onay</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 font-light">
                        Tercih ettiğiniz ödeme yöntemini seçerek siparişinizi onaylayabilirsiniz.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>TLS Şifreli 3D Secure Güvenlik</span>
                    </div>
                  </div>

                  {/* Delivery Address Review Pill */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white/5 text-[#C5A059] flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{address.fullName}</span>
                          <span className="text-zinc-500 font-normal">({address.phone})</span>
                        </div>
                        <p className="text-zinc-400 mt-0.5 font-light line-clamp-1">
                          {address.addressLine}, {address.district} / {address.city}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('shipping')}
                      className="text-xs text-[#C5A059] hover:underline self-start sm:self-auto font-medium"
                    >
                      Adresi Değiştir
                    </button>
                  </div>

                  {/* Payment Method Cards */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Ödeme Seçenekleri
                    </label>

                    {/* 1. Credit Card with iyzico */}
                    <div
                      onClick={() => setPaymentMethod('iyzico')}
                      className={`p-4 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                        paymentMethod === 'iyzico'
                          ? 'bg-gradient-to-br from-[#1C1C24] to-[#121217] border-[#C5A059] ring-1 ring-[#C5A059]/40 shadow-lg'
                          : 'bg-black/30 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${paymentMethod === 'iyzico' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-zinc-400'}`}>
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-serif-luxury font-medium text-white block">
                              Kredi / Banka Kartı (iyzico 3D Secure)
                            </span>
                            <span className="text-[11px] text-zinc-400 font-light">
                              Tüm kartlara peşin veya 12 aya varan taksit imkanı
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <img src="/payment/iyzico.svg" alt="iyzico" className="h-4 w-auto object-contain opacity-90" />
                          <img src="/payment/visa.svg" alt="Visa" className="h-5 w-auto object-contain opacity-85" />
                          <img src="/payment/mastercard.svg" alt="Mastercard" className="h-5 w-auto object-contain opacity-85" />
                        </div>
                      </div>

                      {paymentMethod === 'iyzico' && (
                        <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-zinc-400 space-y-1.5">
                          <p>
                            Siparişi Tamamla butonuna tıkladığınızda TCMB lisanslı ve PCI-DSS Seviye 1 sertifikalı <strong className="text-white">iyzico Güvenli Ödeme</strong> sayfasına yönlendirileceksiniz.
                          </p>
                          <div className="flex items-center gap-2 text-zinc-300 pt-1">
                            <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Kart bilgileriniz asla saklanmaz, 3D Secure ve TLS güvencesiyle bankanıza iletilir.</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Havale / EFT (%3 Discount) */}
                    <div
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-4 sm:p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'bg-gradient-to-br from-[#1C1C24] to-[#121217] border-[#C5A059] ring-1 ring-[#C5A059]/40 shadow-lg'
                          : 'bg-black/30 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${paymentMethod === 'bank_transfer' ? 'bg-[#C5A059] text-black' : 'bg-white/5 text-zinc-400'}`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-serif-luxury font-medium text-white block">
                              Havale / EFT ile Ödeme
                            </span>
                            <span className="text-[11px] text-zinc-400 font-light">
                              {COMPANY.bank.bankName} kurumsal hesabımıza doğrudan transfer
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] bg-[#C5A059] text-black font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          %3 Anında İndirim
                        </span>
                      </div>

                      {paymentMethod === 'bank_transfer' && (
                        <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-zinc-400 space-y-2">
                          <div className="bg-black/50 p-3 rounded-xl border border-white/5 font-mono">
                            <div className="text-emerald-400 font-semibold mb-1">
                              ✓ %3 Nakit Havale İndirimi ({formatCurrency(paymentDiscount)}) toplamdan düşüldü!
                            </div>
                            <div className="text-zinc-300">{COMPANY.bank.bankName}: {COMPANY.bank.iban}</div>
                            <div className="text-zinc-400 text-[10px] mt-0.5">Alıcı: {COMPANY.bank.accountHolder}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legal Agreements & Marketing Consent */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    {/* Optional Electronic Commercial Message Consent (Unchecked by default) */}
                    <label className="flex items-start gap-2.5 text-xs text-zinc-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="marketing-consent-checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-700 bg-black/50 text-[#C5A059] focus:ring-0 flex-shrink-0 cursor-pointer"
                      />
                      <span className="leading-relaxed">
                        Kampanya ve yeni ürün duyurularından e-posta ile haberdar olmak istiyorum. Onayımı dilediğim zaman geri çekebilirim.
                      </span>
                    </label>

                    {/* Mandatory Contract Checkbox */}
                    <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="terms-accepted-checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-700 bg-black/50 text-[#C5A059] focus:ring-0 flex-shrink-0 cursor-pointer"
                      />
                      <span className="leading-relaxed">
                        <Link to="/on-bilgilendirme-formu" target="_blank" rel="noopener noreferrer" className="text-[#C5A059] underline hover:text-white font-medium">
                          Ön Bilgilendirme Formu
                        </Link>
                        &apos;nu ve{' '}
                        <Link to="/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener noreferrer" className="text-[#C5A059] underline hover:text-white font-medium">
                          Mesafeli Satış Sözleşmesi
                        </Link>
                        &apos;ni okudum, onaylıyorum. <span className="text-rose-400 font-semibold">*</span>
                      </span>
                    </label>
                  </div>

                  {/* Complete Order Action */}
                  <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('shipping');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kargo Bilgilerine Dön</span>
                    </button>

                    <button
                      id="place-order-submit-btn"
                      type="button"
                      disabled={loading || !termsAccepted}
                      onClick={handlePlaceOrder}
                      className="w-full sm:w-auto px-10 h-12 bg-[#C5A059] hover:bg-[#d6b26b] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] text-black text-xs sm:text-sm font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-[#C5A059]"
                      title={paymentMethod === 'iyzico' ? "iyzico ile Güvenli Öde" : "Güvenli Ödemeyi Tamamla"}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span className="text-black text-xs font-semibold normal-case">İşlem Yapılıyor...</span>
                        </div>
                      ) : paymentMethod === 'iyzico' ? (
                        <img 
                          src="/payment/iyzico-ile-ode-dark.svg" 
                          alt="iyzico ile Öde" 
                          className="h-5 sm:h-5.5 w-auto object-contain" 
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>Güvenli Ödemeyi Tamamla ({formatCurrency(finalPayableTotal)})</span>
                        </div>
                      )}
                    </button>
                  </div>
                </section>
              )}

            </div>

            {/* RIGHT COLUMN: STICKY MODERN LUXURY ORDER SUMMARY */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <div className="bg-[#0F0F12] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-serif-luxury text-lg text-white">Sipariş Özeti</h3>
                  <span className="text-xs text-zinc-400 font-mono">{totalItemCount} Tasarım</span>
                </div>

                {/* Items preview list */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs text-white font-medium truncate">{item.product.name}</h4>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {item.quantity} Adet x {formatCurrency(item.product.price)}
                        </div>
                      </div>
                      <div className="text-xs text-[#C5A059] font-serif-luxury">
                        {formatCurrency(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Ara Toplam</span>
                    <span className="font-mono">{formatCurrency(currentSubtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Kupon İndirimi {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                      <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  {paymentDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Havale/EFT İndirimi (%3)</span>
                      <span className="font-mono">-{formatCurrency(paymentDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-zinc-300">
                    <span>Sigortalı Özel Kargo</span>
                    <span className={`font-mono ${isFreeShipping ? 'text-emerald-400 font-bold' : ''}`}>
                      {isFreeShipping ? 'ÜCRETSİZ' : '₺250'}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-white/10">
                    <span className="text-sm font-semibold text-white">Ödenecek Tutar</span>
                    <span className="font-serif-luxury text-xl sm:text-2xl text-[#C5A059] font-bold">
                      {formatCurrency(finalPayableTotal)}
                    </span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/30 border border-white/5">
                    <CheckCheck className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>14 Gün İade</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/30 border border-white/5">
                    <Truck className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>Hızlı Teslimat</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/30 border border-white/5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>2 Yıl Garanti</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/30 border border-white/5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    <span>3D Secure</span>
                  </div>
                </div>

                {/* Supported Payment Cards without highlights */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="text-zinc-500">Güvenli Kart Altyapısı</span>
                  <div className="flex items-center gap-2">
                    <img src="/payment/iyzico.svg" alt="iyzico" className="h-3.5 w-auto object-contain opacity-90" />
                    <img src="/payment/visa.svg" alt="Visa" className="h-4 w-auto object-contain opacity-75" />
                    <img src="/payment/mastercard.svg" alt="Mastercard" className="h-4 w-auto object-contain opacity-75" />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </>
  );
};
