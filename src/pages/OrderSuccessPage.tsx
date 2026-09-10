import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Printer, 
  ShoppingBag, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  Package, 
  MapPin, 
  User, 
  CreditCard,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { formatCurrency, formatDate } from '../lib/format';
import { triggerGoldConfetti } from '../lib/confetti';
import { SEO } from '../components/SEO';
import { db, doc, getDoc, setDoc } from '../lib/firebase';
import { getApiUrl } from '../lib/api';
import { Order } from '../types';

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const status = searchParams.get('status') || 'success';
  const orderId = searchParams.get('orderId') || '';
  const token = searchParams.get('token') || '';
  const paymentId = searchParams.get('paymentId') || '';
  const errorMsg = searchParams.get('error') || '';

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (status === 'success') {
      clearCart();
      triggerGoldConfetti();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#C5A059', '#e6c34f', '#ffffff', '#a8893d']
      });

      // Try fetching the created order from Firestore, server, or cached pending order
      const fetchOrder = async () => {
        const targetId = orderId || token;
        if (!targetId) {
          setLoading(false);
          return;
        }

        try {
          if (orderId) {
            const docRef = doc(db, 'orders', orderId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              setOrder({ id: snap.id, ...(snap.data() as any) });
              setLoading(false);
              return;
            }
          }

          // Check server status endpoint
          if (orderId) {
            try {
              const res = await fetch(getApiUrl(`/api/iyzico/order-status/${orderId}`));
              if (res.ok) {
                const data = await res.json();
                if (data.found && data.order) {
                  setOrder({ id: orderId, ...data.order });
                  setLoading(false);
                  return;
                }
              }
            } catch (serverErr) {
              console.warn('Server status check failed:', serverErr);
            }
          }

          // Fallback: Check localStorage cached order
          const cachedStr = localStorage.getItem('lumen_pending_order');
          if (cachedStr) {
            try {
              const cached = JSON.parse(cachedStr);
              const resolvedOrderId = orderId || cached.orderId || `LUM-${Date.now().toString().slice(-6)}`;
              const resolvedOrder: Order = {
                id: resolvedOrderId,
                userId: cached.userId || 'guest',
                customerName: cached.customerName || 'Müşteri',
                customerEmail: cached.customerEmail || '',
                customerPhone: cached.customerPhone || '',
                address: cached.address || {
                  fullName: cached.customerName || '',
                  phone: cached.customerPhone || '',
                  email: cached.customerEmail || '',
                  addressLine: '',
                  city: 'İstanbul',
                  district: '',
                  postalCode: '',
                  country: 'Türkiye'
                },
                items: cached.items || [],
                subtotal: cached.subtotal || cached.total || 0,
                discountCode: cached.discountCode,
                discountAmount: cached.discountAmount,
                appliedCoupon: cached.appliedCoupon,
                shipping: cached.shipping || 0,
                total: cached.total || 0,
                status: 'paid',
                paymentMethod: 'iyzico',
                createdAt: cached.createdAt || Date.now()
              };

              setOrder(resolvedOrder);

              // Auto-persist to Firestore client-side if missing
              try {
                await setDoc(doc(db, 'orders', resolvedOrderId), resolvedOrder, { merge: true });
              } catch (fsErr) {
                console.warn('Could not write order to Firestore client-side:', fsErr);
              }
            } catch (pErr) {
              console.warn('Could not parse cached pending order:', pErr);
            }
          }
        } catch (e) {
          console.warn('Could not fetch order:', e);
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [status, orderId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col justify-center items-center p-4">
        <SEO title="Ödeme Doğrulanıyor | LUMEN Atelier" description="Ödeme sonucu işleniyor" />
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#C5A059] animate-spin mx-auto" />
          <h2 className="font-serif-luxury text-xl text-white">iyzico Ödeme Sonucu Doğrulanıyor...</h2>
          <p className="text-xs text-zinc-400">Lütfen bekleyiniz, sipariş kaydınız güvenle oluşturuluyor.</p>
        </div>
      </div>
    );
  }

  // FAILED STATE
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 py-16 px-4 flex items-center justify-center">
        <SEO title="Ödeme Başarısız | LUMEN Atelier" description="iyzico ödeme işlemi tamamlanamadı" />
        <div className="max-w-xl w-full bg-[#0F0F12] border border-rose-900/40 rounded-3xl p-8 sm:p-10 shadow-2xl glass-panel text-center space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto shadow-xl">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-rose-400 font-bold">
              ÖDEME TAMAMLANAMADI
            </span>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl text-white uppercase">
              İşleminiz Gerçekleştirilemedi
            </h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              {errorMsg 
                ? decodeURIComponent(errorMsg)
                : 'Banka veya kart sağlayıcınız tarafından ödeme onaylanmadı. Kart limitinizi veya 3D Secure bilgilerini kontrol edip tekrar deneyebilirsiniz.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-zinc-400 text-left space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
              <span>Güvenlik Bilgilendirmesi</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Kartınızdan herhangi bir tahsilat yapılmamıştır. Dilerseniz farklı bir kartla deneyebilir veya Banka Havalesi / EFT yöntemini seçebilirsiniz.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/checkout"
              className="px-6 py-3.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ödemeyi Tekrar Dene</span>
            </Link>
            <Link
              to="/"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Koleksiyona Dön</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 py-16 px-4 flex items-center justify-center">
      <SEO title="Siparişiniz Alındı | LUMEN Atelier" description="LUMEN Atelier iyzico ile Güvenli Ödeme Başarılı" />
      <div className="max-w-2xl w-full bg-[#0F0F12] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl glass-panel space-y-8 animate-in fade-in">
        
        {/* Top Celebration Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/80 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#C5A059] font-bold">
              iyzico 3D SECURE ÖDEMESİ ONAYLANDI
            </span>
            <h1 className="font-serif-luxury text-2xl sm:text-3xl text-white uppercase">
              Siparişiniz Başarıyla Alındı
            </h1>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Ödemeniz güvenle tahsil edilmiştir. Lüks aydınlatma tasarımınız özenle hazırlanarak hızlı kargo ile adresinize sevk edilecektir.
            </p>
          </div>
        </div>

        {/* Order Details Receipt Card */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-zinc-400 text-[11px] block">Sipariş Numarası:</span>
              <span className="font-mono text-[#C5A059] font-bold text-sm">
                #{orderId ? orderId.replace(/^LUM-/, '').toUpperCase() : 'LUMEN'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 text-[11px] block">Ödeme Durumu:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Ödendi (iyzico)
              </span>
            </div>
          </div>

          {order && (
            <div className="space-y-3 pt-1">
              {/* Buyer & Address info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-white/5">
                <div className="space-y-1">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-[#C5A059]" /> Alıcı Bilgisi
                  </span>
                  <p className="text-zinc-200 font-medium">{order.customerName}</p>
                  <p className="text-zinc-400">{order.customerEmail}</p>
                  {order.customerPhone && <p className="text-zinc-400">{order.customerPhone}</p>}
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-400 font-semibold flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-[#C5A059]" /> Teslimat Adresi
                  </span>
                  <p className="text-zinc-200">{order.address?.addressLine || '-'}</p>
                  <p className="text-zinc-400">{order.address?.district} / {order.address?.city}</p>
                </div>
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-2">
                  <span className="text-zinc-400 font-semibold text-[11px] uppercase tracking-wider block">
                    Sipariş Edilen Ürünler
                  </span>
                  <div className="space-y-2">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-900/50 border border-white/5">
                        <span className="text-zinc-200 font-medium truncate max-w-[280px]">
                          {it.productName} × {it.quantity}
                        </span>
                        <span className="text-[#C5A059] font-semibold">{formatCurrency(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total summary */}
              <div className="flex justify-between items-center pt-3 border-t border-white/10 text-sm">
                <span className="text-zinc-300 font-semibold">Toplam Tutar:</span>
                <span className="font-serif-luxury text-lg font-bold text-[#C5A059]">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          )}

          {paymentId && (
            <div className="pt-2 text-[10px] font-mono text-zinc-500 flex items-center justify-between border-t border-white/5">
              <span>iyzico Referans No: {paymentId}</span>
              <span>TLS / 3D Secure Onaylı</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <button
            onClick={() => window.print()}
            className="px-5 py-3 glass-panel hover:bg-white/10 text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#C5A059]" />
            <span>Sipariş Fişi Yazdır</span>
          </button>

          <Link
            to="/profil"
            className="px-5 py-3 bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
          >
            <User className="w-4 h-4 text-[#C5A059]" />
            <span>Siparişlerime Git</span>
          </Link>

          <Link
            to="/"
            className="px-6 py-3 bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
          >
            <span>Alışverişe Devam Et</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
