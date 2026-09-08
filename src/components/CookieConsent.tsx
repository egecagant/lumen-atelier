import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X } from 'lucide-react';

interface CookieConsentProps {
  analyticsEnabled?: boolean;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ analyticsEnabled = false }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only display if analytics flag is enabled and user has not made a choice yet
    if (!analyticsEnabled) {
      setVisible(false);
      return;
    }

    const savedChoice = localStorage.getItem('lumen_cookie_consent');
    if (!savedChoice) {
      setVisible(true);
    }
  }, [analyticsEnabled]);

  const handleAcceptAll = () => {
    localStorage.setItem('lumen_cookie_consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    }));
    setVisible(false);
  };

  const handleOnlyNecessary = () => {
    localStorage.setItem('lumen_cookie_consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside 
      aria-label="Çerez İzni"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300"
    >
      <div className="bg-[#121216] border border-white/15 rounded-2xl p-5 shadow-2xl backdrop-blur-xl text-zinc-200 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C5A059] font-semibold">
            <Cookie className="w-4 h-4" />
            <span>Çerez ve Gizlilik Tercihleri</span>
          </div>
          <button
            onClick={handleOnlyNecessary}
            aria-label="Kapat"
            className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-light leading-relaxed">
          Sitemizde temel alışveriş fonksiyonları (sepet, oturum) için zorunlu teknik çerezler kullanılmaktadır. 
          Deneyiminizi geliştirmek ve istatistiksel analiz amacıyla kullanılan çerezleri kabul edebilir veya yalnızca zorunlu olanlarla devam edebilirsiniz.{' '}
          <Link to="/cerez-politikasi" className="text-[#C5A059] underline hover:text-white">
            Çerez Politikamızı İnceleyin
          </Link>
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={handleOnlyNecessary}
            className="flex-1 py-2 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-zinc-300 font-medium transition-colors cursor-pointer"
          >
            Yalnızca Zorunlu
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 py-2 px-3 rounded-xl bg-[#C5A059] hover:bg-[#d6b26b] text-black text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </aside>
  );
};
