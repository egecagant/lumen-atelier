import React from 'react';
import { Mail, Instagram, Lock } from 'lucide-react';

interface MaintenanceScreenProps {
  onOpenAuth?: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col justify-between items-center px-6 py-12 sm:py-16 selection:bg-[#C5A059]/30 selection:text-white">
      {/* Top Bar / Status */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
          <span>Bakım Modu</span>
        </div>

        {onOpenAuth && (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors font-mono tracking-wider cursor-pointer"
            title="Bypass testi için yönetici girişi"
          >
            <Lock className="w-3 h-3 text-[#C5A059]" />
            <span>Yönetici Girişi</span>
          </button>
        )}
      </div>

      {/* Main Center Box */}
      <div className="w-full max-w-xl text-center my-auto py-12">
        {/* Brand Name */}
        <h1 className="font-serif-luxury text-3xl sm:text-5xl lg:text-6xl text-white tracking-[0.18em] uppercase font-light">
          LUMEN ATELIER
        </h1>

        {/* Minimalist Divider */}
        <div className="w-12 h-px bg-[#C5A059]/50 mx-auto my-6 sm:my-8" />

        {/* Short Message */}
        <p className="text-zinc-300 text-base sm:text-lg font-light leading-relaxed max-w-md mx-auto">
          Sitemiz kısa bir bakımda. Çok yakında tekrar buradayız.
        </p>

        {/* Contact & Social Links */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="mailto:hello@lumenlatelier.com"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs sm:text-sm text-zinc-200 hover:text-white transition-all group"
          >
            <Mail className="w-4 h-4 text-[#C5A059]" />
            <span className="tracking-wide">hello@lumenlatelier.com</span>
          </a>

          <a
            href="https://www.instagram.com/lumenn.atelier/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs sm:text-sm text-zinc-200 hover:text-white transition-all group"
          >
            <Instagram className="w-4 h-4 text-[#C5A059]" />
            <span className="tracking-wide">@lumenn.atelier</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-2xl text-center text-xs text-zinc-600 font-light">
        <p>© {new Date().getFullYear()} LUMEN L'atelier. Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
