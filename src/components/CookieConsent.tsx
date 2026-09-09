import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X, ChevronDown, ChevronUp, Check, Settings2 } from 'lucide-react';

interface CookieConsentProps {
  analyticsEnabled?: boolean;
}

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'lumen_cookie_consent';

export const CookieConsent: React.FC<CookieConsentProps> = () => {
  const [visible, setVisible] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(true);

  useEffect(() => {
    // Check if consent has already been recorded
    try {
      const savedChoice = localStorage.getItem(STORAGE_KEY);
      if (!savedChoice) {
        // Small delay so it animates in smoothly after initial page render
        const timer = setTimeout(() => {
          setVisible(true);
        }, 600);
        return () => clearTimeout(timer);
      } else {
        const parsed: ConsentState = JSON.parse(savedChoice);
        setAnalyticsConsent(!!parsed.analytics);
        setMarketingConsent(!!parsed.marketing);
      }
    } catch {
      setVisible(true);
    }

    // Allow re-opening from anywhere (e.g., Footer or Cookie Policy page)
    const handleOpen = () => {
      setIsCustomizing(true);
      setVisible(true);
    };

    window.addEventListener('open-cookie-consent', handleOpen);
    return () => window.removeEventListener('open-cookie-consent', handleOpen);
  }, []);

  const saveConsent = (consent: Omit<ConsentState, 'timestamp'>) => {
    const data: ConsentState = {
      ...consent,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: data }));
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
    setIsCustomizing(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true
    });
  };

  const handleOnlyNecessary = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false
    });
  };

  const handleSaveCustom = () => {
    saveConsent({
      necessary: true,
      analytics: analyticsConsent,
      marketing: marketingConsent
    });
  };

  if (!visible) return null;

  return (
    <aside
      id="cookie-consent-banner"
      aria-label="Çerez İzni Bildirimi"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#121217]/95 border border-white/15 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl text-zinc-200 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
            <div className="p-1.5 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/30">
              <Cookie className="w-4 h-4 text-[#C5A059]" />
            </div>
            <span>Çerez ve Gizlilik Tercihleri</span>
          </div>

          <button
            type="button"
            onClick={handleOnlyNecessary}
            aria-label="Kapat ve yalnızca zorunluları kabul et"
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 font-light leading-relaxed">
          Sitemizde size en iyi alışveriş deneyimini sunmak, sepetinizin güvenliğini sağlamak ve site trafiğimizi analiz etmek için çerezler kullanmaktayız. Tercihlerinizi özelleştirebilir veya tüm çerezlere izin verebilirsiniz.{' '}
          <Link
            to="/cerez-politikasi"
            className="text-[#C5A059] underline hover:text-[#d6b26b] transition-colors ml-1"
          >
            Çerez Politikası
          </Link>
        </p>

        {/* Detailed customization drawer */}
        {isCustomizing && (
          <div className="space-y-3 pt-2 border-t border-white/10 animate-in fade-in duration-200">
            {/* 1. Zorunlu */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center gap-1.5 text-white font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Zorunlu Teknik Çerezler</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-light leading-tight">
                  Sepet, oturum açma ve güvenli ödeme için zorunludur; kapatılamaz.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-[#C5A059] bg-[#C5A059]/10 px-2 py-1 rounded-md shrink-0">
                Her Zaman Aktif
              </span>
            </div>

            {/* 2. Analitik */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs cursor-pointer hover:bg-white/[0.05] transition-colors">
              <div className="space-y-0.5 pr-2">
                <span className="text-white font-medium block">Analitik & Performans</span>
                <p className="text-[11px] text-zinc-500 font-light leading-tight">
                  Siteyi kaç kişinin ziyaret ettiğini ve performansını ölçmemizi sağlar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analyticsConsent}
                onChange={(e) => setAnalyticsConsent(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 text-[#C5A059] focus:ring-[#C5A059] bg-black/40 cursor-pointer"
              />
            </label>

            {/* 3. Pazarlama */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs cursor-pointer hover:bg-white/[0.05] transition-colors">
              <div className="space-y-0.5 pr-2">
                <span className="text-white font-medium block">Kişiselleştirme & Pazarlama</span>
                <p className="text-[11px] text-zinc-500 font-light leading-tight">
                  Size özel koleksiyon ve tasarım duyuruları sunmak için kullanılır.
                </p>
              </div>
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 text-[#C5A059] focus:ring-[#C5A059] bg-black/40 cursor-pointer"
              />
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {!isCustomizing ? (
            <>
              <button
                type="button"
                onClick={() => setIsCustomizing(true)}
                className="order-3 sm:order-1 py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Tercihler</span>
              </button>
              <button
                type="button"
                onClick={handleOnlyNecessary}
                className="order-2 py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-zinc-300 font-medium transition-colors cursor-pointer"
              >
                Yalnızca Zorunlu
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="order-1 sm:order-3 flex-1 py-2 px-4 rounded-xl bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold transition-all shadow-lg hover:shadow-[#C5A059]/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Çerezlere İzin Ver</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsCustomizing(false)}
                className="py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 py-2 px-3 rounded-xl border border-[#C5A059]/50 hover:bg-[#C5A059]/10 text-[#C5A059] text-xs font-semibold transition-colors cursor-pointer"
              >
                Seçilenleri Kaydet
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 py-2 px-4 rounded-xl bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                Tümüne İzin Ver
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
