import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Instagram } from 'lucide-react';
import { Category } from '../types';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { COMPANY } from '../lib/companyInfo';

interface FooterProps {
  categories: Category[];
  isAdmin: boolean;
}

export const Footer: React.FC<FooterProps> = () => {
  const { settings } = useSiteSettings();

  const brandDisplayName = settings.brandName || 'LUMEN';
  const brandTaglineDisplay = settings.brandTagline || "ATELIER D'ART";

  return (
    <footer className="bg-[#08080A] border-t border-white/10 text-zinc-400 text-xs">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Col 1: Brand & Contact */}
          <div className="lg:col-span-4 space-y-3">
            <Link to="/" className="inline-flex items-center group focus:outline-none">
              {settings.brandLogoUrl ? (
                <img 
                  src={settings.brandLogoUrl} 
                  alt={brandDisplayName} 
                  className="h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <span className="font-serif-luxury text-2xl tracking-[0.24em] font-semibold text-white group-hover:text-zinc-200 transition-colors uppercase leading-none">
                  {brandDisplayName}
                </span>
              )}
            </Link>

            {/* Official Company Contact Details & Instagram (Clean text, no button) */}
            <div className="space-y-2 pt-1 text-[11px] text-zinc-400 font-light border-t border-white/5">
              <div className="flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <a
                  href={COMPANY.instagramUrl || "https://www.instagram.com/lumenn.atelier/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="hover:text-white transition-colors"
                >
                  {COMPANY.instagramHandle || '@lumenn.atelier'}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                <span className="leading-snug">{COMPANY.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <a href={`tel:${COMPANY.phone}`} className="hover:text-white transition-colors">{COMPANY.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition-colors">{COMPANY.email}</a>
              </div>
            </div>
          </div>

          {/* Col 2: Alışveriş & Atölye */}
          <div className="lg:col-span-2 space-y-2.5">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-widest">
              Alışveriş & Atölye
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/koleksiyon/tum-urunler" className="hover:text-[#C5A059] transition-colors">
                  Tüm Koleksiyon
                </Link>
              </li>
              <li>
                <Link to="/hakkimizda" className="hover:text-[#C5A059] transition-colors">
                  Hakkımızda & Atölye
                </Link>
              </li>
              <li>
                <Link to="/teslimat-ve-iade" className="hover:text-[#C5A059] transition-colors">
                  Teslimat & İade Koşulları
                </Link>
              </li>
              <li>
                <Link to="/ozel-tasarim" className="hover:text-[#C5A059] transition-colors">
                  Özel Tasarım & Mimari
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Yasal & Tüketici Hakları (No icon / logo) */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-widest">
              Yasal & Tüketici Hakları
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/mesafeli-satis-sozlesmesi" className="hover:text-[#C5A059] transition-colors">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <Link to="/on-bilgilendirme-formu" className="hover:text-[#C5A059] transition-colors">
                  Ön Bilgilendirme Formu
                </Link>
              </li>
              <li>
                <Link to="/cayma-formu" className="hover:text-[#C5A059] transition-colors">
                  Örnek Cayma Formu
                </Link>
              </li>
              <li>
                <Link to="/gizlilik-politikasi" className="hover:text-[#C5A059] transition-colors">
                  Gizlilik ve KVKK Politikası
                </Link>
              </li>
              <li>
                <Link to="/cerez-politikasi" className="hover:text-[#C5A059] transition-colors">
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-consent'))}
                  className="hover:text-[#C5A059] transition-colors text-left cursor-pointer"
                >
                  Çerez Tercihleri
                </button>
              </li>
              <li>
                <Link to="/kullanim-kosullari" className="hover:text-[#C5A059] transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Güvenli Ödeme & Lojistik */}
          <div className="lg:col-span-3 space-y-2.5">
            <h4 className="font-semibold text-zinc-200 text-xs uppercase tracking-widest">
              {settings.footerCol3Title || 'Güvenli Ödeme Altyapısı'}
            </h4>
            <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
              Ödemeler PCI-DSS Seviye 1 sertifikalı iyzico 3D Secure güvencesiyle alınır.
            </p>

            {/* Payment Logos Strip */}
            <div className="pt-1">
              <div className="flex items-center gap-3">
                <img src="/payment/iyzico.svg" alt="iyzico" className="h-4 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
                <img src="/payment/visa.svg" alt="Visa" className="h-4.5 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity" />
                <img src="/payment/mastercard.svg" alt="Mastercard" className="h-4.5 w-auto object-contain opacity-75 hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="pt-1 text-[11px] text-zinc-400 border-t border-white/5 font-light">
              Kargo Çözüm Ortağı: {COMPANY.carrier}
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 font-light">
          <p>© 2026 {COMPANY.brandName}. Tüm Hakları Saklıdır.</p>
        </div>
      </div>
    </footer>
  );
};

