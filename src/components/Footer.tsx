import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, SlidersHorizontal } from 'lucide-react';
import { Category } from '../types';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface FooterProps {
  categories: Category[];
  isAdmin: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  categories,
  isAdmin,
}) => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-[#08080A] border-t border-white/10 text-zinc-400 text-xs">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex flex-col inline-block group">
              <span className="font-serif-luxury text-2xl tracking-[0.25em] font-semibold text-white group-hover:text-[#C5A059] transition-colors uppercase">
                {settings.brandName || 'LUMEN'}
              </span>
              <span className="text-[9px] tracking-[0.4em] text-[#C5A059] uppercase -mt-1 font-light">
                {settings.brandTagline || "ATELIER D'ART"}
              </span>
            </Link>
            <p className="text-zinc-400 text-xs font-light max-w-sm leading-relaxed">
              {settings.footerBrandText || settings.brandDescription}
            </p>
            <div className="flex items-center gap-3 pt-2 text-zinc-400">
              <div className="flex items-center gap-1 text-[11px] text-[#C5A059]">
                <ShieldCheck className="w-4 h-4" />
                <span>{settings.footerQualityBadge || '%100 Orijinal Tasarım'}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-widest">
              {settings.footerCol2Title || 'Hizmetler & Destek'}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/ozel-tasarim" className="hover:text-[#C5A059] transition-colors">
                  Özel Tasarım Hizmeti
                </Link>
              </li>
              <li>
                <Link to="/ozel-tasarim" className="hover:text-[#C5A059] transition-colors">
                  Proje & B2B Talepleri
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#C5A059] transition-colors">
                  Sigortalı Kargo & Teslimat
                </Link>
              </li>
              <li>
                <Link to="/ozel-tasarim" className="hover:text-[#C5A059] transition-colors">
                  Özel Tasarım İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Secure & Admin */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-widest">
              {settings.footerCol3Title || 'Güvenli Alışveriş'}
            </h4>
            <p className="text-[11px] text-zinc-500 font-light leading-relaxed">
              Tüm ödemeler 256-Bit SSL şifreleme ve Stripe altyapısı ile güvence altındadır.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 pt-1">
              <CreditCard className="w-5 h-5 text-[#C5A059]" />
              <span className="text-[11px]">Visa, Mastercard, Amex, Apple Pay</span>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => navigate('/admin/urunler')}
                  className="inline-flex items-center gap-2 text-xs text-[#C5A059] hover:underline font-semibold"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Admin Yönetim Portalı</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-light">
          <p>{settings.footerCopyrightText || '© 2025 LUMEN Atelier. Tüm Hakları Saklıdır.'}</p>
          <div className="flex items-center gap-6">
            <Link to="/ozel-tasarim" className="hover:text-zinc-300 transition-colors">Gizlilik Politikası</Link>
            <Link to="/ozel-tasarim" className="hover:text-zinc-300 transition-colors">Kullanım Koşulları</Link>
            <Link to="/ozel-tasarim" className="hover:text-zinc-300 transition-colors">Mesafeli Satış Sözleşmesi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
